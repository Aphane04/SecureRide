import os
from datetime import datetime, timedelta
from typing import List

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from passlib.context import CryptContext
from dotenv import load_dotenv

from database import engine, Base, get_db
import models, schemas

load_dotenv()

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "my_random_secret_key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440

UPLOAD_DIR = "uploads/id_documents"
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_MIME_TO_EXT = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "application/pdf": "pdf",
}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

app = FastAPI(title="SecureRide API")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

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

    hashed_pass = get_password_hash(user.password)
    new_user = models.User(
        email=user.email,
        password=hashed_pass,
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
        db.add(models.Driver(user_id=new_user.id, verification_status="Pending"))
    elif user.role == "Admin":
        db.add(models.Admin(user_id=new_user.id))

    db.commit()
    return new_user

@app.post("/auth/login")
def login(credentials: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")

    if not user.is_verified and user.role != "Admin":
        raise HTTPException(status_code=403, detail="Account not yet verified. Please complete the verification flow.")

    access_token = create_access_token(data={"sub": user.email, "role": user.role})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {"id": user.id, "email": user.email, "role": user.role}
    }

@app.get("/auth/users/me", response_model=schemas.UserProfileOut)
def get_current_user_profile(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(models.Profile).filter(models.Profile.user_id == user.id).first()
    return {
        "id": user.id,
        "email": user.email,
        "role": user.role,
        "full_name": profile.full_name if profile else "",
        "phone": profile.phone if profile else "",
        "address": profile.physical_address if profile else "",
        "dob": profile.dob if profile else "",
        "gender": profile.gender if profile else "",
        "id_number": profile.id_number if profile else "",
        "is_verified": user.is_verified
    }

@app.post("/auth/consent/{user_id}")
def record_consent(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_verified = True
    db.commit()
    return {"message": "Consent recorded"}

# --- Trips ---
@app.post("/trips/estimate", response_model=schemas.TripEstimateResponse)
def estimate_trip(data: schemas.TripEstimateRequest, user: models.User = Depends(get_current_user)):
    if user.role != "Passenger":
        raise HTTPException(status_code=403, detail="Only passengers can request rides.")
    base_fare = 20.0
    per_km = 12.0
    per_min = 2.0
    estimated = round(base_fare + data.distance_km * per_km + data.duration_minutes * per_min, 2)
    return {"estimated_fare": estimated, "payment_method": "Cash"}

@app.post("/trips/book", response_model=schemas.TripOut)
def book_trip(data: schemas.TripCreate, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role != "Passenger":
        raise HTTPException(status_code=403, detail="Only passengers can request rides.")
    trip = models.Trip(
        passenger_id=user.id,
        pickup_location=data.pickup_location,
        destination=data.destination,
        distance_km=data.distance_km,
        duration_minutes=data.duration_minutes,
        fare=data.fare,
        payment_method="Cash",
        status="Searching"
    )
    db.add(trip)
    db.commit()
    db.refresh(trip)
    return trip

@app.get("/trips/history", response_model=List[schemas.TripOut])
def trip_history(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role != "Passenger":
        raise HTTPException(status_code=403, detail="Only passengers can view trip history.")
    return db.query(models.Trip).filter(models.Trip.passenger_id == user.id).order_by(models.Trip.start_time.desc()).all()

# --- Contacts ---
@app.post("/contacts", response_model=schemas.EmergencyContactOut)
def add_contact(contact: schemas.EmergencyContactCreate, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    new_contact = models.EmergencyContact(
        user_id=user.id,
        name=contact.name,
        phone=contact.phone,
        relationship_type=contact.relationship_type
    )
    db.add(new_contact)
    db.commit()
    db.refresh(new_contact)
    return new_contact

@app.get("/contacts", response_model=List[schemas.EmergencyContactOut])
def list_contacts(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(models.EmergencyContact).filter(models.EmergencyContact.user_id == user.id).all()

@app.put("/contacts/{contact_id}", response_model=schemas.EmergencyContactOut)
def update_contact(contact_id: int, contact: schemas.EmergencyContactCreate, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    existing = db.query(models.EmergencyContact).filter(
        models.EmergencyContact.id == contact_id,
        models.EmergencyContact.user_id == user.id
    ).first()
    if not existing:
        raise HTTPException(status_code=404, detail="Contact not found")
    existing.name = contact.name
    existing.phone = contact.phone
    existing.relationship_type = contact.relationship_type
    db.commit()
    db.refresh(existing)
    return existing

@app.delete("/contacts/{contact_id}")
def delete_contact(contact_id: int, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    existing = db.query(models.EmergencyContact).filter(
        models.EmergencyContact.id == contact_id,
        models.EmergencyContact.user_id == user.id
    ).first()
    if not existing:
        raise HTTPException(status_code=404, detail="Contact not found")
    db.delete(existing)
    db.commit()
    return {"message": "Contact deleted"}

# --- Admin Endpoints ---
@app.get("/admin/overview", response_model=schemas.AdminOverviewOut)
def admin_overview(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_admin(user)
    drivers = db.query(models.User).filter(models.User.role == "Driver").count()
    passengers = db.query(models.User).filter(models.User.role == "Passenger").count()
    active_trips = db.query(models.Trip).filter(models.Trip.status != "Completed").count()
    safety_alerts = db.query(models.AiSafetyLog).count()
    return {
        "drivers": drivers,
        "passengers": passengers,
        "active_trips": active_trips,
        "safety_alerts": safety_alerts
    }

@app.get("/admin/trips", response_model=List[schemas.AdminTripOut])
def admin_trips(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_admin(user)
    rows = (
        db.query(models.Trip, models.User.email)
        .join(models.User, models.Trip.passenger_id == models.User.id)
        .order_by(models.Trip.start_time.desc())
        .limit(50)
        .all()
    )
    return [
        {
            "id": trip.id,
            "passenger_email": email,
            "pickup_location": trip.pickup_location,
            "destination": trip.destination,
            "fare": trip.fare,
            "status": trip.status,
            "start_time": trip.start_time,
        }
        for trip, email in rows
    ]

@app.get("/admin/drivers", response_model=List[schemas.AdminUserOut])
def admin_drivers(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_admin(user)
    rows = (
        db.query(models.User, models.Profile)
        .join(models.Profile, models.User.id == models.Profile.user_id)
        .filter(models.User.role == "Driver")
        .all()
    )
    return [
        {
            "id": u.id,
            "email": u.email,
            "full_name": p.full_name,
            "role": u.role,
            "is_verified": u.is_verified
        }
        for u, p in rows
    ]

@app.get("/admin/passengers", response_model=List[schemas.AdminUserOut])
def admin_passengers(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_admin(user)
    rows = (
        db.query(models.User, models.Profile)
        .join(models.Profile, models.User.id == models.Profile.user_id)
        .filter(models.User.role == "Passenger")
        .all()
    )
    return [
        {
            "id": u.id,
            "email": u.email,
            "full_name": p.full_name,
            "role": u.role,
            "is_verified": u.is_verified
        }
        for u, p in rows
    ]

@app.get("/admin/alerts", response_model=List[schemas.AdminAlertOut])
def admin_alerts(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_admin(user)
    rows = db.query(models.AiSafetyLog).order_by(models.AiSafetyLog.detected_at.desc()).limit(50).all()
    return rows