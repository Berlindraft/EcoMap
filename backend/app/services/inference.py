"""
Waste detection using Roboflow Workflow API via inference-sdk.
Uses asyncio.to_thread to keep FastAPI async-friendly.
"""
import asyncio
import base64
import io
import os
import tempfile
from PIL import Image as PILImage
from inference_sdk import InferenceHTTPClient
from app.core.config import ROBOFLOW_API_KEY, ROBOFLOW_WORKSPACE, ROBOFLOW_WORKFLOW_ID

# Percentage of image to keep (center crop) — avoids noisy edge detections
CROP_RATIO = 0.95


# ── Roboflow Workflow client ─────────────────────
_client = InferenceHTTPClient(
    api_url="https://detect.roboflow.com",
    api_key=ROBOFLOW_API_KEY,
)


# ── Helpers ──────────────────────────────

def _map_class_to_waste_type(class_name: str) -> str:
    """Map TACO dataset class names to waste type categories."""
    cl = class_name.lower()
    if any(k in cl for k in ["plastic", "bottle", "bag", "cup", "straw", "lid", "container", "wrapper", "styrofoam"]):
        return "plastic"
    if any(k in cl for k in ["food", "organic", "bio", "fruit", "vegetable"]):
        return "biodegradable"
    if any(k in cl for k in ["battery", "chemical", "hazard", "syringe", "medical"]):
        return "hazardous"
    if any(k in cl for k in ["electronic", "e-waste", "device", "phone", "wire", "cable"]):
        return "e-waste"
    if any(k in cl for k in ["can", "aluminum", "metal", "tin", "foil", "cap"]):
        return "metal"
    if any(k in cl for k in ["paper", "cardboard", "carton", "magazine", "newspaper", "tissue"]):
        return "paper"
    if any(k in cl for k in ["glass", "broken glass", "jar"]):
        return "glass"
    if any(k in cl for k in ["cigarette", "butt", "tobacco"]):
        return "cigarette"
    return "mixed"


def _severity_from_count(count: int) -> str:
    if count >= 10:
        return "critical"
    if count >= 5:
        return "high"
    if count >= 2:
        return "medium"
    return "low"


def _action_advice(waste_type: str, severity: str) -> str:
    advice = {
        "plastic": "Separate recyclable plastics. Do not burn.",
        "biodegradable": "Compost if possible. Keep separate from recyclables.",
        "hazardous": "Do not handle directly. Contact local waste authority.",
        "e-waste": "Drop off at designated e-waste collection points.",
        "metal": "Collect and bring to scrap metal recycler.",
        "mixed": "Requires manual segregation before collection.",
    }
    base = advice.get(waste_type, "Sort and dispose properly.")
    if severity in ("critical", "high"):
        base += " URGENT: Report to authorities immediately."
    return base


WASTE_COLORS = {
    "plastic": "#FF6B6B",
    "biodegradable": "#51CF66",
    "hazardous": "#FF922B",
    "e-waste": "#845EF7",
    "metal": "#339AF0",
    "paper": "#FFA94D",
    "glass": "#66D9E8",
    "cigarette": "#868E96",
    "mixed": "#FCC419",
}


def _center_crop_base64(image_base64: str, ratio: float = CROP_RATIO) -> tuple[str, dict]:
    """Center-crop an image to the given ratio and return (new_base64, crop_info).
    crop_info = {offset_x, offset_y, crop_w, crop_h, orig_w, orig_h}
    """
    img_bytes = base64.b64decode(image_base64)
    img = PILImage.open(io.BytesIO(img_bytes))
    orig_w, orig_h = img.size

    crop_w = int(orig_w * ratio)
    crop_h = int(orig_h * ratio)
    offset_x = (orig_w - crop_w) // 2
    offset_y = (orig_h - crop_h) // 2

    cropped = img.crop((offset_x, offset_y, offset_x + crop_w, offset_y + crop_h))

    buf = io.BytesIO()
    cropped.save(buf, format="JPEG", quality=92)
    cropped_b64 = base64.b64encode(buf.getvalue()).decode()

    return cropped_b64, {
        "offset_x": offset_x,
        "offset_y": offset_y,
        "crop_w": crop_w,
        "crop_h": crop_h,
        "orig_w": orig_w,
        "orig_h": orig_h,
    }


