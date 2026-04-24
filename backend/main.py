import os
from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
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
ACCESS_TOKEN_EXPIRE_MINUTES = 1440 # 24 Hours

# Security setup
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# Initialize App
app = FastAPI(title="SecureRide API")

# --- CORRECTED CORS Configuration ---


# 2. Apply Middleware
# --- RE-UPDATED CORS BLOCK ---
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
    # This creates the tables in Aiven MySQL if they don't exist
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

# 1. Registration Logic
@app.post("/register", response_model=schemas.UserOut)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # Check if user exists
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password
    hashed_pass = get_password_hash(user.password)
    
    # Create User Entry
    new_user = models.User(
        email=user.email,
        password=hashed_pass,
        role=user.role, # Admin, Passenger, Driver
        is_verified=False
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create Profile Entry (Full Details as per ID)
    new_profile = models.Profile(
        user_id=new_user.id,
        full_name=user.full_name,
        id_number=user.id_number,
        phone=user.phone,
        address=user.address,
        dob=user.dob,
        gender=user.gender
    )
    db.add(new_profile)
    db.commit()
    
    return new_user

# 2. Login Logic
@app.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    access_token = create_access_token(data={"sub": user.email, "role": user.role})
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": {
            "email": user.email,
            "role": user.role,
            "id": user.id
        }
    }

# 3. Update Verification (After Face Scan)
@app.post("/verify-liveness/{user_id}")
def verify_liveness(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.is_verified = True
    db.commit()
    return {"message": "User verified successfully"}

# 4. AI Emergency Monitoring Endpoint
@app.post("/trips/{trip_id}/emergency")
def trigger_emergency(trip_id: int, data: schemas.EmergencyAlert, db: Session = Depends(get_db)):
    print(f"!!! EMERGENCY ALERT FOR TRIP {trip_id} !!!")
    print(f"Transcript: {data.transcript}")
    
    # Update trip status in DB
    # (Note: This assumes the Trip model exists in your models.py)
    # trip = db.query(models.Trip).filter(models.Trip.id == trip_id).first()
    # if trip:
    #     trip.status = "EMERGENCY"
    #     db.commit()
        
    return {"status": "Alert Received", "action": "Emergency services notified"}

# 5. Fetch Dashboard Data (Role Based)
@app.get("/users/me", response_model=schemas.UserProfileOut)
def get_current_user_profile(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
        
    user = db.query(models.User).filter(models.User.email == email).first()
    profile = db.query(models.Profile).filter(models.Profile.user_id == user.id).first()
    
    return {
        "id": user.id,
        "email": user.email,
        "role": user.role,
        "full_name": profile.full_name,
        "is_verified": user.is_verified
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)