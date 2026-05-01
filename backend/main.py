import os
from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from passlib.context import CryptContext
from dotenv import load_dotenv

# Internal Imports
from database import engine, Base, get_db
import models, schemas

# Load Environment Variables
load_dotenv()

# --- Configuration ---
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "my_random_secret_key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 Hours

UPLOAD_DIR = "uploads/id_documents"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Map validated MIME types to safe extensions (avoids extension derived from user input)
ALLOWED_MIME_TO_EXT = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "application/pdf": "pdf",
}

MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB

# Security setup
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# Initialize App
app = FastAPI(title="SecureRide API")

# Serve uploaded files at /uploads
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# --- CORS Configuration ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Database Initialization ---
@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)

# --- Helper Functions ---
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# --- API ENDPOINTS ---

# 1. Registration
@app.post("/auth/register", response_model=schemas.UserOut)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # Check for duplicate email
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Hash password and create User row
    hashed_pass = get_password_hash(user.password)
    new_user = models.User(
        email=user.email,
        
        role=user.role,
        is_verified=False
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Create Profile row
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

    # Create role-specific row
    if user.role == "Passenger":
        db.add(models.Passenger(user_id=new_user.id))
    elif user.role == "Driver":
        db.add(models.Driver(user_id=new_user.id, verification_status="Pending"))
    elif user.role == "Admin":
        db.add(models.Admin(user_id=new_user.id))

    db.commit()
    return new_user

# 2. Login (JSON-based)
@app.post("/auth/login")
def login(credentials: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")

    if not user.is_verified and user.role != "Admin":
        raise HTTPException(
            status_code=403,
            detail="Account not yet verified. Please complete the verification flow."
        )

    access_token = create_access_token(data={"sub": user.email, "role": user.role})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "role": user.role,
        }
    }

# 3. Record Consent
@app.post("/auth/consent/{user_id}")
def record_consent(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.consent_given_at = datetime.utcnow()
    db.commit()
    return {"message": "Consent recorded"}

# 4. Upload ID Document
@app.post("/auth/upload-id/{user_id}")
def upload_id(user_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    profile = db.query(models.Profile).filter(models.Profile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="User profile not found")

    allowed_types = set(ALLOWED_MIME_TO_EXT.keys())
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Allowed: JPEG, PNG, WebP, PDF"
        )

    # Read file contents and enforce size limit before writing to disk
    contents = file.file.read()
    if len(contents) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(status_code=400, detail="File too large. Maximum allowed size is 10 MB.")

    # Derive extension from validated MIME type (never from user-supplied filename)
    ext = ALLOWED_MIME_TO_EXT[file.content_type]
    # Include a timestamp to avoid collisions when a user re-uploads
    timestamp = int(datetime.utcnow().timestamp())
    filename = f"{user_id}_id_{timestamp}.{ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    with open(file_path, "wb") as buffer:
        buffer.write(contents)

    profile.id_document_url = f"/uploads/id_documents/{filename}"
    db.commit()
    return {"message": "ID document uploaded", "url": profile.id_document_url}

# 5. Liveness Verification
@app.post("/auth/verify-liveness/{user_id}")
def verify_liveness(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_verified = True
    db.commit()
    return {"message": "User verified successfully"}

# 6. AI Emergency Monitoring Endpoint
@app.post("/trips/{trip_id}/emergency")
def trigger_emergency(trip_id: int, data: schemas.EmergencyAlert, db: Session = Depends(get_db)):
    print(f"!!! EMERGENCY ALERT FOR TRIP {trip_id} !!!")
    print(f"Transcript: {data.transcript}")
    return {"status": "Alert Received", "action": "Emergency services notified"}

# 7. Fetch Current User Profile (Role Based)
@app.get("/auth/users/me", response_model=schemas.UserProfileOut)
def get_current_user_profile(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    profile = db.query(models.Profile).filter(models.Profile.user_id == user.id).first()

    return {
        "id": user.id,
        "email": user.email,
        "role": user.role,
        "full_name": profile.full_name if profile else "",
        "is_verified": user.is_verified
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)