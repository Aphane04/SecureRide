import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Get the database URL from .env
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")
AIVEN_CA_PATH = os.getenv("AIVEN_CA_PATH")

if not SQLALCHEMY_DATABASE_URL:
    raise ValueError("DATABASE_URL not found in environment variables. Check your .env file.")

# Ensure we're using PyMySQL driver
if "mysql://" in SQLALCHEMY_DATABASE_URL:
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("mysql://", "mysql+pymysql://")
elif "mysql+mysqlconnector://" in SQLALCHEMY_DATABASE_URL:
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("mysql+mysqlconnector://", "mysql+pymysql://")

# SSL config for Aiven (if provided)
connect_args = {
    "charset": "utf8mb4",
}

if AIVEN_CA_PATH:
    connect_args["ssl"] = {"ca": AIVEN_CA_PATH, "check_hostname": True}
else:
    # For production without custom CA (Render, Aiven cloud, etc.)
    connect_args["ssl"] = {"check_hostname": False}

# Configure the Engine
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_recycle=3600,
    pool_pre_ping=True,
    connect_args=connect_args,
    pool_size=10,
    max_overflow=20,
    echo=False  # Set to True for SQL logging during development
)

# Create a session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for our models (used in models.py)
Base = declarative_base()

# Dependency to provide a database session to FastAPI routes
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Function to create all tables (Run this once on startup)
def init_db():
    import models  # Imported here to avoid circular imports
    Base.metadata.create_all(bind=engine)