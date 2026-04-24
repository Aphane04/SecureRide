from sqlalchemy import Column, Integer, String, ForeignKey, Enum, DateTime
from sqlalchemy.ext.declarative import declarative_base
import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(100), unique=True, index=True)
    password = Column(String(255))
    role = Column(String(20)) # Admin, Passenger, Driver
    is_verified = Column(Integer, default=0)

class Profile(Base):
    __tablename__ = "profiles"
    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    full_name = Column(String(255))
    id_number = Column(String(50))
    phone = Column(String(20))
    address = Column(String(255))