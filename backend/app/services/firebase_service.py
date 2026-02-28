"""
Firestore CRUD operations for all EcoMap collections.
"""
import math
import uuid
from datetime import datetime, timezone, timedelta
from google.cloud.firestore_v1 import FieldFilter
from app.core.config import db, REPORT_COOLDOWN_HOURS, REPORT_RADIUS_METERS


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
        "role": "user",
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
# REPORT COOLDOWN CHECKS
# ──────────────────────────────────────

def _haversine_meters(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Haversine distance in meters between two lat/lng points."""
    R = 6_371_000
    to_rad = lambda d: d * math.pi / 180
    dLat = to_rad(lat2 - lat1)
    dLng = to_rad(lng2 - lng1)
    a = math.sin(dLat / 2) ** 2 + math.cos(to_rad(lat1)) * math.cos(to_rad(lat2)) * math.sin(dLng / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def check_report_cooldown(user_id: str, geo_lat: float, geo_lng: float) -> str | None:
    """Return an error message if the user or area is still on cooldown, else None."""
    cutoff = (datetime.now(timezone.utc) - timedelta(hours=REPORT_COOLDOWN_HOURS)).isoformat()

    # 1. Global per-user cooldown
    user_recent = (
        db.collection("reports")
        .where(filter=FieldFilter("user_id", "==", user_id))
        .where(filter=FieldFilter("created_at", ">=", cutoff))
        .limit(1)
        .stream()
    )
    if any(True for _ in user_recent):
        return f"You can only submit a report once every {int(REPORT_COOLDOWN_HOURS)} hour(s). Please wait before submitting again."

    # 2. Area-based cooldown – any report within REPORT_RADIUS_METERS in the last N hours
    #    Firestore can't do geo queries, so fetch recent reports and check distance.
    recent_docs = (
        db.collection("reports")
        .where(filter=FieldFilter("created_at", ">=", cutoff))
        .stream()
    )
    for d in recent_docs:
        r = d.to_dict()
        dist = _haversine_meters(geo_lat, geo_lng, r.get("geo_lat", 0), r.get("geo_lng", 0))
        if dist <= REPORT_RADIUS_METERS:
            return f"A report already exists within {int(REPORT_RADIUS_METERS)}m of this location in the last {int(REPORT_COOLDOWN_HOURS)} hour(s). Please wait or move to a different area."

    return None


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
        if item.get("status") == "cleaned":
            continue
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


def mark_report_cleaned(report_id: str, user_id: str, cleanup_image_url: str = "") -> dict | None:
    """Mark a report as 'cleaned', store the cleanup photo, and award 100 eco-points."""
    ref = db.collection("reports").document(report_id)
    snap = ref.get()
    if not snap.exists:
        return None
    report = snap.to_dict()
    if report.get("status") == "cleaned":
        return {"already_cleaned": True, **report}
    ref.update({
        "status": "cleaned",
        "cleanup_image_url": cleanup_image_url,
        "cleaned_by": user_id,
        "cleaned_at": _now(),
    })
    # Award cleanup points (100)
    add_eco_points(user_id, "cleanup", 100)
    return {**report, "status": "cleaned", "cleanup_image_url": cleanup_image_url}


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
    """Return all rewards PLUS partner products that have a points_price > 0."""
    # 1. Classic rewards from the rewards collection
    rewards = [d.to_dict() for d in db.collection("rewards").stream()]

    # 2. Partner products redeemable with eco-points
    products = [d.to_dict() for d in db.collection("products").stream()]
    for p in products:
        if p.get("points_price", 0) > 0:
            # Map product fields → reward shape
            category_icons = {
                "food": "🍔",
                "drink": "🥤",
                "merchandise": "👕",
                "service": "🛠️",
                "general": "🎁",
                "other": "📦",
            }
            rewards.append({
                "reward_id": p["product_id"],
                "name": p.get("name", ""),
                "description": p.get("description", ""),
                "points_required": p["points_price"],
                "stock": p.get("stock", 0),
                "icon": category_icons.get(p.get("category", "general"), "🎁"),
                "partner_name": p.get("partner_name", "Partner"),
                "partner_id": p.get("partner_id", ""),
            })

    return rewards


def create_reward(data: dict) -> dict:
    reward_id = _new_id()
    doc = {
        "reward_id": reward_id,
        "name": data.get("name", ""),
        "description": data.get("description", ""),
        "points_required": data.get("points_required", 0),
        "stock": data.get("stock", 0),
        "icon": data.get("icon", "🎁"),
        "partner_name": data.get("partner_name", "EcoMap"),
        "partner_id": data.get("partner_id", ""),
    }
    db.collection("rewards").document(reward_id).set(doc)
    return doc


def update_reward(reward_id: str, updates: dict) -> dict | None:
    ref = db.collection("rewards").document(reward_id)
    snap = ref.get()
    if not snap.exists:
        return None
    clean = {k: v for k, v in updates.items() if v is not None}
    if clean:
        ref.update(clean)
    return ref.get().to_dict()


def delete_reward(reward_id: str) -> bool:
    ref = db.collection("rewards").document(reward_id)
    snap = ref.get()
    if not snap.exists:
        return False
    ref.delete()
    return True


def redeem_reward(user_id: str, reward_id: str) -> dict | None:
    # Try the rewards collection first, then fall back to products
    reward_snap = db.collection("rewards").document(reward_id).get()
    source_collection = "rewards"
    if reward_snap.exists:
        reward = reward_snap.to_dict()
        points_needed = reward.get("points_required", 0)
    else:
        # Check products collection (partner products redeemable with points)
        prod_snap = db.collection("products").document(reward_id).get()
        if not prod_snap.exists:
            return None
        reward = prod_snap.to_dict()
        points_needed = reward.get("points_price", 0)
        source_collection = "products"

    # Check user points
    user = get_user(user_id)
    if not user:
        return None
    if user.get("eco_points_balance", 0) < points_needed:
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
    new_balance = user["eco_points_balance"] - points_needed
    db.collection("users").document(user_id).update({"eco_points_balance": new_balance})

    # Decrement stock in the correct collection
    doc_id = reward.get("product_id", reward_id) if source_collection == "products" else reward_id
    db.collection(source_collection).document(doc_id).update({"stock": reward["stock"] - 1})

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


# ──────────────────────────────────────
# USER ROLE MANAGEMENT
# ──────────────────────────────────────

def get_all_users() -> list[dict]:
    """Return all user docs (admin use)."""
    docs = db.collection("users").stream()
    return [d.to_dict() for d in docs]


def update_user_role(uid: str, role: str) -> dict | None:
    """Set user role to 'user', 'partner', or 'admin'."""
    ref = db.collection("users").document(uid)
    try:
        ref.update({"role": role})          # single Firestore call; raises NotFound if missing
    except Exception:
        return None
    snap = ref.get()
    return snap.to_dict() if snap.exists else None


# ──────────────────────────────────────
# PARTNER PRODUCTS
# ──────────────────────────────────────

def create_product(data: dict) -> dict:
    product_id = _new_id()
    # Look up partner name for display on rewards page
    partner_name = "Partner"
    partner = get_user(data["partner_id"])
    if partner:
        partner_name = partner.get("full_name", "Partner")
    doc = {
        "product_id": product_id,
        "partner_id": data["partner_id"],
        "partner_name": partner_name,
        "name": data.get("name", ""),
        "description": data.get("description", ""),
        "price": data.get("price", 0.0),
        "points_price": data.get("points_price", 0),
        "category": data.get("category", "general"),
        "stock": data.get("stock", 0),
        "image_url": data.get("image_url", ""),
        "created_at": _now(),
    }
    db.collection("products").document(product_id).set(doc)
    return doc


def get_products(partner_id: str | None = None) -> list[dict]:
    ref = db.collection("products")
    if partner_id:
        docs = ref.where(filter=FieldFilter("partner_id", "==", partner_id)).stream()
    else:
        docs = ref.stream()
    results = [d.to_dict() for d in docs]
    results.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return results


def update_product(product_id: str, updates: dict) -> dict | None:
    ref = db.collection("products").document(product_id)
    snap = ref.get()
    if not snap.exists:
        return None
    clean = {k: v for k, v in updates.items() if v is not None}
    if clean:
        ref.update(clean)
    return ref.get().to_dict()


def delete_product(product_id: str) -> bool:
    ref = db.collection("products").document(product_id)
    snap = ref.get()
    if not snap.exists:
        return False
    ref.delete()
    return True


# ──────────────────────────────────────
# DASHBOARD STATS
# ──────────────────────────────────────

def get_dashboard_stats() -> dict:
    """Aggregate stats for the admin/partner dashboard."""
    users = list(db.collection("users").stream())
    reports = list(db.collection("reports").stream())
    redemptions = list(db.collection("redemptions").stream())
    jobs = list(db.collection("jobs").stream())
    products = list(db.collection("products").stream())
    points_docs = list(db.collection("eco_points").stream())

    total_points = sum(d.to_dict().get("points_earned", 0) for d in points_docs)
    cleaned = sum(1 for d in reports if d.to_dict().get("status") == "cleaned")

    # Recent reports (last 5)
    report_list = [d.to_dict() for d in reports]
    report_list.sort(key=lambda x: x.get("created_at", ""), reverse=True)

    # Recent redemptions (last 5)
    redeem_list = [d.to_dict() for d in redemptions]
    redeem_list.sort(key=lambda x: x.get("redeemed_at", ""), reverse=True)

    return {
        "total_users": len(users),
        "total_reports": len(reports),
        "total_cleaned": cleaned,
        "total_points_distributed": total_points,
        "total_rewards_redeemed": len(redemptions),
        "total_jobs": len(jobs),
        "total_products": len(products),
        "recent_reports": report_list[:5],
        "recent_redemptions": redeem_list[:5],
    }
