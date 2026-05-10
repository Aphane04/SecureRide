SecureRide | AI-Powered E-hailing Terminal
SecureRide is a next-generation e-hailing platform designed with a "Safety-First" philosophy. Unlike standard ride-sharing apps, SecureRide utilizes real-time AI monitoring and biometric identity verification to ensure the security of both passengers and drivers.
![alt text](https://img.shields.io/badge/Security-Terminal_v2.4-008751?style=for-the-badge)

![alt text](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)

![alt text](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi&logoColor=white)
🛡️ Core Safety Features
Multi-Step Biometric Registration: Users cannot access the network without completing a legal consent form, uploading valid identification, and passing a 3D AI liveness face scan.
AI Safety Guard: An active trip monitor that uses the Web Speech API to listen for danger-related keywords (e.g., "help", "police", "stop").
Emergency Protocol: If the AI detects a threat, it automatically logs a high-severity alert to the Admin Safety Center for immediate intervention.
Real-time Fleet Tracking: Continuous GPS monitoring of active missions with route visualization via Google Maps API.
🚀 The Verification Chain
SecureRide implements a rigorous onboarding process for all non-admin users:
Registry: Collection of personal data and ID numbers.
Consent: Digital agreement to POPIA/GDPR data handling and AI monitoring.
ID Upload: Secure Base64 storage of identity documentation.
Face Scan: AI-powered liveness detection (Center, Left, and Right bias checks).
💻 Tech Stack
Frontend
Framework: React.js
Styling: Tailwind CSS (Professional White & Dim Gray aesthetic)
Icons: Lucide-React
Maps: Google Maps Platform (Javascript API, Geocoding, Directions)
AI Vision: face-api.js (TensorFlow.js)
Backend
Framework: FastAPI (Python)
Database: SQLAlchemy ORM (MySQL/PostgreSQL)
Security: JWT Authentication & SHA-256 Password Hashing
Persistence: Base64 encoded image storage (Optimized for Serverless deployment)
🛠️ Installation & Setup
Prerequisites
Node.js (v16+)
Python 3.9+
Google Maps API Key
Backend Setup
Navigate to the /backend folder.
Install dependencies:
code
Bash
pip install -r requirements.txt
Create a .env file:
code
Env
DATABASE_URL=mysql+pymysql://user:pass@host/db
JWT_SECRET_KEY=your_secret_key
Start the server:
code
Bash
uvicorn main:app --reload
Frontend Setup
Navigate to the /frontend folder.
Install dependencies:
code
Bash
npm install
Update the Google Maps API Key in PassengerRide.js and DriverOverview.js.
Start the application:
code
Bash
npm start
🗺️ Environment Variables
To run this project, you will need to add the following variables to your Vercel/Render dashboard:
REACT_APP_API_URL : The URL of your deployed FastAPI backend.
JWT_SECRET_KEY : A secure string for token generation.
ALLOWED_ORIGINS : Your frontend Vercel URL (for CORS).
📑 Database Schema (Singular Naming)
The system utilizes a singular relational structure:
user: Core authentication data.
profile: Detailed personal identity and Base64 ID images.
driver / passenger: Role-specific attributes.
trip: Real-time mission logistics and status.
ai_safety_log: Transcripts of AI-flagged danger events.
