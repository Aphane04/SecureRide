import os, uuid, hashlib, base64, smtplib
from datetime import datetime, timedelta
from typing import List
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from sqlalchemy import or_
from jose import JWTError, jwt
from passlib.context import CryptContext
from dotenv import load_dotenv

from database import engine, Base, get_db
import models, schemas

load_dotenv()

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "secureride_v3_final_terminal")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

app = FastAPI(title="SecureRide API - v3")

# --- CORS ---
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
def get_password_hash(p): return pwd_context.hash(hashlib.sha256(p.encode()).hexdigest())
def verify_password(p, h): return pwd_context.verify(hashlib.sha256(p.encode()).hexdigest(), h)
def create_access_token(data: dict):
    to_encode = data.copy()
    to_encode.update({"exp": datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> models.User:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
    except: raise HTTPException(status_code=401, detail="Invalid session")
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user: raise HTTPException(status_code=404, detail="User not found")
    return user

def ensure_admin(user: models.User):
    if user.role != "Admin": raise HTTPException(status_code=403, detail="Admin access required")

def send_emergency_email(trip_id, transcript, passenger_name, driver_name):
    recipient = os.getenv("TRACKING_COMPANY_EMAIL")
    sender, password = os.getenv("SMTP_USER"), os.getenv("SMTP_PASSWORD")
    if not all([recipient, sender, password]): return
    msg = MIMEMultipart()
    msg['From'], msg['To'], msg['Subject'] = sender, recipient, f"[ALERT] SecureRide - Trip #{trip_id}"
    body = f"Incident Report\nTrip: {trip_id}\nEvidence: {transcript}\nPassenger: {passenger_name}\nDriver: {driver_name}"
    msg.attach(MIMEText(body, 'plain'))
    try:
        server = smtplib.SMTP_SSL("smtp.gmail.com", 465)
        server.login(sender, password)
        server.sendmail(sender, recipient, msg.as_string()); server.quit()
    except: pass

# ==========================================
# AUTHENTICATION & PROFILE (FLATTENED)
# ==========================================

@app.post("/auth/register", response_model=schemas.UserOut)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email registered")

    new_user = models.User(
        email=user.email, password=get_password_hash(user.password), role=user.role,
        full_name=user.full_name, id_number=user.id_number, phone=user.phone,
        physical_address=user.address, ethnicity=user.ethnicity, dob=user.dob, gender=user.gender
    )
    db.add(new_user); db.commit(); db.refresh(new_user)

    if user.role == "Passenger": db.add(models.Passenger(user_id=new_user.id))
    elif user.role == "Driver": db.add(models.Driver(user_id=new_user.id))
    elif user.role == "Admin": db.add(models.Admin(user_id=new_user.id))
    
    db.commit()
    return new_user

@app.post("/auth/login")
def login(credentials: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.password):
        raise HTTPException(status_code=400, detail="Incorrect credentials")

    is_verified = True
    if user.role == "Passenger": is_verified = user.passenger.is_verified
    elif user.role == "Driver": is_verified = user.driver.is_verified
    
    if not is_verified and user.role != "Admin":
        raise HTTPException(status_code=403, detail="Biometric verification required.")

    token = create_access_token(data={"sub": user.email, "role": user.role})
    return {"access_token": token, "token_type": "bearer", "user": {"id": user.id, "role": user.role}}

@app.get("/auth/users/me", response_model=schemas.UserProfileOut)
def get_me(user: models.User = Depends(get_current_user)):
    is_v = True
    if user.role == "Passenger": is_v = user.passenger.is_verified
    elif user.role == "Driver": is_v = user.driver.is_verified
    
    return {
        "id": user.id, "email": user.email, "role": user.role, "is_verified": is_v,
        "full_name": user.full_name, "phone": user.phone, "address": user.physical_address,
        "dob": user.dob, "gender": user.gender, "id_number": user.id_number
    }

@app.post("/auth/upload-id/{user_id}")
def upload_id(user_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    content = f"data:{file.content_type};base64,{base64.b64encode(file.file.read()).decode('utf-8')}"
    p = db.query(models.Passenger).filter(models.Passenger.user_id == user_id).first()
    d = db.query(models.Driver).filter(models.Driver.user_id == user_id).first()
    if p: p.id_photo_url = content
    if d: d.id_photo_url = content
    db.commit(); return {"status": "ok"}

@app.post("/auth/verify-liveness/{user_id}")
def verify_liveness(user_id: int, db: Session = Depends(get_db)):
    p = db.query(models.Passenger).filter(models.Passenger.user_id == user_id).first()
    d = db.query(models.Driver).filter(models.Driver.user_id == user_id).first()
    if p: p.is_verified = True
    if d: d.is_verified = True
    db.commit(); return {"status": "ok"}

# ==========================================
# TRIPS & HISTORY
# ==========================================

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
        d = db.query(models.User).filter(models.User.id == trip.driver_id).first()
        v = db.query(models.Vehicle).filter(models.Vehicle.driver_id == trip.driver_id).first()
        trip.driver_name = d.full_name
        if v: trip.vehicle_model, trip.vehicle_plate = v.make_model, v.plate_number
    return trip

@app.get("/trips/history", response_model=List[schemas.TripOut])
def history(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(models.Trip).filter(models.Trip.passenger_id == user.id).order_by(models.Trip.start_time.desc()).all()

@app.get("/trips/driver-history", response_model=List[schemas.TripOut])
def drv_history(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(models.Trip).filter(models.Trip.driver_id == user.id).order_by(models.Trip.start_time.desc()).all()

@app.post("/trips/{trip_id}/cancel")
def cancel_trip(trip_id: int, db: Session = Depends(get_db)):
    trip = db.query(models.Trip).filter(models.Trip.id == trip_id).first()
    if trip: trip.status = "Canceled"; db.commit(); return {"ok": True}

@app.post("/trips/{trip_id}/complete")
def finish_trip(trip_id: int, db: Session = Depends(get_db)):
    trip = db.query(models.Trip).filter(models.Trip.id == trip_id).first()
    if trip: trip.status = "Completed"; db.commit(); return {"ok": True}

@app.patch("/trips/{trip_id}/location")
def update_loc(trip_id: int, lat: float = Form(...), lng: float = Form(...), db: Session = Depends(get_db)):
    trip = db.query(models.Trip).filter(models.Trip.id == trip_id).first()
    if trip: trip.current_lat, trip.current_lng = lat, lng; db.commit()
    return {"ok": True}

# ==========================================
# EMERGENCY CONTACTS
# ==========================================

@app.get("/contacts", response_model=List[schemas.EmergencyContactOut])
def list_contacts(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(models.EmergencyContact).filter(models.EmergencyContact.user_id == user.id).all()

@app.post("/contacts", response_model=schemas.EmergencyContactOut)
def add_contact(contact: schemas.EmergencyContactCreate, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    new_c = models.EmergencyContact(user_id=user.id, name=contact.name, phone=contact.phone)
    db.add(new_c); db.commit(); db.refresh(new_c); return new_c

@app.delete("/contacts/{cid}")
def del_contact(cid: int, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(models.EmergencyContact).filter(models.EmergencyContact.id == cid, models.EmergencyContact.user_id == user.id).delete()
    db.commit(); return {"ok": True}

# ==========================================
# ADMIN & VEHICLES
# ==========================================

@app.post("/vehicles/register", response_model=schemas.VehicleOut)
def reg_vehicle(make_model: str = Form(...), plate_number: str = Form(...), photo: UploadFile = File(None), user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    p_uri = f"data:{photo.content_type};base64,{base64.b64encode(photo.file.read()).decode('utf-8')}" if photo else None
    v = models.Vehicle(driver_id=user.id, make_model=make_model, plate_number=plate_number, photo_url=p_uri)
    db.add(v); db.commit(); db.refresh(v); return v

@app.get("/admin/passengers", response_model=List[schemas.AdminUserOut])
def admin_p(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_admin(user); u_list = db.query(models.User).filter(models.User.role == "Passenger").all()
    return [{
        "id": u.id, "email": u.email, "role": u.role, "full_name": u.full_name, "phone": u.phone,
        "is_verified": u.passenger.is_verified, "id_photo_url": u.passenger.id_photo_url, "created_at": u.created_at
    } for u in u_list]

@app.get("/admin/drivers", response_model=List[schemas.AdminUserOut])
def admin_d(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_admin(user); u_list = db.query(models.User).filter(models.User.role == "Driver").all()
    res = []
    for u in u_list:
        v = db.query(models.Vehicle).filter(models.Vehicle.driver_id == u.id).first()
        res.append({
            "id": u.id, "email": u.email, "role": u.role, "full_name": u.full_name, "phone": u.phone,
            "is_verified": u.driver.is_verified, "id_photo_url": u.driver.id_photo_url, "vehicle": v, "created_at": u.created_at
        })
    return res