# Max dimension for images sent to Roboflow (keeps payload under API limit)
MAX_DIM = 2048


def _resize_if_needed(image_base64: str) -> tuple[str, int, int]:
    """Resize image so longest side ≤ MAX_DIM. Returns (b64, orig_w, orig_h)."""
    img_bytes = base64.b64decode(image_base64)
    img = PILImage.open(io.BytesIO(img_bytes))
    orig_w, orig_h = img.size

    if max(orig_w, orig_h) <= MAX_DIM:
        return image_base64, orig_w, orig_h

    ratio = MAX_DIM / max(orig_w, orig_h)
    new_w = int(orig_w * ratio)
    new_h = int(orig_h * ratio)
    img = img.resize((new_w, new_h), PILImage.LANCZOS)

    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=90)
    return base64.b64encode(buf.getvalue()).decode(), orig_w, orig_h


# ── Roboflow workflow call ───────────────

def _run_workflow_sync(image_base64: str) -> list:
    """Resize → decode → temp file → run workflow → return result."""
    resized_b64, _, _ = _resize_if_needed(image_base64)
    img_bytes = base64.b64decode(resized_b64)
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as f:
            f.write(img_bytes)
            tmp_path = f.name
        result = _client.run_workflow(
            workspace_name=ROBOFLOW_WORKSPACE,
            workflow_id=ROBOFLOW_WORKFLOW_ID,
            images={"image": tmp_path},
            use_cache=True,
        )
        return result
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)


def _extract_predictions(result: list) -> tuple[list[dict], dict]:
    """Extract prediction objects and image metadata from the workflow result.
    Returns (predictions_list, image_info_dict).
    """
    if not result:
        return [], {}

    entry = result[0] if isinstance(result, list) else result
    if not isinstance(entry, dict):
        return [], {}

    image_info = {}

    # Try common output key names from Roboflow workflows
    for key in ["predictions", "model_predictions", "output", "detections", "result"]:
        if key in entry:
            val = entry[key]
            # Could be a dict with a nested "predictions" list + "image" metadata
            if isinstance(val, dict):
                if "image" in val and isinstance(val["image"], dict):
                    image_info = val["image"]
                if "predictions" in val:
                    return val["predictions"], image_info
            if isinstance(val, list):
                return val, image_info

    # Search all values for prediction-like structures
    for key, val in entry.items():
        if isinstance(val, dict) and "predictions" in val:
            if "image" in val and isinstance(val["image"], dict):
                image_info = val["image"]
            preds = val["predictions"]
            if isinstance(preds, list):
                return preds, image_info
        if isinstance(val, list) and len(val) > 0 and isinstance(val[0], dict):
            sample = val[0]
            if any(k in sample for k in ["class", "class_name", "class_id"]):
                return val, image_info

    print(f"[Roboflow] Could not find predictions in workflow result. Keys: {list(entry.keys())}")
    print(f"[Roboflow] Full result: {entry}")
    return [], image_info


async def _call_roboflow(image_base64: str) -> tuple[list[dict], dict]:
    """Run Roboflow workflow in a thread pool and extract predictions.
    Returns (predictions, image_info).
    """
    result = await asyncio.to_thread(_run_workflow_sync, image_base64)
    preds, image_info = _extract_predictions(result)
    print(f"[Roboflow] Extracted {len(preds)} predictions, image_info={image_info}")
    if preds:
        print(f"[Roboflow] Sample: {preds[0]}")
    return preds, image_info


# ── Public API ───────────────────────────

async def analyze_image(image_base64: str) -> dict:
    """Full analysis using Roboflow object detection."""
    try:
        predictions, _ = await _call_roboflow(image_base64)
        count = len(predictions)

        if not predictions:
            return {
                "waste_type": "mixed",
                "severity": "low",
                "confidence": 0.0,
                "action": "No waste detected. If this is wrong, please submit manually.",
            }

        best = max(predictions, key=lambda p: p.get("confidence", 0))
        waste_type = _map_class_to_waste_type(best.get("class", ""))
        confidence = round(best.get("confidence", 0.0), 3)
        severity = _severity_from_count(count)
        action = _action_advice(waste_type, severity)

        return {
            "waste_type": waste_type,
            "severity": severity,
            "confidence": confidence,
            "action": action,
        }

    except Exception as e:
        print(f"[Analyze Error] {e}")
        import traceback; traceback.print_exc()
        return {
            "waste_type": "mixed",
            "severity": "medium",
            "confidence": 0.75,
            "action": "AI analysis unavailable. Requires manual segregation. Do not burn.",
        }


