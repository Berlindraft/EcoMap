import os
import firebase_admin
from firebase_admin import credentials, firestore, auth as firebase_auth
import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv

# Load .env from backend root
load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))

# --- Firebase Admin SDK ---
_cred_path = os.path.join(
    os.path.dirname(__file__), "..", "..", os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH", "serviceAccountKey.json")
)

if not firebase_admin._apps:
    cred = credentials.Certificate(os.path.normpath(_cred_path))
    firebase_admin.initialize_app(cred)

db = firestore.client()
admin_auth = firebase_auth

# --- Cloudinary ---
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True,
)

# --- Roboflow ---
ROBOFLOW_API_KEY = os.getenv("ROBOFLOW_API_KEY", "")
ROBOFLOW_WORKSPACE = os.getenv("ROBOFLOW_WORKSPACE", "raymunds-workspace")
ROBOFLOW_WORKFLOW_ID = os.getenv("ROBOFLOW_WORKFLOW_ID", "detect-count-and-visualize-2")

# --- Report Cooldown ---
# Minimum hours between reports from the same user (globally) and
# between any reports within REPORT_RADIUS_METERS of each other.
REPORT_COOLDOWN_HOURS = float(os.getenv("REPORT_COOLDOWN_HOURS", "4"))
REPORT_RADIUS_METERS = float(os.getenv("REPORT_RADIUS_METERS", "10"))


