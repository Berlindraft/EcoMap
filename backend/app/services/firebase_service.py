"""
Firestore CRUD operations for all EcoMap collections.
"""
import uuid
from datetime import datetime, timezone
from google.cloud.firestore_v1 import FieldFilter
from app.core.config import db


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _new_id() -> str:
    return uuid.uuid4().hex[:20]


# ──────────────────────────────────────
# USERS
# ──────────────────────────────────────

def create_user(data: dict) -> dict:
    uid = data["uid"]
    doc = {
        "uid": uid,
        "full_name": data.get("full_name", ""),
        "email": data.get("email", ""),
        "phone": data.get("phone", ""),
        "profile_photo": data.get("profile_photo", ""),
        "barangay": data.get("barangay", ""),
        "city": data.get("city", "Cebu City"),
        "eco_points_balance": 0,
        "created_at": _now(),
    }
    db.collection("users").document(uid).set(doc)
    return doc


def get_user(uid: str) -> dict | None:
    snap = db.collection("users").document(uid).get()
    if snap.exists:
        return snap.to_dict()
    return None


def update_user(uid: str, updates: dict) -> dict | None:
    ref = db.collection("users").document(uid)
    # filter out None values
    clean = {k: v for k, v in updates.items() if v is not None}
    if clean:
        ref.update(clean)
    return get_user(uid)


# ──────────────────────────────────────
# REPORTS
# ──────────────────────────────────────

def create_report(data: dict) -> dict:
    report_id = _new_id()
    doc = {
        "report_id": report_id,
        "user_id": data["user_id"],
        "image_url": data.get("image_url", ""),
        "geo_lat": data.get("geo_lat", 0.0),
        "geo_lng": data.get("geo_lng", 0.0),
        "heading": data.get("heading"),  # compass heading (degrees) user was facing
        "waste_type": data.get("waste_type", "mixed"),
        "severity": data.get("severity", "medium"),
        "ai_confidence": data.get("ai_confidence", 0.0),
        "status": "pending",
        "description": data.get("description", ""),
        "created_at": _now(),
    }
    db.collection("reports").document(report_id).set(doc)
    # Award eco points for reporting
    add_eco_points(data["user_id"], "report", 50)
    return doc


def get_reports(waste_type: str | None = None, severity: str | None = None, limit: int = 50) -> list[dict]:
    ref = db.collection("reports")
    query = ref.order_by("created_at", direction="DESCENDING").limit(limit)
    docs = query.stream()
    results = []
    for d in docs:
        item = d.to_dict()
        if waste_type and item.get("waste_type") != waste_type:
            continue
        if severity and item.get("severity") != severity:
            continue
        results.append(item)
    return results


def get_report(report_id: str) -> dict | None:
    snap = db.collection("reports").document(report_id).get()
    if snap.exists:
        return snap.to_dict()
    return None


def get_user_reports(uid: str, limit: int = 20) -> list[dict]:
    docs = (
        db.collection("reports")
        .where(filter=FieldFilter("user_id", "==", uid))
        .limit(limit)
        .stream()
    )
    results = [d.to_dict() for d in docs]
    # Sort in Python to avoid needing a composite index
    results.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return results


# ──────────────────────────────────────
# TRASHCARE JOBS
# ──────────────────────────────────────

def create_job(data: dict) -> dict:
    job_id = _new_id()
    doc = {
        "job_id": job_id,
        "posted_by": data["posted_by"],
        "job_type": data.get("job_type", "cleanup"),
        "title": data.get("title", ""),
        "description": data.get("description", ""),
        "location": data.get("location", ""),
        "geo_lat": data.get("geo_lat", 0.0),
        "geo_lng": data.get("geo_lng", 0.0),
        "pay_amount": data.get("pay_amount", 0.0),
        "status": "open",
        "created_at": _now(),
    }
    db.collection("jobs").document(job_id).set(doc)
    return doc


def get_jobs(limit: int = 50) -> list[dict]:
    docs = (
        db.collection("jobs")
        .order_by("created_at", direction="DESCENDING")
        .limit(limit)
        .stream()
    )
    return [d.to_dict() for d in docs]


def apply_to_job(data: dict) -> dict:
    app_id = _new_id()
    doc = {
        "application_id": app_id,
        "job_id": data["job_id"],
        "applicant_id": data["applicant_id"],
        "status": "pending",
        "applied_at": _now(),
    }
    db.collection("job_applications").document(app_id).set(doc)
    return doc


# ──────────────────────────────────────
# REWARDS & REDEMPTIONS
# ──────────────────────────────────────

def get_rewards() -> list[dict]:
    docs = db.collection("rewards").stream()
    return [d.to_dict() for d in docs]


def redeem_reward(user_id: str, reward_id: str) -> dict | None:
    # Get reward
    reward_snap = db.collection("rewards").document(reward_id).get()
    if not reward_snap.exists:
        return None
    reward = reward_snap.to_dict()

    # Check user points
    user = get_user(user_id)
    if not user:
        return None
    if user.get("eco_points_balance", 0) < reward.get("points_required", 0):
        return None

    # Check stock
    if reward.get("stock", 0) <= 0:
        return None

    # Create redemption
    redemption_id = _new_id()
    code = f"ECO-{uuid.uuid4().hex[:6].upper()}"
    doc = {
        "redemption_id": redemption_id,
        "user_id": user_id,
        "reward_id": reward_id,
        "reward_name": reward.get("name", ""),
        "status": "pending",
        "code": code,
        "redeemed_at": _now(),
    }
    db.collection("redemptions").document(redemption_id).set(doc)

    # Deduct points
    new_balance = user["eco_points_balance"] - reward["points_required"]
    db.collection("users").document(user_id).update({"eco_points_balance": new_balance})

    # Decrement stock
    db.collection("rewards").document(reward_id).update({"stock": reward["stock"] - 1})

    return doc


# ──────────────────────────────────────
# ECO-POINTS
# ──────────────────────────────────────

POINT_VALUES = {
    "report": 50,
    "cleanup": 100,
    "segregation_help": 30,
}


def add_eco_points(user_id: str, action: str, points: int | None = None) -> dict:
    pts = points if points is not None else POINT_VALUES.get(action, 10)
    points_id = _new_id()
    doc = {
        "points_id": points_id,
        "user_id": user_id,
        "action": action,
        "points_earned": pts,
        "created_at": _now(),
    }
    db.collection("eco_points").document(points_id).set(doc)

    # Update user balance
    user_ref = db.collection("users").document(user_id)
    user_snap = user_ref.get()
    if user_snap.exists:
        current = user_snap.to_dict().get("eco_points_balance", 0)
        user_ref.update({"eco_points_balance": current + pts})

    return doc


def get_user_points_history(user_id: str) -> list[dict]:
    docs = (
        db.collection("eco_points")
        .where(filter=FieldFilter("user_id", "==", user_id))
        .stream()
    )
    results = [d.to_dict() for d in docs]
    # Sort in Python to avoid needing a composite index
    results.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return results
