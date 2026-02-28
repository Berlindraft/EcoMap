"""
EcoMap API routes – all REST endpoints for the mobile app.
"""
from fastapi import APIRouter, UploadFile, File, HTTPException, Body
from app.models.schemas import (
    UserCreate, UserUpdate, UserOut, UserRoleUpdate,
    ReportCreate, ReportOut,
    JobCreate, JobOut, JobApplicationCreate, JobApplicationOut,
    RewardOut, RewardCreate, RewardUpdate, RedemptionCreate, RedemptionOut,
    EcoPointsOut, AIAnalysisResult, DetectionResult,
    CleanupVerifyRequest, CleanupVerifyResult,
    ProductCreate, ProductUpdate, ProductOut,
    DashboardStats,
)
from app.services import firebase_service as fs
from app.services.cloudinary_service import upload_image
from app.services.inference import analyze_image, detect_objects, verify_cleanup

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
    # Enforce cooldown: per-user (4h) + area proximity (10m / 4h)
    try:
        cooldown_msg = fs.check_report_cooldown(data.user_id, data.geo_lat, data.geo_lng)
        if cooldown_msg:
            raise HTTPException(status_code=429, detail=cooldown_msg)
    except HTTPException:
        raise
    except Exception as e:
        # If cooldown check fails (e.g. missing Firestore index), log and allow
        print(f"[Cooldown check error, allowing report] {e}")
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
# CLEANUP VERIFICATION
# ──────────────────────────────────────

@router.post("/reports/{report_id}/cleanup", response_model=CleanupVerifyResult)
async def verify_and_cleanup(report_id: str, data: CleanupVerifyRequest):
    """
    Accept a cleanup photo, run AI verification, and if the area looks
    clean mark the report as cleaned + award points.
    """
    # 1. Verify the report exists
    report = fs.get_report(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    if report.get("status") == "cleaned":
        return CleanupVerifyResult(
            success=False, waste_detected=0,
            message="This report has already been cleaned.",
        )

    # 2. Run AI cleanup verification
    result = await verify_cleanup(data.image_base64)

    if not result["verified"]:
        return CleanupVerifyResult(
            success=False,
            waste_detected=result["waste_detected"],
            message=result["message"],
        )

    # 3. Upload cleanup photo to Cloudinary
    import base64
    img_bytes = base64.b64decode(data.image_base64)
    cleanup_url = upload_image(img_bytes)
    if not cleanup_url:
        cleanup_url = ""

    # 4. Mark report as cleaned + award points
    fs.mark_report_cleaned(report_id, data.user_id, cleanup_url)

    return CleanupVerifyResult(
        success=True,
        waste_detected=result["waste_detected"],
        message=result["message"],
        points_awarded=100,
        cleanup_image_url=cleanup_url,
    )


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


@router.post("/rewards", response_model=RewardOut)
async def create_reward(data: RewardCreate):
    return fs.create_reward(data.model_dump())


@router.put("/rewards/{reward_id}", response_model=RewardOut)
async def update_reward_endpoint(reward_id: str, data: RewardUpdate):
    result = fs.update_reward(reward_id, data.model_dump(exclude_none=True))
    if not result:
        raise HTTPException(status_code=404, detail="Reward not found")
    return result


@router.delete("/rewards/{reward_id}")
async def delete_reward_endpoint(reward_id: str):
    if not fs.delete_reward(reward_id):
        raise HTTPException(status_code=404, detail="Reward not found")
    return {"ok": True}


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


# ──────────────────────────────────────
# DASHBOARD
# ──────────────────────────────────────

@router.get("/dashboard/stats")
async def get_dashboard_stats():
    return fs.get_dashboard_stats()


# ──────────────────────────────────────
# USER MANAGEMENT (ADMIN)
# ──────────────────────────────────────

@router.get("/admin/users", response_model=list[UserOut])
async def list_all_users():
    return fs.get_all_users()


@router.put("/admin/users/{uid}/role", response_model=UserOut)
async def update_user_role(uid: str, data: UserRoleUpdate):
    if data.role not in ("user", "partner", "admin"):
        raise HTTPException(status_code=400, detail="Invalid role")
    user = fs.update_user_role(uid, data.role)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


# ──────────────────────────────────────
# PARTNER PRODUCTS
# ──────────────────────────────────────

@router.get("/products", response_model=list[ProductOut])
async def list_products(partner_id: str | None = None):
    return fs.get_products(partner_id=partner_id)


@router.post("/products", response_model=ProductOut)
async def create_product(data: ProductCreate):
    return fs.create_product(data.model_dump())


@router.put("/products/{product_id}", response_model=ProductOut)
async def update_product(product_id: str, data: ProductUpdate):
    result = fs.update_product(product_id, data.model_dump())
    if not result:
        raise HTTPException(status_code=404, detail="Product not found")
    return result


@router.delete("/products/{product_id}")
async def delete_product(product_id: str):
    ok = fs.delete_product(product_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"deleted": True}
