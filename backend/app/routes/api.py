"""
EcoMap API routes – all REST endpoints for the mobile app.
"""
from fastapi import APIRouter, UploadFile, File, HTTPException, Body
from app.models.schemas import (
    UserCreate, UserUpdate, UserOut,
    ReportCreate, ReportOut,
    JobCreate, JobOut, JobApplicationCreate, JobApplicationOut,
    RewardOut, RedemptionCreate, RedemptionOut,
    EcoPointsOut, AIAnalysisResult, DetectionResult,
)
from app.services import firebase_service as fs
from app.services.cloudinary_service import upload_image
from app.services.inference import analyze_image, detect_objects

router = APIRouter(prefix="/api")


# ──────────────────────────────────────
# AUTH / USERS
# ──────────────────────────────────────

@router.post("/auth/register", response_model=UserOut)
async def register_user(data: UserCreate):
    """Create a new user document in Firestore after Firebase Auth signup on client."""
    existing = fs.get_user(data.uid)
    if existing:
        return existing
    user = fs.create_user(data.model_dump())
    return user


@router.get("/users/{uid}", response_model=UserOut)
async def get_user(uid: str):
    user = fs.get_user(uid)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.put("/users/{uid}", response_model=UserOut)
async def update_user(uid: str, data: UserUpdate):
    user = fs.update_user(uid, data.model_dump())
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


# ──────────────────────────────────────
# REPORTS
# ──────────────────────────────────────

@router.post("/reports", response_model=ReportOut)
async def create_report(data: ReportCreate):
    report = fs.create_report(data.model_dump())
    return report


@router.get("/reports", response_model=list[ReportOut])
async def list_reports(
    waste_type: str | None = None,
    severity: str | None = None,
    limit: int = 50,
):
    return fs.get_reports(waste_type=waste_type, severity=severity, limit=limit)


@router.get("/reports/{report_id}", response_model=ReportOut)
async def get_report(report_id: str):
    report = fs.get_report(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report


@router.get("/users/{uid}/reports", response_model=list[ReportOut])
async def get_user_reports(uid: str, limit: int = 20):
    return fs.get_user_reports(uid, limit=limit)


# ──────────────────────────────────────
# TRASHCARE JOBS
# ──────────────────────────────────────

@router.get("/jobs", response_model=list[JobOut])
async def list_jobs(limit: int = 50):
    return fs.get_jobs(limit=limit)


@router.post("/jobs", response_model=JobOut)
async def create_job(data: JobCreate):
    return fs.create_job(data.model_dump())


@router.post("/jobs/{job_id}/apply", response_model=JobApplicationOut)
async def apply_to_job(job_id: str, data: JobApplicationCreate):
    data.job_id = job_id
    return fs.apply_to_job(data.model_dump())


# ──────────────────────────────────────
# REWARDS & REDEMPTIONS
# ──────────────────────────────────────

@router.get("/rewards", response_model=list[RewardOut])
async def list_rewards():
    return fs.get_rewards()


@router.post("/rewards/redeem", response_model=RedemptionOut)
async def redeem_reward(data: RedemptionCreate):
    result = fs.redeem_reward(data.user_id, data.reward_id)
    if not result:
        raise HTTPException(status_code=400, detail="Cannot redeem. Check points balance or reward availability.")
    return result


# ──────────────────────────────────────
# ECO-POINTS
# ──────────────────────────────────────

@router.get("/users/{uid}/points", response_model=list[EcoPointsOut])
async def get_user_points(uid: str):
    return fs.get_user_points_history(uid)


# ──────────────────────────────────────
# IMAGE UPLOAD
# ──────────────────────────────────────

@router.post("/upload/image")
async def upload_image_endpoint(file: UploadFile = File(...)):
    contents = await file.read()
    url = upload_image(contents)
    if not url:
        raise HTTPException(status_code=500, detail="Image upload failed")
    return {"url": url}


# ──────────────────────────────────────
# AI ANALYSIS
# ──────────────────────────────────────

@router.post("/analyze", response_model=AIAnalysisResult)
async def analyze_waste(image_base64: str = Body(..., embed=True)):
    """Analyze a base64-encoded image for waste classification."""
    result = await analyze_image(image_base64)
    return result


@router.post("/detect", response_model=DetectionResult)
async def detect_waste(image_base64: str = Body(..., embed=True)):
    """Detect waste objects and return bounding boxes for overlay rendering."""
    result = await detect_objects(image_base64)
    return result
