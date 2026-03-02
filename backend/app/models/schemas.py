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

class JobApprovalStatus(str, Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"

class ApplicationStatus(str, Enum):
    pending = "pending"
    accepted = "accepted"
    rejected = "rejected"
    completed = "completed"

class RedemptionStatus(str, Enum):
    pending = "pending"
    claimed = "claimed"
    expired = "expired"

class UserRole(str, Enum):
    user = "user"
    partner = "partner"
    admin = "admin"

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
    eco_tokens_balance: int = 0
    credits_balance: int = 15  # all users get 15 free credits

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    profile_photo: Optional[str] = None
    barangay: Optional[str] = None
    city: Optional[str] = None

class UserRoleUpdate(BaseModel):
    role: str  # "user", "partner", "admin"

class UserOut(BaseModel):
    uid: str
    full_name: str
    email: str
    phone: str = ""
    profile_photo: str = ""
    barangay: str = ""
    city: str = "Cebu City"
    role: str = "user"
    eco_points_balance: int = 0
    eco_tokens_balance: int = 0
    credits_balance: int = 15
    created_at: Optional[str] = None


# ──────────────────────────────────────
# Report
# ──────────────────────────────────────

class ReportCreate(BaseModel):
    user_id: str
    image_url: str
    geo_lat: float
    geo_lng: float
    heading: Optional[float] = None  # compass heading (0-360) the user was facing
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
    heading: Optional[float] = None
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
    token_reward: int = 0       # eco tokens offered to the worker
    credits_cost: int = 10      # credits deducted from poster (default 10)
    image_url: str = ""

class JobOut(BaseModel):
    job_id: str
    posted_by: str
    poster_name: str = ""
    job_type: str = "cleanup"
    title: str = ""
    description: str = ""
    location: str = ""
    geo_lat: float = 0.0
    geo_lng: float = 0.0
    pay_amount: float = 0.0
    token_reward: int = 0
    credits_cost: int = 10
    image_url: str = ""
    approval_status: str = "pending"  # pending / approved / rejected
    reviewer_id: str = ""
    status: str = "open"
    created_at: Optional[str] = None

class JobApprovalUpdate(BaseModel):
    reviewer_id: str
    note: str = ""


# ──────────────────────────────────────
# Eco Tokens & Credits
# ──────────────────────────────────────

class TokenPurchaseCreate(BaseModel):
    user_id: str
    amount: int           # number of tokens to buy
    php_amount: float     # PHP paid (1 token = 1 PHP)

class TokenPurchaseOut(BaseModel):
    transaction_id: str
    user_id: str
    type: str = "purchase"  # purchase / convert / escrow / payout
    amount: int = 0
    php_amount: float = 0.0
    created_at: Optional[str] = None

class ConvertPointsRequest(BaseModel):
    user_id: str
    points_to_convert: int  # must be multiple of 5

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
    partner_id: str = ""

class RewardCreate(BaseModel):
    name: str
    description: str = ""
    points_required: int = 0
    stock: int = 0
    icon: str = "🎁"
    partner_name: str = "EcoMap"
    partner_id: str = ""

class RewardUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    points_required: Optional[int] = None
    stock: Optional[int] = None
    icon: Optional[str] = None
    partner_name: Optional[str] = None

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


# ──────────────────────────────────────
# Object Detection (Bounding Boxes)
# ──────────────────────────────────────

# ──────────────────────────────────────
# Cleanup Verification
# ──────────────────────────────────────

class CleanupVerifyRequest(BaseModel):
    report_id: str
    user_id: str
    image_base64: str  # photo of the cleaned-up area

class CleanupVerifyResult(BaseModel):
    success: bool
    waste_detected: int = 0
    message: str = ""
    points_awarded: int = 0
    cleanup_image_url: str = ""


class DetectionBox(BaseModel):
    x: float
    y: float
    width: float
    height: float
    class_name: str
    confidence: float
    waste_type: str
    color: str  # hex color for the bounding box

class DetectionSummary(BaseModel):
    total_count: int
    waste_type: str
    severity: str

class DetectionResult(BaseModel):
    detections: list[DetectionBox]
    summary: DetectionSummary
    image_width: int = 0
    image_height: int = 0


# ──────────────────────────────────────
# Partner Products
# ──────────────────────────────────────

class ProductCreate(BaseModel):
    partner_id: str
    name: str
    description: str = ""
    price: float = 0.0
    points_price: int = 0  # eco-points price (0 = not redeemable with points)
    category: str = "general"
    stock: int = 0
    image_url: str = ""

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    points_price: Optional[int] = None
    category: Optional[str] = None
    stock: Optional[int] = None
    image_url: Optional[str] = None

class ProductOut(BaseModel):
    product_id: str
    partner_id: str
    partner_name: str = ""
    name: str
    description: str = ""
    price: float = 0.0
    points_price: int = 0
    category: str = "general"
    stock: int = 0
    image_url: str = ""
    created_at: Optional[str] = None


# ──────────────────────────────────────
# Dashboard Stats
# ──────────────────────────────────────

class DashboardStats(BaseModel):
    total_users: int = 0
    total_reports: int = 0
    total_cleaned: int = 0
    total_points_distributed: int = 0
    total_rewards_redeemed: int = 0
    total_jobs: int = 0
    total_products: int = 0
    recent_reports: list = []
    recent_redemptions: list = []
