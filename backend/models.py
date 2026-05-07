from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Text, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    profile = relationship("Profile", back_populates="user", uselist=False)
    emergency_contacts = relationship("EmergencyContact", back_populates="user")

class Profile(Base):
    __tablename__ = "profiles"
    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    full_name = Column(String(255))
    id_number = Column(String(50))
    dob = Column(String(50))
    gender = Column(String(20))
    ethnicity = Column(String(50))
    phone = Column(String(20))
    physical_address = Column("physical_address", String(255))
    # --- ADD THIS LINE BELOW ---
    id_photo_url = Column(String(255), nullable=True) 
    # ---------------------------
    user = relationship("User", back_populates="profile")

class Passenger(Base):
    __tablename__ = "passengers"
    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    loyalty_points = Column(Integer, default=0)

class Driver(Base):
    __tablename__ = "drivers"
    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    license_number = Column(String(100))
    verification_status = Column(String(50), default="Pending")
    vehicles = relationship("Vehicle", back_populates="driver")

class Vehicle(Base):
    __tablename__ = "vehicles"
    id = Column(Integer, primary_key=True, index=True)
    driver_id = Column(Integer, ForeignKey("drivers.user_id"))
    make_model = Column(String(100))
    plate_number = Column(String(20))
    photo_url = Column(String(255))
    driver = relationship("Driver", back_populates="vehicles")

class EmergencyContact(Base):
    __tablename__ = "emergency_contacts"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String(100))
    phone = Column(String(20))
    relationship_type = Column(String(50))
    user = relationship("User", back_populates="emergency_contacts")

class Trip(Base):
    __tablename__ = "trips"
    id = Column(Integer, primary_key=True, index=True)
    passenger_id = Column(Integer, ForeignKey("users.id"))
    driver_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    pickup_location = Column(String(255))
    destination = Column(String(255))
    distance_km = Column(Float, default=0.0)
    duration_minutes = Column(Float, default=0.0)
    fare = Column(Float, default=0.0)
    payment_method = Column(String(20), default="Cash")
    status = Column(String(50), default="Searching")
    start_time = Column(DateTime(timezone=True), server_default=func.now())

class AiSafetyLog(Base):
    __tablename__ = "ai_safety_logs"
    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"))
    transcript = Column(Text)
    detected_at = Column(DateTime(timezone=True), server_default=func.now())

class Admin(Base):
    __tablename__ = "admins"
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    admin_level = Column(String(50), default="Standard")
    can_manage_users = Column(Boolean, default=True)