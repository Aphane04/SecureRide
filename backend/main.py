import os, uuid, hashlib, base64, smtplib, re
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

# File upload configuration
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB in bytes
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/jpg"}
ALLOWED_DOCUMENT_TYPES = {"application/pdf", "image/jpeg", "image/png", "image/jpg"}

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

app = FastAPI(title="SecureRide API - v3 Production")

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

# ==========================================
# HELPERS & VALIDATORS
# ==========================================

def validate_password_strength(password: str):
    if len(password) < 8:
        raise HTTPException(400, "Password must be at least 8 characters")
    if not re.search(r"[A-Z]", password):
        raise HTTPException(400, "Password must contain at least 1 uppercase letter")
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        raise HTTPException(400, "Password must contain at least 1 special character")
    if len(re.findall(r"\d", password)) < 3:
        raise HTTPException(400, "Password must contain at least 3 digits")

def validate_file_size(file: UploadFile, max_size: int = MAX_FILE_SIZE):
    """Validate file size before processing"""
    if file.size and file.size > max_size:
        size_mb = max_size / (1024 * 1024)
        raise HTTPException(
            status_code=413, 
            detail=f"File too large. Maximum size: {size_mb}MB"
        )

def validate_image_type(file: UploadFile):
    """Validate image file type"""
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Invalid image type. Allowed: JPEG, PNG"
        )

def validate_document_type(file: UploadFile):
    """Validate document file type (for ID uploads)"""
    if file.content_type not in ALLOWED_DOCUMENT_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Invalid document type. Allowed: PDF, JPEG, PNG"
        )

def safe_file_to_base64(file: UploadFile, max_size: int = MAX_FILE_SIZE) -> str:
    """Safely read file and convert to base64 with robust validation"""
    if not file:
        return None
    try:
        # Reset file pointer to start to ensure we read from the beginning
        file.file.seek(0)
        file_content = file.file.read()
        
        # Validate size based on actual bytes read
        actual_size = len(file_content)
        if actual_size > max_size:
            size_mb = max_size / (1024 * 1024)
            raise HTTPException(
                status_code=413, 
                detail=f"File too large ({round(actual_size/(1024*1024), 2)}MB). Maximum: {size_mb}MB"
            )
            
        if actual_size == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")
        
        # Convert to base64
        b64_content = base64.b64encode(file_content).decode('utf-8')
        return b64_content
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"File processing failed: {str(e)}"
        )

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

def perform_deep_purge(user_id: int, db: Session):
    db.query(models.AiSafetyLog).filter(models.AiSafetyLog.trip_id.in_(
        db.query(models.Trip.id).filter(or_(models.Trip.passenger_id == user_id, models.Trip.driver_id == user_id))
    )).delete(synchronize_session=False)
    db.query(models.Trip).filter(or_(models.Trip.passenger_id == user_id, models.Trip.driver_id == user_id)).delete(synchronize_session=False)
    db.query(models.EmergencyContact).filter(models.EmergencyContact.user_id == user_id).delete(synchronize_session=False)
    db.query(models.Vehicle).filter(models.Vehicle.driver_id == user_id).delete(synchronize_session=False)
    db.query(models.Driver).filter(models.Driver.user_id == user_id).delete(synchronize_session=False)
    db.query(models.Passenger).filter(models.Passenger.user_id == user_id).delete(synchronize_session=False)
    db.query(models.Admin).filter(models.Admin.user_id == user_id).delete(synchronize_session=False)
    db.query(models.User).filter(models.User.id == user_id).delete(synchronize_session=False)

def send_emergency_email(trip_id, transcript, passenger_name, driver_name):
    recipient = os.getenv("TRACKING_COMPANY_EMAIL")
    sender, password = os.getenv("SMTP_USER"), os.getenv("SMTP_PASSWORD")
    if not all([recipient, sender, password]): return
    msg = MIMEMultipart()
    msg['From'], msg['To'], msg['Subject'] = sender, recipient, f"[ALERT] SecureRide - Trip #{trip_id}"
    body = f"Incident Report\nRef: #SR-ALERT-{trip_id}\nEvidence: {transcript}\nPassenger: {passenger_name}\nDriver: {driver_name}"
    msg.attach(MIMEText(body, 'plain'))
    try:
        server = smtplib.SMTP_SSL("smtp.gmail.com", 465)
        server.login(sender, password)
        server.sendmail(sender, recipient, msg.as_string()); server.quit()
    except: pass

