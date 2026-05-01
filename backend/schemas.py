from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional

class UserCreate(BaseModel):
    email: EmailStr
    
    full_name: str
    id_number: str
    phone: str
    address: str
    dob: str
    gender: str
    role: str # Passenger, Driver, Admin
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
    is_verified: bool

class EmergencyAlert(BaseModel):
    transcript: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str