def _is_in_center(pred: dict, img_w: int, img_h: int, ratio: float = CROP_RATIO) -> bool:
    """Return True if the detection center falls within the center `ratio` zone."""
    margin_x = img_w * (1 - ratio) / 2
    margin_y = img_h * (1 - ratio) / 2
    cx = pred.get("x", 0)
    cy = pred.get("y", 0)
    return margin_x <= cx <= img_w - margin_x and margin_y <= cy <= img_h - margin_y


async def detect_objects(image_base64: str) -> dict:
    """Detection: sends full image to Roboflow for max accuracy, then filters
    out detections whose center falls outside the center 90% zone.
    Coordinates are mapped back to the original image space if resized.
    """
    try:
        # Get original dims before any resize happens inside _call_roboflow
        _, orig_w, orig_h = _resize_if_needed(image_base64)

        predictions, image_info = await _call_roboflow(image_base64)

        # Roboflow sees the (possibly resized) image
        robo_w = image_info.get("width", 0)
        robo_h = image_info.get("height", 0)

        # Scale factor to map resized coords back to original space
        sx = orig_w / robo_w if robo_w else 1
        sy = orig_h / robo_h if robo_h else 1

        detections = []
        for p in predictions:
            # Skip edge detections (based on resized image dims)
            if robo_w and robo_h and not _is_in_center(p, robo_w, robo_h, CROP_RATIO):
                continue
            waste_type = _map_class_to_waste_type(p.get("class", ""))
            detections.append({
                "x": p.get("x", 0) * sx,
                "y": p.get("y", 0) * sy,
                "width": p.get("width", 0) * sx,
                "height": p.get("height", 0) * sy,
                "class_name": p.get("class", "unknown"),
                "confidence": round(p.get("confidence", 0), 3),
                "waste_type": waste_type,
                "color": WASTE_COLORS.get(waste_type, "#FCC419"),
            })

        if detections:
            best = max(detections, key=lambda d: d["confidence"])
            primary_type = best["waste_type"]
        else:
            primary_type = "mixed"

        return {
            "detections": detections,
            "summary": {
                "total_count": len(detections),
                "waste_type": primary_type,
                "severity": _severity_from_count(len(detections)),
            },
            "image_width": orig_w,
            "image_height": orig_h,
        }

    except Exception as e:
        print(f"[Roboflow Detect Error] {e}")
        return {
            "detections": [],
            "summary": {
                "total_count": 0,
                "waste_type": "mixed",
                "severity": "low",
            },
            "image_width": 0,
            "image_height": 0,
        }


# ── Cleanup Verification ────────────────

# Cleanup verification tuning
CLEANUP_CONFIDENCE = 0.55   # ignore detections below this confidence
CLEANUP_THRESHOLD = 5       # allow up to this many low-noise detections


async def verify_cleanup(image_base64: str) -> dict:
    """Verify a cleanup by running waste detection on the 'after' photo.
    If very few (or zero) waste items are detected, the cleanup is accepted.
    Returns {verified: bool, waste_detected: int, message: str}.
    """
    try:
        predictions, _ = await _call_roboflow(image_base64)
        # Only count high-confidence detections to avoid false positives on clean areas
        confident = [p for p in predictions if p.get("confidence", 0) >= CLEANUP_CONFIDENCE]
        count = len(confident)
        print(f"[Cleanup] Raw predictions: {len(predictions)}, above {CLEANUP_CONFIDENCE}: {count}")

        if count <= CLEANUP_THRESHOLD:
            return {
                "verified": True,
                "waste_detected": count,
                "message": "Area verified as cleaned! Great job!" if count == 0
                    else f"Only {count} small item(s) remaining — cleanup accepted. Nice work!",
            }
        else:
            return {
                "verified": False,
                "waste_detected": count,
                "message": f"Still {count} waste item(s) detected. Please clean the area more thoroughly and try again.",
            }

    except Exception as e:
        print(f"[Cleanup Verify Error] {e}")
        import traceback; traceback.print_exc()
        return {
            "verified": False,
            "waste_detected": -1,
            "message": "AI verification unavailable. Please try again later.",
        }