# ==========================================
# AUTHENTICATION & REGISTRATION
# ==========================================

@app.post("/auth/register", response_model=schemas.UserOut)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    validate_password_strength(user.password)
    if db.query(models.User).filter(models.User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

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
def get_me(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    is_v = True
    has_v = False
    if user.role == "Passenger":
        is_v = user.passenger.is_verified if user.passenger else False
    elif user.role == "Driver":
        is_v = user.driver.is_verified if user.driver else False
        veh = db.query(models.Vehicle).filter(models.Vehicle.driver_id == user.id).first()
        has_v = True if veh else False
    
    return {
        "id": user.id, "email": user.email, "role": user.role, "is_verified": is_v,
        "has_vehicle": has_v, "full_name": user.full_name, "phone": user.phone, 
        "address": user.physical_address, "dob": user.dob, "gender": user.gender, "id_number": user.id_number
    }

@app.put("/auth/users/me", response_model=schemas.UserProfileOut)
def update_profile(data: schemas.ProfileUpdate, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if data.full_name: user.full_name = data.full_name
    if data.phone: user.phone = data.phone
    if data.address: user.physical_address = data.address
    db.commit(); return get_me(user, db)

@app.post("/auth/upload-id/{user_id}")
def upload_id(user_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    # Validate file type (documents can be PDF or images)
    validate_document_type(file)
    
    # Safely convert to base64
    b64_content = safe_file_to_base64(file, MAX_FILE_SIZE)
    content = f"data:{file.content_type};base64,{b64_content}"
    
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
# TRIPS & MISSIONS
# ==========================================

@app.post("/trips/book", response_model=schemas.TripOut)
def book_trip(data: schemas.TripCreate, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    # FIX: Fare Calculation (Base rate 15 + 12 per KM)
    calculated_fare = 15.0 + (data.distance_km * 12.0)
    
    trip = models.Trip(
        passenger_id=user.id, 
        pickup_location=data.pickup_location, 
        destination=data.destination, 
        distance_km=data.distance_km, 
        duration_minutes=data.duration_minutes, 
        fare=round(calculated_fare, 2), # Use calculated fare
        status="Searching"
    )
    db.add(trip)
    db.commit()
    db.refresh(trip)
    return trip

@app.get("/trips/requests", response_model=List[schemas.TripOut])
def get_requests(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role != "Driver": raise HTTPException(403)
    # Check if driver is verified and has vehicle
    driver = db.query(models.Driver).filter(models.Driver.user_id == user.id).first()
    veh = db.query(models.Vehicle).filter(models.Vehicle.driver_id == user.id).first()
    
    if not veh or not driver or not driver.is_verified:
        raise HTTPException(403, "Verification and Vehicle registration required.")
    
    limit = datetime.utcnow() - timedelta(minutes=30)
    return db.query(models.Trip).filter(
        models.Trip.status == "Searching", 
        models.Trip.driver_id == None, 
        models.Trip.created_at >= limit
    ).all()

@app.post("/trips/{trip_id}/accept", response_model=schemas.TripOut)
def accept_trip(trip_id: int, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    veh = db.query(models.Vehicle).filter(models.Vehicle.driver_id == user.id).first()
    if not veh: raise HTTPException(403, "Register vehicle first.")

    trip = db.query(models.Trip).filter(models.Trip.id == trip_id).first()
    if not trip or trip.driver_id: raise HTTPException(404)
    trip.driver_id, trip.status = user.id, "Active"
    db.commit(); return trip

@app.get("/trips/active", response_model=schemas.TripOut)
def get_active(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    trip = db.query(models.Trip).filter(
        or_(models.Trip.passenger_id == user.id, models.Trip.driver_id == user.id),
        models.Trip.status.in_(["Active", "Searching"])
    ).order_by(models.Trip.start_time.desc()).first()

    if not trip: 
        raise HTTPException(404, detail="No active trip found")

    if trip.driver_id:
        d = db.query(models.User).filter(models.User.id == trip.driver_id).first()
        v = db.query(models.Vehicle).filter(models.Vehicle.driver_id == trip.driver_id).first()
        if d: trip.driver_name = d.full_name
        if v: 
            trip.vehicle_model = v.make_model
            trip.vehicle_plate = v.plate_number
            
    return trip

@app.get("/trips/history", response_model=List[schemas.TripOut])
def get_passenger_history(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(models.Trip).filter(models.Trip.passenger_id == user.id).order_by(models.Trip.start_time.desc()).all()

@app.get("/trips/driver-history", response_model=List[schemas.TripOut])
def get_driver_history(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(models.Trip).filter(models.Trip.driver_id == user.id).order_by(models.Trip.start_time.desc()).all()

# ==========================================
# EMERGENCY CONTACTS (CRUD)
# ==========================================

@app.get("/contacts", response_model=List[schemas.EmergencyContactOut])
def list_contacts(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(models.EmergencyContact).filter(models.EmergencyContact.user_id == user.id).all()

@app.post("/contacts", response_model=schemas.EmergencyContactOut)
def add_contact(contact: schemas.EmergencyContactCreate, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role not in ["Driver", "Passenger"]: raise HTTPException(403)
    
    new_c = models.EmergencyContact(
        user_id=user.id, 
        name=contact.name, 
        phone=contact.phone,
        relationship_type=contact.relationship_type 
    )
    db.add(new_c)
    db.commit()
    db.refresh(new_c)
    return new_c

@app.put("/contacts/{cid}", response_model=schemas.EmergencyContactOut)
def update_contact(cid: int, contact: schemas.EmergencyContactCreate, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    existing = db.query(models.EmergencyContact).filter(
        models.EmergencyContact.id == cid, 
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

@app.delete("/contacts/{cid}")
def del_contact(cid: int, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(models.EmergencyContact).filter(
        models.EmergencyContact.id == cid, 
        models.EmergencyContact.user_id == user.id
    ).delete()
    db.commit()
    return {"status": "ok"}

# ==========================================
# VEHICLES & LOGS
# ==========================================

@app.post("/vehicles/register", response_model=schemas.VehicleOut)
def register_vehicle(
    make_model: str = Form(...), 
    plate_number: str = Form(...), 
    photo: UploadFile = File(None), 
    driver_photo: UploadFile = File(None), 
    user: models.User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    if user.role != "Driver": 
        raise HTTPException(status_code=403, detail="Unauthorized: Only drivers can register vehicles.")
    
    # 1. CRITICAL FIX: Ensure the driver record exists
    # We need the actual Driver record, not just the User record
    driver_record = db.query(models.Driver).filter(models.Driver.user_id == user.id).first()
    if not driver_record:
        # If for some reason the driver record is missing, create it now
        driver_record = models.Driver(user_id=user.id)
        db.add(driver_record)
        db.flush() # This gets us an ID without committing yet

    # 2. Handle Driver Face Photo (Biometrics)
    if driver_photo and driver_photo.filename:
        validate_image_type(driver_photo)
        b64_face = safe_file_to_base64(driver_photo, MAX_FILE_SIZE)
        driver_record.id_photo_url = f"data:{driver_photo.content_type};base64,{b64_face}"

    # 3. Handle Vehicle Photo
    veh_uri = None
    if photo and photo.filename:
        validate_image_type(photo)
        b64_veh = safe_file_to_base64(photo, MAX_FILE_SIZE)
        veh_uri = f"data:{photo.content_type};base64,{b64_veh}"

    # 4. Save or Update Vehicle
    # Use driver_record.user_id to match your table's driver_id column
    v = db.query(models.Vehicle).filter(models.Vehicle.driver_id == user.id).first()
    
    try:
        if v:
            v.make_model = make_model
            v.plate_number = plate_number
            if veh_uri: 
                v.photo_url = veh_uri
        else:
            v = models.Vehicle(
                driver_id=user.id, 
                make_model=make_model, 
                plate_number=plate_number, 
                photo_url=veh_uri
            )
            db.add(v)
        
        db.commit()
        db.refresh(v)
        return v

    except Exception as e:
        db.rollback()
        print(f"DATABASE ERROR: {str(e)}") # This will show the actual error in your terminal
        raise HTTPException(status_code=500, detail=f"Database sync failed: {str(e)}")
# ==========================================
# ADMIN & ALERTS
# ==========================================

@app.get("/admin/alerts", response_model=List[schemas.AdminAlertOut])
def get_admin_alerts(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_admin(user)
    logs = db.query(models.AiSafetyLog).order_by(models.AiSafetyLog.detected_at.desc()).all()
    res = []
    for log in logs:
        t = db.query(models.Trip).filter(models.Trip.id == log.trip_id).first()
        if not t: continue
        p_u = db.query(models.User).filter(models.User.id == t.passenger_id).first()
        d_u = db.query(models.User).filter(models.User.id == t.driver_id).first()
        contacts = db.query(models.EmergencyContact).filter(models.EmergencyContact.user_id == t.passenger_id).all()
        res.append({
            "id": log.id, "transcript": log.transcript, "detected_at": log.detected_at, "is_resolved": log.is_resolved,
            "trip": {"id": t.id, "pickup": t.pickup_location, "destination": t.destination, "status": t.status},
            "passenger": {"name": p_u.full_name if p_u else "Unknown", "phone": p_u.phone if p_u else "N/A", "contacts": [{"name": c.name, "phone": c.phone} for c in contacts]},
            "driver": {"name": d_u.full_name if d_u else "N/A", "phone": d_u.phone if d_u else "N/A"}
        })
    return res

@app.post("/trips/{trip_id}/emergency")
def trigger_alert(trip_id: int, data: schemas.EmergencyAlert, db: Session = Depends(get_db)):
    db.add(models.AiSafetyLog(trip_id=trip_id, transcript=data.transcript)); db.commit()
    t = db.query(models.Trip).get(trip_id)
    p = db.query(models.User).get(t.passenger_id)
    d = db.query(models.User).get(t.driver_id) if t.driver_id else None
    send_emergency_email(trip_id, data.transcript, p.full_name if p else "N/A", d.full_name if d else "N/A")
    return {"ok": True}

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
def admin_passengers(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_admin(user); u_list = db.query(models.User).filter(models.User.role == "Passenger").all()
    return [{"id": u.id, "email": u.email, "is_verified": u.passenger.is_verified if u.passenger else False, "role": u.role, "full_name": u.full_name, "phone": u.phone, "id_number": u.id_number, "address": u.physical_address, "created_at": u.created_at} for u in u_list]

@app.get("/admin/drivers", response_model=List[schemas.AdminUserOut])
def admin_drivers(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_admin(user); u_list = db.query(models.User).filter(models.User.role == "Driver").all(); res = []
    for u in u_list:
        v = db.query(models.Vehicle).filter(models.Vehicle.driver_id == u.id).first()
        res.append({"id": u.id, "email": u.email, "is_verified": u.driver.is_verified if u.driver else False, "role": u.role, "full_name": u.full_name, "phone": u.phone, "id_number": u.id_number, "address": u.physical_address, "vehicle": v, "created_at": u.created_at})
    return res

@app.get("/admin/users", response_model=List[schemas.AdminUserOut])
def get_all_system_users(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_admin(user)
    users = db.query(models.User).all()
    res = []
    for u in users:
        v = u.passenger.is_verified if u.role == "Passenger" and u.passenger else u.driver.is_verified if u.role == "Driver" and u.driver else True
        res.append({"id": u.id, "email": u.email, "role": u.role, "is_verified": v, "full_name": u.full_name if u.full_name else "Incomplete", "gender": u.gender if u.gender else "N/A", "created_at": u.created_at})
    return res

@app.post("/admin/users/bulk-delete")
def bulk_delete_users(data: List[int], user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_admin(user)
    ids = [uid for uid in data if uid != user.id]
    db.query(models.User).filter(models.User.id.in_(ids)).delete(synchronize_session=False)
    db.commit()
    return {"status": "ok"}

@app.delete("/auth/users/me")
def delete_account(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    perform_deep_purge(user.id, db)
    db.commit()
    return {"status": "ok", "message": "Account and all associated data have been permanently deleted"}
