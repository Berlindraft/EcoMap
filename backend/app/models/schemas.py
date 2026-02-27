from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum
from datetime import datetime


# ──────────────────────────────────────
# Enums
# ──────────────────────────────────────

class WasteType(str, Enum):
    plastic = "plastic"
    biodegradable = "biodegradable"
    hazardous = "hazardous"
    e_waste = "e-waste"
    metal = "metal"
    mixed = "mixed"

class Severity(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"

class ReportStatus(str, Enum):
    pending = "pending"
    verified = "verified"
    rejected = "rejected"
    cleaned = "cleaned"

class JobType(str, Enum):
    segregation = "segregation"
    cleanup = "cleanup"
    hauling = "hauling"

class JobStatus(str, Enum):
    open = "open"
    assigned = "assigned"
    completed = "completed"
    cancelled = "cancelled"

class ApplicationStatus(str, Enum):
    pending = "pending"
    accepted = "accepted"
    rejected = "rejected"
    completed = "completed"

class RedemptionStatus(str, Enum):
    pending = "pending"
    claimed = "claimed"
    expired = "expired"

class EcoAction(str, Enum):
    report = "report"
    cleanup = "cleanup"
    segregation_help = "segregation_help"


# ──────────────────────────────────────
# User
# ──────────────────────────────────────

class UserCreate(BaseModel):
    uid: str
    full_name: str
    email: str
    phone: Optional[str] = ""
    profile_photo: Optional[str] = ""
    barangay: Optional[str] = ""
    city: Optional[str] = "Cebu City"

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    profile_photo: Optional[str] = None
    barangay: Optional[str] = None
    city: Optional[str] = None

class UserOut(BaseModel):
    uid: str
    full_name: str
    email: str
    phone: str = ""
    profile_photo: str = ""
    barangay: str = ""
    city: str = "Cebu City"
    eco_points_balance: int = 0
    created_at: Optional[str] = None


# ──────────────────────────────────────
# Report
# ──────────────────────────────────────

class ReportCreate(BaseModel):
    user_id: str
    image_url: str
    geo_lat: float
    geo_lng: float
    waste_type: str = "mixed"
    severity: str = "medium"
    ai_confidence: float = 0.0
    description: Optional[str] = ""

class ReportOut(BaseModel):
    report_id: str
    user_id: str
    image_url: str = ""
    geo_lat: float = 0.0
    geo_lng: float = 0.0
    waste_type: str = "mixed"
    severity: str = "medium"
    ai_confidence: float = 0.0
    status: str = "pending"
    description: str = ""
    created_at: Optional[str] = None


# ──────────────────────────────────────
# TrashCare Jobs
# ──────────────────────────────────────

class JobCreate(BaseModel):
    posted_by: str
    job_type: str = "cleanup"
    title: str
    description: str = ""
    location: str = ""
    geo_lat: float = 0.0
    geo_lng: float = 0.0
    pay_amount: float = 0.0

class JobOut(BaseModel):
    job_id: str
    posted_by: str
    job_type: str = "cleanup"
    title: str = ""
    description: str = ""
    location: str = ""
    geo_lat: float = 0.0
    geo_lng: float = 0.0
    pay_amount: float = 0.0
    status: str = "open"
    created_at: Optional[str] = None

class JobApplicationCreate(BaseModel):
    job_id: str
    applicant_id: str

class JobApplicationOut(BaseModel):
    application_id: str
    job_id: str
    applicant_id: str
    status: str = "pending"
    applied_at: Optional[str] = None


# ──────────────────────────────────────
# Rewards / Redemption
# ──────────────────────────────────────

class RewardOut(BaseModel):
    reward_id: str
    name: str
    description: str = ""
    points_required: int = 0
    stock: int = 0
    icon: str = ""
    partner_name: str = ""

class RedemptionCreate(BaseModel):
    user_id: str
    reward_id: str

class RedemptionOut(BaseModel):
    redemption_id: str
    user_id: str
    reward_id: str
    reward_name: str = ""
    status: str = "pending"
    code: str = ""
    redeemed_at: Optional[str] = None


# ──────────────────────────────────────
# Eco-Points
# ──────────────────────────────────────

class EcoPointsOut(BaseModel):
    points_id: str
    user_id: str
    action: str
    points_earned: int
    created_at: Optional[str] = None


# ──────────────────────────────────────
# AI Analysis
# ──────────────────────────────────────

class AIAnalysisResult(BaseModel):
    waste_type: str
    severity: str
    confidence: float
    action: str
