import os, uuid, hashlib, base64, smtplib
from datetime import datetime, timedelta
from typing import List
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

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

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "secureride_terminal_secret_999")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440

ALLOWED_MIME_TO_EXT = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

app = FastAPI(title="SecureRide API")

# --- CORS Configuration ---
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
    if not user: raise HTTPException(status_code=404, detail="User not found")
    return user

def ensure_admin(user: models.User):
    if user.role != "Admin": raise HTTPException(status_code=403, detail="Admin access required")

def perform_deep_purge(user_id: int, db: Session):
    # Purge order to handle foreign key constraints
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user: return
    trip_ids = [t.id for t in db.query(models.Trip).filter(or_(models.Trip.passenger_id == user_id, models.Trip.driver_id == user_id)).all()]
    if trip_ids:
        db.query(models.AiSafetyLog).filter(models.AiSafetyLog.trip_id.in_(trip_ids)).delete(synchronize_session=False)
    db.query(models.Trip).filter(or_(models.Trip.passenger_id == user_id, models.Trip.driver_id == user_id)).delete(synchronize_session=False)
    db.query(models.EmergencyContact).filter(models.EmergencyContact.user_id == user_id).delete(synchronize_session=False)
    db.query(models.Vehicle).filter(models.Vehicle.driver_id == user_id).delete(synchronize_session=False)
    db.query(models.Driver).filter(models.Driver.user_id == user_id).delete(synchronize_session=False)
    db.query(models.Passenger).filter(models.Passenger.user_id == user_id).delete(synchronize_session=False)
    db.query(models.Profile).filter(models.Profile.user_id == user_id).delete(synchronize_session=False)
    db.delete(user)

def send_emergency_email(trip_id, transcript, passenger_name, driver_name):
    recipient = os.getenv("TRACKING_COMPANY_EMAIL")
    sender = os.getenv("SMTP_USER")
    password = os.getenv("SMTP_PASSWORD")
    if not all([recipient, sender, password]): return

    subject = f"[URGENT] SecureRide Safety Breach - Trip #{trip_id}"
    body = f"""
    SECURE-RIDE SAFETY BUREAU: INCIDENT REPORT
    ------------------------------------------
    CASE REFERENCE: #SR-ALERT-{trip_id}
    01. AI EVIDENCE TRANSCRIPT: "{transcript}"
    02. PASSENGER: {passenger_name}
    03. DRIVER: {driver_name}
    Live tracking: https://secure-ride-zeta.vercel.app/dashboard/admin/alerts
    ------------------------------------------
    """
    msg = MIMEMultipart()
    msg['From'], msg['To'], msg['Subject'] = sender, recipient, subject
    msg.attach(MIMEText(body, 'plain'))
    try:
        server = smtplib.SMTP(os.getenv("SMTP_SERVER", "smtp.gmail.com"), 587)
        server.starttls(); server.login(sender, password)
        server.sendmail(sender, recipient, msg.as_string()); server.quit()
    except Exception as e: print(f"Email failure: {e}")

# ==========================================
# ENDPOINTS
# ==========================================

@app.post("/auth/register", response_model=schemas.UserOut)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email registered")
    new_user = models.User(email=user.email, password=get_password_hash(user.password), role=user.role, is_verified=False)
    db.add(new_user); db.commit(); db.refresh(new_user)
    db.add(models.Profile(user_id=new_user.id, full_name=user.full_name, id_number=user.id_number, phone=user.phone, physical_address=user.address, ethnicity=user.ethnicity, dob=user.dob, gender=user.gender))
    if user.role == "Passenger": db.add(models.Passenger(user_id=new_user.id))
    elif user.role == "Driver": db.add(models.Driver(user_id=new_user.id))
    elif user.role == "Admin": db.add(models.Admin(user_id=new_user.id))
    db.commit(); return new_user

@app.post("/auth/login")
def login(credentials: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.password):
        raise HTTPException(status_code=400, detail="Incorrect credentials")
    if not user.is_verified and user.role != "Admin":
        raise HTTPException(status_code=403, detail="Verification required.")
    token = create_access_token(data={"sub": user.email, "role": user.role})
    return {"access_token": token, "token_type": "bearer", "user": {"id": user.id, "role": user.role}}

