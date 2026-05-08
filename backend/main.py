import os
import uuid
import hashlib
import base64
from datetime import datetime, timedelta
from typing import List

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import or_
from jose import JWTError, jwt
from passlib.context import CryptContext
from dotenv import load_dotenv

from database import engine, Base, get_db
import models, schemas

load_dotenv()

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "secureride_secret_777")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440

ALLOWED_MIME_TO_EXT = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

app = FastAPI(title="SecureRide API")

# --- FIXED CORS (Allow All for Debugging) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)

# --- Helpers ---
def get_password_hash(password):
    password_hash = hashlib.sha256(password.encode()).hexdigest()
    return pwd_context.hash(password_hash)

def verify_password(plain_password, hashed_password):
    plain_password_hash = hashlib.sha256(plain_password.encode()).hexdigest()
    return pwd_context.verify(plain_password_hash, hashed_password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> models.User:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

def ensure_admin(user: models.User):
    if user.role != "Admin":
        raise HTTPException(status_code=403, detail="Admin access required")

# --- Auth ---

@app.post("/auth/register", response_model=schemas.UserOut)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = models.User(
        email=user.email,
        password=get_password_hash(user.password),
        role=user.role,
        is_verified=False
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    new_profile = models.Profile(
        user_id=new_user.id,
        full_name=user.full_name,
        id_number=user.id_number,
        phone=user.phone,
        physical_address=user.address,
        ethnicity=user.ethnicity,
        dob=user.dob,
        gender=user.gender
    )
    db.add(new_profile)

    if user.role == "Passenger":
        db.add(models.Passenger(user_id=new_user.id))
    elif user.role == "Driver":
        db.add(models.Driver(user_id=new_user.id))
    elif user.role == "Admin":
        db.add(models.Admin(user_id=new_user.id))

    db.commit()
    return new_user

@app.post("/auth/login")
def login(credentials: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.password):
        raise HTTPException(status_code=400, detail="Incorrect credentials")

    if not user.is_verified and user.role != "Admin":
        raise HTTPException(status_code=403, detail="Biometric verification required.")

    token = create_access_token(data={"sub": user.email, "role": user.role})
    return {"access_token": token, "token_type": "bearer", "user": {"id": user.id, "role": user.role}}

@app.get("/auth/users/me", response_model=schemas.UserProfileOut)
def get_me(user: models.User = Depends(get_current_user)):
    p = user.profile
    return {
        "id": user.id, "email": user.email, "role": user.role, "is_verified": user.is_verified,
        "full_name": p.full_name, "phone": p.phone, "address": p.physical_address,
        "dob": p.dob, "gender": p.gender, "id_number": p.id_number
    }

@app.put("/auth/users/me", response_model=schemas.UserProfileOut)
def update_profile(data: schemas.ProfileUpdate, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    p = user.profile
    if data.full_name: p.full_name = data.full_name
    if data.phone: p.phone = data.phone
    if data.address: p.physical_address = data.address
    if data.dob: p.dob = data.dob
    if data.gender: p.gender = data.gender
    if data.id_number: p.id_number = data.id_number
    db.commit()
    return get_me(user)

@app.post("/auth/consent/{user_id}")
def record_consent(user_id: int, db: Session = Depends(get_db)):
    return {"status": "recorded"}

@app.post("/auth/upload-id/{user_id}")
def upload_id_document(user_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    profile = db.query(models.Profile).filter(models.Profile.user_id == user_id).first()
    if not profile: raise HTTPException(404)
    content = file.file.read()
    profile.id_photo_url = f"data:{file.content_type};base64,{base64.b64encode(content).decode('utf-8')}"
    db.commit()
    return {"message": "Secured"}

@app.post("/auth/verify-liveness/{user_id}")
def verify_liveness(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user: raise HTTPException(404)
    user.is_verified = True
    db.commit()
    return {"status": "verified"}

# --- Trips ---

@app.post("/trips/estimate", response_model=schemas.TripEstimateResponse)
def estimate_trip(data: schemas.TripEstimateRequest, user: models.User = Depends(get_current_user)):
    if user.role != "Passenger": raise HTTPException(403)
    base, km, min = 20.0, 12.0, 2.5
    estimated = round(base + (data.distance_km * km) + (data.duration_minutes * min), 2)
    return {"estimated_fare": estimated, "payment_method": "Cash"}

# --- Replace your /trips/book endpoint with this robust version ---

@app.post("/trips/book", response_model=schemas.TripOut)
def book_trip(data: schemas.TripCreate, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        new_trip = models.Trip(
            passenger_id=user.id,
            pickup_location=data.pickup_location,
            destination=data.destination,
            distance_km=data.distance_km,
            duration_minutes=data.duration_minutes,
            fare=data.fare,
            status="Searching" # Driver looks for this status
        )
        db.add(new_trip)
        db.commit()
        db.refresh(new_trip)
        return new_trip
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Booking Failed: {str(e)}")

@app.get("/trips/requests", response_model=List[schemas.TripOut])
def get_available_requests(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role != "Driver":
        raise HTTPException(status_code=403, detail="Only drivers can access this terminal.")

    # 1. Define the 'Freshness' limit (e.g., only trips from the last 10 minutes)
    time_limit = datetime.utcnow() - timedelta(minutes=10)

    try:
        # 2. Filter by Status, No Driver, and Time
        requests = db.query(models.Trip).filter(
            models.Trip.status == "Searching",
            models.Trip.driver_id == None,
            models.Trip.start_time >= time_limit
        ).order_by(models.Trip.start_time.desc()).all()
        
        return requests
    except Exception as e:
        print(f"❌ Error fetching fresh requests: {str(e)}")
        raise HTTPException(status_code=500, detail="Database error")

@app.post("/trips/{trip_id}/accept", response_model=schemas.TripOut)
def accept_trip(trip_id: int, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    # 1. Find the trip
    trip = db.query(models.Trip).filter(models.Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    # 2. Update status and link driver
    trip.driver_id = user.id
    trip.status = "Active" # Passenger polls for this status
    
    db.commit()
    db.refresh(trip)
    return trip

@app.get("/trips/active", response_model=schemas.TripOut)
def get_active(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    filters = [models.Trip.status == "Active"]
    if user.role == "Passenger": filters.append(models.Trip.passenger_id == user.id)
    else: filters.append(models.Trip.driver_id == user.id)
    trip = db.query(models.Trip).filter(*filters).first()
    if not trip: raise HTTPException(404)
    return trip

# --- Contacts & Vehicles ---

@app.post("/contacts", response_model=schemas.EmergencyContactOut)
def add_contact(contact: schemas.EmergencyContactCreate, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    new_c = models.EmergencyContact(user_id=user.id, name=contact.name, phone=contact.phone, relationship_type=contact.relationship_type)
    db.add(new_c)
    db.commit()
    db.refresh(new_c)
    return new_c

@app.get("/contacts", response_model=List[schemas.EmergencyContactOut])
def list_contacts(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(models.EmergencyContact).filter(models.EmergencyContact.user_id == user.id).all()

@app.post("/vehicles/register", response_model=schemas.VehicleOut)
def register_vehicle(make_model: str = Form(...), plate_number: str = Form(...), photo: UploadFile = File(None), user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role != "Driver": raise HTTPException(403)
    photo_uri = None
    if photo:
        content = photo.file.read()
        photo_uri = f"data:{photo.content_type};base64,{base64.b64encode(content).decode('utf-8')}"
    vehicle = models.Vehicle(driver_id=user.id, make_model=make_model, plate_number=plate_number, photo_url=photo_uri)
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    return vehicle

# --- Admin ---

@app.get("/admin/passengers", response_model=List[schemas.AdminUserOut])
def admin_get_passengers(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_admin(user)
    users = db.query(models.User).filter(models.User.role == "Passenger").all()
    return users

@app.get("/admin/drivers", response_model=List[schemas.AdminUserOut])
def admin_get_drivers(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_admin(user)
    users = db.query(models.User).filter(models.User.role == "Driver").all()
    return users

@app.get("/admin/overview", response_model=schemas.AdminOverviewOut)
def admin_overview(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_admin(user)
    return {
        "drivers": db.query(models.Driver).count(),
        "passengers": db.query(models.Passenger).count(),
        "active_trips": db.query(models.Trip).filter(models.Trip.status == "Active").count(),
        "safety_alerts": 0
    }

@app.get("/admin/trips", response_model=List[schemas.AdminTripOut])
def admin_trips(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_admin(user)
    rows = db.query(models.Trip, models.User.email).join(models.User, models.Trip.passenger_id == models.User.id).all()
    return [{"id": t.id, "passenger_email": e, "pickup_location": t.pickup_location, "destination": t.destination, "fare": t.fare, "status": t.status, "start_time": t.start_time} for t, e in rows]