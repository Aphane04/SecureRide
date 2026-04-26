# backend/create_tables.py
from database import engine, Base
import models # This imports the classes above

print("Connecting to Aiven...")
Base.metadata.drop_all(bind=engine) # Caution: This deletes old tables to start fresh
Base.metadata.create_all(bind=engine)
print("SUCCESS: All 8 tables (Users, Passengers, Drivers, Vehicles, etc.) created!")