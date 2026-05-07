import os
import uuid
import hashlib
from datetime import datetime, timedelta
from typing import List

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
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
VEHICLE_UPLOAD_DIR = "uploads/vehicles"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(VEHICLE_UPLOAD_DIR, exist_ok=True)

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

# --- CORS Configuration - MUST BE ADDED FIRST, BEFORE STATIC FILES ---
# Read ALLOWED_ORIGINS from environment variable
ALLOWED_ORIGINS = [
    origin.strip() for origin in os.getenv(
        "ALLOWED_ORIGINS", 
        "http://localhost:3000,http://127.0.0.1:3000"
    ).split(",")
]

print(f"🔧 Configuring CORS for origins: {ALLOWED_ORIGINS}")

# Add CORS middleware FIRST
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
)

# THEN mount static files (AFTER middleware)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/")
def root():
    return {
        "status": "ok",
        "message": "SecureRide API is running"
    }

@app.get("/health")
def health():
    return {"status": "healthy"}



@app.on_event("startup")
def startup():
    try:
        Base.metadata.create_all(bind=engine)
        print("✓ Database connection successful")
        print(f"✓ CORS allowed origins: {ALLOWED_ORIGINS}")
    except Exception as e:
        print(f"✗ Database connection failed: {e}")

def get_password_hash(password):
    # Hash with SHA256 first to avoid bcrypt 72-byte limit
    password_hash = hashlib.sha256(password.encode()).hexdigest()
    return pwd_context.hash(password_hash)

def verify_password(plain_password, hashed_password):
    # Apply same SHA256 before verification (use hexdigest to match get_password_hash)
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

@app.post("/auth/upload-id/{user_id}")
def upload_id_document(user_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # 1. Save the actual file
    ext = ALLOWED_MIME_TO_EXT.get(file.content_type, "jpg")
    filename = f"{uuid.uuid4()}.{ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    with open(file_path, "wb") as f:
        f.write(file.file.read())

    # 2. Update the Profile record with the new URL
    profile = db.query(models.Profile).filter(models.Profile.user_id == user_id).first()
    if profile:
        profile.id_photo_url = f"/uploads/id_documents/{filename}"
        db.commit() # Save to DB
        print(f"✅ Saved ID path for {user.email}: {profile.id_photo_url}")

    return {"message": "ID uploaded", "file": f"/uploads/id_documents/{filename}"}


@app.post("/auth/verify-liveness/{user_id}")
def verify_liveness(user_id: int, db: Session = Depends(get_db)):
    """
    Endpoint called after successful facial verification.
    Marks the user as verified to allow dashboard access.
    """
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_verified = True
    db.commit()
    
    return {
        "message": "Facial verification successful",
        "user_id": user.id,
        "is_verified": True
    }

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

@app.get("/trips/requests", response_model=List[schemas.TripOut])
def trip_requests(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role != "Driver":
        raise HTTPException(status_code=403, detail="Only drivers can view ride requests.")
    return db.query(models.Trip).filter(
        models.Trip.status == "Searching",
        models.Trip.driver_id.is_(None)
    ).order_by(models.Trip.start_time.desc()).all()

@app.post("/trips/{trip_id}/accept", response_model=schemas.TripOut)
def accept_trip(trip_id: int, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role != "Driver":
        raise HTTPException(status_code=403, detail="Only drivers can accept rides.")
    trip = db.query(models.Trip).filter(models.Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    if trip.driver_id:
        raise HTTPException(status_code=400, detail="Trip already accepted")
    if trip.status != "Searching":
        raise HTTPException(status_code=400, detail="Trip is not available")

    trip.driver_id = user.id
    trip.status = "Active"
    db.commit()
    db.refresh(trip)
    return trip

@app.get("/trips/active", response_model=schemas.TripOut)
def get_active_trip(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role == "Passenger":
        trip = db.query(models.Trip).filter(
            models.Trip.passenger_id == user.id,
            models.Trip.status == "Active"
        ).order_by(models.Trip.start_time.desc()).first()
    elif user.role == "Driver":
        trip = db.query(models.Trip).filter(
            models.Trip.driver_id == user.id,
            models.Trip.status == "Active"
        ).order_by(models.Trip.start_time.desc()).first()
    else:
        raise HTTPException(status_code=403, detail="Only passengers or drivers can view active trips.")

    if not trip:
        raise HTTPException(status_code=404, detail="No active trip")
    return trip

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

# --- Vehicle Upload ---
@app.post("/vehicles/register", response_model=schemas.VehicleOut)
def register_vehicle(
    make_model: str = Form(...),
    plate_number: str = Form(...),
    photo: UploadFile = File(None),
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role != "Driver":
        raise HTTPException(status_code=403, detail="Only drivers can register vehicles.")

    driver = db.query(models.Driver).filter(models.Driver.user_id == user.id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver profile not found.")

    photo_url = None
    if photo:
        if photo.content_type not in ALLOWED_MIME_TO_EXT:
            raise HTTPException(status_code=400, detail="Unsupported file type.")
        ext = ALLOWED_MIME_TO_EXT[photo.content_type]
        filename = f"{uuid.uuid4()}.{ext}"
        file_path = os.path.join(VEHICLE_UPLOAD_DIR, filename)
        with open(file_path, "wb") as f:
            f.write(photo.file.read())
        photo_url = f"/uploads/vehicles/{filename}"

    vehicle = models.Vehicle(
        driver_id=user.id,
        make_model=make_model,
        plate_number=plate_number,
        photo_url=photo_url
    )
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    return vehicle

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
        db.query(models.User, models.Profile, models.Vehicle)
        .join(models.Profile, models.User.id == models.Profile.user_id)
        .outerjoin(models.Vehicle, models.User.id == models.Vehicle.driver_id)
        .filter(models.User.role == "Driver")
        .all()
    )
    return [
        {
            "id": u.id,
            "email": u.email,
            "full_name": p.full_name,
            "role": u.role,
            "is_verified": u.is_verified,
            "phone": p.phone,
            "id_number": p.id_number,
            "address": p.physical_address,
            "dob": p.dob,
            "gender": p.gender,
            "ethnicity": p.ethnicity,
            "id_photo_url": p.id_photo_url,
            "vehicle": v # This will match the VehicleOut schema automatically
        }
        for u, p, v in rows
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
            "is_verified": u.is_verified,
            "phone": p.phone,
            "id_number": p.id_number,
            "address": p.physical_address,
            "dob": p.dob,
            "gender": p.gender,
            "ethnicity": p.ethnicity,
            "id_photo_url": p.id_photo_url
        }
        for u, p in rows
    ]

@app.get("/admin/alerts", response_model=List[schemas.AdminAlertOut])
def admin_alerts(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_admin(user)
    rows = db.query(models.AiSafetyLog).order_by(models.AiSafetyLog.detected_at.desc()).limit(50).all()
    return rows