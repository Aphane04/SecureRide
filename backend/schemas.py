from pydantic import BaseModel, EmailStr
from typing import Optional

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    id_number: str
    phone: str
    address: str
    dob: str
    gender: str
    role: str # Passenger, Driver, Admin

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
    is_verified: bool

class EmergencyAlert(BaseModel):
    transcript: str