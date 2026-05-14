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

# --- CORS Configuration (Open for testing) ---
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

# ==========================================
# AUTHENTICATION & PROFILE
# ==========================================

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
        "full_name": p.full_name if p else "Anonymous", 
        "phone": p.phone if p else "N/A", 
        "address": p.physical_address if p else "N/A",
        "dob": p.dob if p else "N/A", 
        "gender": p.gender if p else "N/A", 
        "id_number": p.id_number if p else "N/A"
    }

@app.put("/auth/users/me", response_model=schemas.UserProfileOut)
def update_profile(data: schemas.ProfileUpdate, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    p = user.profile
    if not p: raise HTTPException(404, "Profile not found")
    if data.full_name: p.full_name = data.full_name
    if data.phone: p.phone = data.phone
    if data.address: p.physical_address = data.address
    if data.dob: p.dob = data.dob
    if data.gender: p.gender = data.gender
    if data.id_number: p.id_number = data.id_number
    db.commit()
    return get_me(user)

@app.delete("/auth/users/me")
def delete_current_user_account(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        user_trip_ids = [t.id for t in db.query(models.Trip).filter(or_(models.Trip.passenger_id == user.id, models.Trip.driver_id == user.id)).all()]
        if user_trip_ids:
            db.query(models.AiSafetyLog).filter(models.AiSafetyLog.trip_id.in_(user_trip_ids)).delete(synchronize_session=False)
        db.query(models.Trip).filter(or_(models.Trip.passenger_id == user.id, models.Trip.driver_id == user.id)).delete(synchronize_session=False)
        db.query(models.EmergencyContact).filter(models.EmergencyContact.user_id == user.id).delete(synchronize_session=False)
        if user.role == "Driver":
            db.query(models.Vehicle).filter(models.Vehicle.driver_id == user.id).delete(synchronize_session=False)
            db.query(models.Driver).filter(models.Driver.user_id == user.id).delete(synchronize_session=False)
        db.query(models.Profile).filter(models.Profile.user_id == user.id).delete(synchronize_session=False)
        db.delete(user)
        db.commit()
        return {"message": "Purged"}
    except Exception as e:
        db.rollback()
        raise HTTPException(500, detail=str(e))

@app.post("/auth/consent/{user_id}")
def record_consent(user_id: int):
    return {"status": "recorded"}

@app.post("/auth/upload-id/{user_id}")
def upload_id_document(user_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    profile = db.query(models.Profile).filter(models.Profile.user_id == user_id).first()
    if not profile: raise HTTPException(404)
    content = file.file.read()
    profile.id_photo_url = f"data:{file.content_type};base64,{base64.b64encode(content).decode('utf-8')}"
    db.commit()
    return {"message": "ID Secured"}

@app.post("/auth/verify-liveness/{user_id}")
def verify_liveness(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user: raise HTTPException(404)
    user.is_verified = True
    db.commit()
    return {"status": "verified"}

# ==========================================
# TRIPS & MISSIONS
# ==========================================

@app.post("/trips/estimate", response_model=schemas.TripEstimateResponse)
def estimate_trip(data: schemas.TripEstimateRequest, user: models.User = Depends(get_current_user)):
    base, km, min = 20.0, 12.0, 2.5
    estimated = round(base + (data.distance_km * km) + (data.duration_minutes * min), 2)
    return {"estimated_fare": estimated, "payment_method": "Cash"}

@app.post("/trips/book", response_model=schemas.TripOut)
def book_trip(data: schemas.TripCreate, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    trip = models.Trip(
        passenger_id=user.id, pickup_location=data.pickup_location, destination=data.destination,
        distance_km=data.distance_km, duration_minutes=data.duration_minutes, fare=data.fare, status="Searching"
    )
    db.add(trip)
    db.commit()
    db.refresh(trip)
    return trip

@app.get("/trips/requests", response_model=List[schemas.TripOut])
def get_available_requests(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role != "Driver": raise HTTPException(403)
    return db.query(models.Trip).filter(models.Trip.status == "Searching", models.Trip.driver_id == None).all()

@app.post("/trips/{trip_id}/accept", response_model=schemas.TripOut)
def accept_ride(trip_id: int, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    trip = db.query(models.Trip).filter(models.Trip.id == trip_id).first()
    if not trip or trip.driver_id: raise HTTPException(404)
    trip.driver_id, trip.status = user.id, "Active"
    db.commit()
    db.refresh(trip)
    return trip

@app.get("/trips/active", response_model=schemas.TripOut)
def get_active(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Search for the latest trip that is either Searching, Active, or Canceled
    # This allows the 'other side' to detect the cancellation
    trip = db.query(models.Trip).filter(
        or_(models.Trip.passenger_id == user.id, models.Trip.driver_id == user.id),
        models.Trip.status.in_(["Active", "Searching", "Canceled"])
    ).order_by(models.Trip.start_time.desc()).first()

    if not trip:
        raise HTTPException(status_code=404, detail="No current mission")
    
    return trip

@app.post("/trips/{trip_id}/cancel")
def cancel_trip(trip_id: int, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    trip = db.query(models.Trip).filter(models.Trip.id == trip_id).first()
    if not trip: raise HTTPException(404)
    trip.status = "Canceled"
    db.commit()
    return {"message": "Canceled"}

@app.get("/trips/history", response_model=List[schemas.TripOut])
def get_passenger_history(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(models.Trip).filter(models.Trip.passenger_id == user.id).order_by(models.Trip.start_time.desc()).all()

@app.get("/trips/driver-history", response_model=List[schemas.TripOut])
def get_driver_history(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(models.Trip).filter(models.Trip.driver_id == user.id).order_by(models.Trip.start_time.desc()).all()

# ==========================================
# EMERGENCY & SAFETY
# ==========================================

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

@app.post("/trips/{trip_id}/emergency")
def trigger_emergency(trip_id: int, data: schemas.EmergencyAlert, db: Session = Depends(get_db)):
    log = models.AiSafetyLog(trip_id=trip_id, transcript=data.transcript)
    db.add(log)
    db.commit()
    return {"status": "logged"}

@app.post("/vehicles/register", response_model=schemas.VehicleOut)
def register_vehicle(make_model: str = Form(...), plate_number: str = Form(...), photo: UploadFile = File(None), user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    photo_uri = None
    if photo:
        content = photo.file.read()
        photo_uri = f"data:{photo.content_type};base64,{base64.b64encode(content).decode('utf-8')}"
    vehicle = models.Vehicle(driver_id=user.id, make_model=make_model, plate_number=plate_number, photo_url=photo_uri)
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    return vehicle

# ==========================================
# ADMIN INTELLIGENCE
# ==========================================

@app.get("/admin/overview", response_model=schemas.AdminOverviewOut)
def admin_overview(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_admin(user)
    return {
        "drivers": db.query(models.User).filter(models.User.role == "Driver").count(),
        "passengers": db.query(models.User).filter(models.User.role == "Passenger").count(),
        "active_trips": db.query(models.Trip).filter(models.Trip.status == "Active").count(),
        "safety_alerts": db.query(models.AiSafetyLog).count()
    }

@app.get("/admin/passengers", response_model=List[schemas.AdminUserOut])
def admin_get_passengers(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_admin(user)
    users = db.query(models.User).filter(models.User.role == "Passenger").all()
    return [{
        "id": u.id, "email": u.email, "is_verified": u.is_verified, "role": u.role,
        "full_name": u.profile.full_name if u.profile else "N/A",
        "phone": u.profile.phone if u.profile else "N/A",
        "id_number": u.profile.id_number if u.profile else "N/A",
        "address": u.profile.physical_address if u.profile else "N/A",
        "dob": u.profile.dob if u.profile else "N/A",
        "gender": u.profile.gender if u.profile else "N/A",
        "ethnicity": u.profile.ethnicity if u.profile else "N/A",
        "id_photo_url": u.profile.id_photo_url if u.profile else None,
        "created_at": u.created_at
    } for u in users]

@app.get("/admin/drivers", response_model=List[schemas.AdminUserOut])
def admin_get_drivers(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_admin(user)
    users = db.query(models.User).filter(models.User.role == "Driver").all()
    res = []
    for u in users:
        # Manually query vehicle
        v = db.query(models.Vehicle).filter(models.Vehicle.driver_id == u.id).first()
        res.append({
            "id": u.id, "email": u.email, "is_verified": u.is_verified, "role": u.role,
            "full_name": u.profile.full_name if u.profile else "N/A",
            "phone": u.profile.phone if u.profile else "N/A",
            "id_number": u.profile.id_number if u.profile else "N/A",
            "address": u.profile.physical_address if u.profile else "N/A",
            "dob": u.profile.dob if u.profile else "N/A",
            "gender": u.profile.gender if u.profile else "N/A",
            "ethnicity": u.profile.ethnicity if u.profile else "N/A",
            "id_photo_url": u.profile.id_photo_url if u.profile else None,
            "vehicle": v,
            "created_at": u.created_at
        })
    return res

@app.get("/admin/trips", response_model=List[schemas.AdminTripOut])
def admin_trips(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_admin(user)
    rows = db.query(models.Trip, models.User.email).outerjoin(models.User, models.Trip.passenger_id == models.User.id).all()
    return [{"id": t.id, "passenger_email": e if e else "Purged User", "pickup_location": t.pickup_location, "destination": t.destination, "fare": t.fare, "status": t.status, "start_time": t.start_time} for t, e in rows]

@app.get("/admin/alerts", response_model=List[schemas.AdminAlertOut])
def admin_alerts(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_admin(user)
    logs = db.query(models.AiSafetyLog).all()
    res = []
    for log in logs:
        trip = db.query(models.Trip).filter(models.Trip.id == log.trip_id).first()
        if not trip: continue
        p_user = db.query(models.User).filter(models.User.id == trip.passenger_id).first()
        d_user = db.query(models.User).filter(models.User.id == trip.driver_id).first()
        contacts = db.query(models.EmergencyContact).filter(models.EmergencyContact.user_id == trip.passenger_id).all()
        res.append({
            "id": log.id, "transcript": log.transcript, "detected_at": log.detected_at,
            "trip": {"id": trip.id, "pickup": trip.pickup_location, "destination": trip.destination, "status": trip.status},
            "passenger": {"name": p_user.profile.full_name if p_user and p_user.profile else "Unknown", "phone": p_user.profile.phone if p_user and p_user.profile else "N/A", "contacts": [{"name": c.name, "phone": c.phone} for c in contacts]},
            "driver": {"name": d_user.profile.full_name if d_user and d_user.profile else "Not Assigned", "phone": d_user.profile.phone if d_user and d_user.profile else "N/A"}
        })
    return res

@app.get("/admin/notifications")
def admin_notifs(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_admin(user)
    yesterday = datetime.utcnow() - timedelta(hours=24)
    users = db.query(models.User).filter(models.User.created_at >= yesterday).all()
    return [{"id": u.id, "message": f"New {u.role} registered: {u.email}", "time": u.created_at.isoformat() + "Z"} for u in users]

@app.get("/admin/users", response_model=List[schemas.AdminUserOut])
def get_all_users_for_settings(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_admin(user)
    users = db.query(models.User).all()
    res = []
    for u in users:
        res.append({
            "id": u.id, "email": u.email, "role": u.role, "is_verified": u.is_verified,
            "full_name": u.profile.full_name if u.profile else "Incomplete",
            "gender": u.profile.gender if u.profile else "N/A",
            "created_at": u.created_at
        })
    return res

@app.post("/admin/users/bulk-delete")
def bulk_delete_users(data: List[int], user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_admin(user)
    
    # Filter out current admin so you don't delete yourself
    ids = [uid for uid in data if uid != user.id]
    if not ids:
        return {"message": "No valid IDs provided"}

    try:
        # 1. Delete Safety Logs linked to trips involving these users
        db.query(models.AiSafetyLog).filter(models.AiSafetyLog.trip_id.in_(
            db.query(models.Trip.id).filter(or_(models.Trip.passenger_id.in_(ids), models.Trip.driver_id.in_(ids)))
        )).delete(synchronize_session=False)

        # 2. Delete Trips
        db.query(models.Trip).filter(or_(models.Trip.passenger_id.in_(ids), models.Trip.driver_id.in_(ids))).delete(synchronize_session=False)

        # 3. Delete Vehicles
        db.query(models.Vehicle).filter(models.Vehicle.driver_id.in_(ids)).delete(synchronize_session=False)

        # 4. Delete Emergency Contacts
        db.query(models.EmergencyContact).filter(models.EmergencyContact.user_id.in_(ids)).delete(synchronize_session=False)

        # 5. Delete Profiles
        db.query(models.Profile).filter(models.Profile.user_id.in_(ids)).delete(synchronize_session=False)

        # 6. Delete Role specific records
        db.query(models.Passenger).filter(models.Passenger.user_id.in_(ids)).delete(synchronize_session=False)
        db.query(models.Driver).filter(models.Driver.user_id.in_(ids)).delete(synchronize_session=False)
        db.query(models.Admin).filter(models.Admin.user_id.in_(ids)).delete(synchronize_session=False)

        # 7. Finally, delete the Users
        db.query(models.User).filter(models.User.id.in_(ids)).delete(synchronize_session=False)

        db.commit()
        return {"message": f"Successfully purged {len(ids)} records."}

    except Exception as e:
        db.rollback()
        print(f"❌ BULK DELETE FAILED: {str(e)}")
        raise HTTPException(status_code=500, detail="Database constraint error. Some users have active dependencies.")