@app.get("/auth/users/me", response_model=schemas.UserProfileOut)
def get_me(user: models.User = Depends(get_current_user)):
    p = user.profile
    return {
        "id": user.id, "email": user.email, "role": user.role, "is_verified": user.is_verified,
        "full_name": p.full_name if p else "N/A", "phone": p.phone if p else "N/A", 
        "address": p.physical_address if p else "N/A", "dob": p.dob if p else "N/A", 
        "gender": p.gender if p else "N/A", "id_number": p.id_number if p else "N/A"
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
    db.commit(); return get_me(user)

@app.delete("/auth/users/me")
def delete_me(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    perform_deep_purge(user.id, db)
    db.commit(); return {"message": "Purged"}

@app.post("/auth/consent/{user_id}")
def record_consent(user_id: int): return {"status": "recorded"}

@app.post("/auth/upload-id/{user_id}")
def upload_id(user_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    p = db.query(models.Profile).filter(models.Profile.user_id == user_id).first()
    if not p: raise HTTPException(404)
    p.id_photo_url = f"data:{file.content_type};base64,{base64.b64encode(file.file.read()).decode('utf-8')}"
    db.commit(); return {"status": "ok"}

@app.post("/auth/verify-liveness/{user_id}")
def verify_liveness(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user: user.is_verified = True; db.commit()
    return {"status": "ok"}

# --- Trips ---
@app.post("/trips/estimate", response_model=schemas.TripEstimateResponse)
def estimate_trip(data: schemas.TripEstimateRequest):
    base, km, min = 20.0, 12.0, 2.5
    est = round(base + (data.distance_km * km) + (data.duration_minutes * min), 2)
    return {"estimated_fare": est, "payment_method": "Cash"}

@app.post("/trips/book", response_model=schemas.TripOut)
def book_trip(data: schemas.TripCreate, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    trip = models.Trip(passenger_id=user.id, pickup_location=data.pickup_location, destination=data.destination, distance_km=data.distance_km, duration_minutes=data.duration_minutes, fare=data.fare, status="Searching")
    db.add(trip); db.commit(); db.refresh(trip); return trip

@app.get("/trips/requests", response_model=List[schemas.TripOut])
def get_requests(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    limit = datetime.utcnow() - timedelta(minutes=15)
    return db.query(models.Trip).filter(models.Trip.status == "Searching", models.Trip.driver_id == None, models.Trip.start_time >= limit).all()

@app.post("/trips/{trip_id}/accept", response_model=schemas.TripOut)
def accept_trip(trip_id: int, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    trip = db.query(models.Trip).filter(models.Trip.id == trip_id).first()
    if not trip or trip.driver_id: raise HTTPException(404)
    trip.driver_id, trip.status = user.id, "Active"
    db.commit(); return trip

@app.get("/trips/active", response_model=schemas.TripOut)
def get_active(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    trip = db.query(models.Trip).filter(or_(models.Trip.passenger_id == user.id, models.Trip.driver_id == user.id), models.Trip.status.in_(["Active", "Searching", "Canceled", "Completed"])).order_by(models.Trip.start_time.desc()).first()
    if not trip: raise HTTPException(404)
    if trip.status == "Active" and trip.driver_id:
        d_u = db.query(models.User).filter(models.User.id == trip.driver_id).first()
        v = db.query(models.Vehicle).filter(models.Vehicle.driver_id == trip.driver_id).first()
        trip.driver_name = d_u.profile.full_name if (d_u and d_u.profile) else "Pilot"
        if v: trip.vehicle_model, trip.vehicle_plate = v.make_model, v.plate_number
    return trip

@app.patch("/trips/{trip_id}/location")
def update_trip_location(trip_id: int, lat: float = Form(...), lng: float = Form(...), db: Session = Depends(get_db)):
    trip = db.query(models.Trip).filter(models.Trip.id == trip_id).first()
    if trip: trip.current_lat, trip.current_lng = lat, lng; db.commit()
    return {"status": "ok"}

@app.post("/trips/{trip_id}/complete")
def complete_trip(trip_id: int, db: Session = Depends(get_db)):
    trip = db.query(models.Trip).filter(models.Trip.id == trip_id).first()
    if trip: trip.status = "Completed"; db.commit()
    return {"status": "ok"}

@app.post("/trips/{trip_id}/cancel")
def cancel_trip(trip_id: int):
    trip = db.query(models.Trip).filter(models.Trip.id == trip_id).first()
    if trip: trip.status = "Canceled"; db.commit(); return {"status": "ok"}
    raise HTTPException(404)

@app.get("/trips/history", response_model=List[schemas.TripOut])
def get_history(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    f = models.Trip.passenger_id == user.id if user.role == "Passenger" else models.Trip.driver_id == user.id
    return db.query(models.Trip).filter(f).order_by(models.Trip.start_time.desc()).all()

# --- Emergency ---
@app.post("/trips/{trip_id}/emergency")
def trigger_ai_emergency(trip_id: int, data: schemas.EmergencyAlert, db: Session = Depends(get_db)):
    db.add(models.AiSafetyLog(trip_id=trip_id, transcript=data.transcript)); db.commit()
    t = db.query(models.Trip).filter(models.Trip.id == trip_id).first()
    p_n, d_n = "Unknown", "Unassigned"
    if t:
        p = db.query(models.User).filter(models.User.id == t.passenger_id).first()
        d = db.query(models.User).filter(models.User.id == t.driver_id).first()
        if p and p.profile: p_n = p.profile.full_name
        if d and d.profile: d_n = d.profile.full_name
    send_emergency_email(trip_id, data.transcript, p_n, d_n)
    return {"status": "dispatched"}

@app.post("/vehicles/register", response_model=schemas.VehicleOut)
def register_vehicle(make_model: str = Form(...), plate_number: str = Form(...), photo: UploadFile = File(None), user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    p_uri = f"data:{photo.content_type};base64,{base64.b64encode(photo.file.read()).decode('utf-8')}" if photo else None
    v = models.Vehicle(driver_id=user.id, make_model=make_model, plate_number=plate_number, photo_url=p_uri)
    db.add(v); db.commit(); db.refresh(v); return v

# --- Admin ---
@app.get("/admin/overview", response_model=schemas.AdminOverviewOut)
def admin_overview(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_admin(user)
    return {"drivers": db.query(models.User).filter(models.User.role == "Driver").count(), "passengers": db.query(models.User).filter(models.User.role == "Passenger").count(), "active_trips": db.query(models.Trip).filter(models.Trip.status == "Active").count(), "safety_alerts": db.query(models.AiSafetyLog).count()}

@app.get("/admin/passengers", response_model=List[schemas.AdminUserOut])
def admin_passengers(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_admin(user); u_list = db.query(models.User).filter(models.User.role == "Passenger").all()
    return [{"id": u.id, "email": u.email, "is_verified": u.is_verified, "role": u.role, "full_name": u.profile.full_name if u.profile else "N/A", "phone": u.profile.phone if u.profile else "N/A", "id_number": u.profile.id_number if u.profile else "N/A", "address": u.profile.physical_address if u.profile else "N/A", "dob": u.profile.dob if u.profile else "N/A", "gender": u.profile.gender if u.profile else "N/A", "ethnicity": u.profile.ethnicity if u.profile else "N/A", "id_photo_url": u.profile.id_photo_url if u.profile else None, "created_at": u.created_at} for u in u_list]

@app.get("/admin/drivers", response_model=List[schemas.AdminUserOut])
def admin_drivers(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_admin(user); u_list = db.query(models.User).filter(models.User.role == "Driver").all(); res = []
    for u in u_list:
        v = db.query(models.Vehicle).filter(models.Vehicle.driver_id == u.id).first()
        res.append({"id": u.id, "email": u.email, "is_verified": u.is_verified, "role": u.role, "full_name": u.profile.full_name if u.profile else "N/A", "phone": u.profile.phone if u.profile else "N/A", "id_number": u.profile.id_number if u.profile else "N/A", "address": u.profile.physical_address if u.profile else "N/A", "dob": u.profile.dob if u.profile else "N/A", "gender": u.profile.gender if u.profile else "N/A", "ethnicity": u.profile.ethnicity if u.profile else "N/A", "id_photo_url": u.profile.id_photo_url if u.profile else None, "vehicle": v, "created_at": u.created_at})
    return res

@app.get("/admin/trips", response_model=List[schemas.AdminTripOut])
def admin_trips(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_admin(user); rows = db.query(models.Trip, models.User.email).outerjoin(models.User, models.Trip.passenger_id == models.User.id).all()
    return [{"id": t.id, "passenger_email": e if e else "Purged", "pickup_location": t.pickup_location, "destination": t.destination, "fare": t.fare, "status": t.status, "start_time": t.start_time} for t, e in rows]

@app.get("/admin/alerts", response_model=List[schemas.AdminAlertOut])
def admin_get_alerts(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_admin(user); logs = db.query(models.AiSafetyLog).order_by(models.AiSafetyLog.detected_at.desc()).all(); res = []
    for log in logs:
        t = db.query(models.Trip).filter(models.Trip.id == log.trip_id).first()
        if not t: continue
        p_u = db.query(models.User).filter(models.User.id == t.passenger_id).first()
        d_u = db.query(models.User).filter(models.User.id == t.driver_id).first()
        contacts = db.query(models.EmergencyContact).filter(models.EmergencyContact.user_id == t.passenger_id).all()
        res.append({"id": log.id, "transcript": log.transcript, "detected_at": log.detected_at, "is_resolved": getattr(log, 'is_resolved', False), "trip": {"id": t.id, "pickup": t.pickup_location, "destination": t.destination, "status": t.status}, "passenger": {"name": p_u.profile.full_name if (p_u and p_u.profile) else "Unknown", "phone": p_u.profile.phone if (p_u and p_u.profile) else "N/A", "contacts": [{"name": c.name, "phone": c.phone} for c in contacts]}, "driver": {"name": d_u.profile.full_name if (d_u and d_u.profile) else "Not Assigned", "phone": d_u.profile.phone if (d_u and d_u.profile) else "N/A"}})
    return res

@app.get("/admin/notifications")
def admin_notifications(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_admin(user); yesterday = datetime.utcnow() - timedelta(hours=24); users = db.query(models.User).filter(models.User.created_at >= yesterday).all(); alerts = db.query(models.AiSafetyLog).filter(models.AiSafetyLog.detected_at >= yesterday).all(); res = []
    for u in users: res.append({"id": f"u-{u.id}", "type": "REG", "message": f"New {u.role}: {u.email}", "time": u.created_at.isoformat() + "Z"})
    for a in alerts: res.append({"id": f"a-{a.id}", "type": "SAFETY_ALERT", "message": f"AI ALERT: Trip #{a.trip_id}", "time": a.detected_at.isoformat() + "Z"})
    return sorted(res, key=lambda x: x['time'], reverse=True)

@app.get("/admin/users", response_model=List[schemas.AdminUserOut])
def admin_all_users(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_admin(user); users = db.query(models.User).all()
    return [{"id": u.id, "email": u.email, "role": u.role, "is_verified": u.is_verified, "full_name": u.profile.full_name if u.profile else "N/A", "gender": u.profile.gender if u.profile else "N/A", "created_at": u.created_at} for u in users]

@app.post("/admin/users/bulk-delete")
def admin_bulk_delete(data: List[int], user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_admin(user)
    for uid in [i for i in data if i != user.id]: perform_deep_purge(uid, db)
    db.commit(); return {"status": "ok"}

@app.patch("/admin/alerts/{alert_id}/resolve")
def admin_resolve_alert(alert_id: int, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_admin(user); log = db.query(models.AiSafetyLog).filter(models.AiSafetyLog.id == alert_id).first()
    if log: log.is_resolved = True; db.commit(); return {"status": "ok"}
    raise HTTPException(404)

@app.post("/contacts", response_model=schemas.EmergencyContactOut)
def admin_add_contact(contact: schemas.EmergencyContactCreate, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role not in ["Driver", "Passenger"]: raise HTTPException(403)
    new_c = models.EmergencyContact(user_id=user.id, name=contact.name, phone=contact.phone, relationship_type=contact.relationship_type)
    db.add(new_c); db.commit(); db.refresh(new_c); return new_c