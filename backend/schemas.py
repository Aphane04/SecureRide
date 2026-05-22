from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime

# ==========================================
# 1. CORE AUTH & USER SCHEMAS
# ==========================================

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserCreate(BaseModel):
    email: EmailStr
    full_name: str
    id_number: str
    phone: str
    address: str
    dob: str
    gender: str
    role: str
    ethnicity: Optional[str] = None
    password: str

    @field_validator('password')
    def password_length_bcrypt(cls, v):
        if len(v.encode('utf-8')) > 72:
            raise ValueError('Password cannot be longer than 72 bytes')
        return v

class UserOut(BaseModel):
    id: int
    email: str
    role: str
    class Config:
        from_attributes = True

class UserProfileOut(BaseModel):
    id: int
    email: str
    role: str
    full_name: str
    phone: Optional[str]
    address: Optional[str]
    dob: Optional[str]
    gender: Optional[str]
    id_number: Optional[str]
    is_verified: bool

# ==========================================
# 2. DETAIL SCHEMAS (Defined before use)
# ==========================================

class VehicleOut(BaseModel):
    id: int
    make_model: str
    plate_number: str
    photo_url: Optional[str] = None
    class Config:
        from_attributes = True

class AlertTripDetail(BaseModel):
    id: int
    pickup: str
    destination: str
    status: str

class AlertUserDetail(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    contacts: List[dict] = []

# ==========================================
# 3. ADMIN INTELLIGENCE SCHEMAS
# ==========================================

class AdminUserOut(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    is_verified: bool
    phone: Optional[str] = None
    id_number: Optional[str] = None
    address: Optional[str] = None
    dob: Optional[str] = None
    gender: Optional[str] = None
    ethnicity: Optional[str] = None
    id_photo_url: Optional[str] = None
    vehicle: Optional[VehicleOut] = None 
    class Config:
        from_attributes = True

class AdminOverviewOut(BaseModel):
    drivers: int
    passengers: int
    active_trips: int
    safety_alerts: int

class AdminTripOut(BaseModel):
    id: int
    passenger_email: str
    pickup_location: str
    destination: str
    fare: float
    status: str
    start_time: datetime

class AdminAlertOut(BaseModel):
    id: int
    transcript: str
    detected_at: datetime
    is_resolved: bool
    trip: AlertTripDetail
    passenger: AlertUserDetail
    driver: AlertUserDetail

    class Config:
        from_attributes = True

# ==========================================
# 4. EMERGENCY & CONTACT SCHEMAS
# ==========================================

class EmergencyContactCreate(BaseModel):
    name: str
    phone: str
    relationship_type: Optional[str] = None

class EmergencyContactOut(BaseModel):
    id: int
    name: str
    phone: str
    relationship_type: Optional[str] = None
    class Config:
        from_attributes = True

class EmergencyAlert(BaseModel):
    transcript: str

# ==========================================
# 5. TRIP LOGISTICS SCHEMAS
# ==========================================

class TripEstimateRequest(BaseModel):
    pickup_location: str
    destination: str
    distance_km: float
    duration_minutes: float

class TripEstimateResponse(BaseModel):
    estimated_fare: float
    payment_method: str

class TripCreate(BaseModel):
    pickup_location: str
    destination: str
    distance_km: float
    duration_minutes: float
    fare: float

class TripOut(BaseModel):
    id: int
    pickup_location: str
    destination: str
    status: str
    start_time: datetime
    distance_km: float
    duration_minutes: float
    fare: float
    passenger_id: Optional[int] = None
    driver_id: Optional[int] = None
    payment_method: Optional[str] = "Cash"
    driver_name: Optional[str] = None
    vehicle_model: Optional[str] = None
    vehicle_plate: Optional[str] = None
    
    class Config:
        from_attributes = True

# ==========================================
# 6. PROFILE UPDATE SCHEMAS
# ==========================================

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    dob: Optional[str] = None
    gender: Optional[str] = None
    id_number: Optional[str] = None
    email: Optional[EmailStr] = None