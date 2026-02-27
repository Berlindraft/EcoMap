"""
Waste detection using Roboflow inference API.
Falls back to simulated result if API fails.
"""
import base64
import httpx
from app.core.config import ROBOFLOW_API_KEY


# Roboflow model endpoint (adjust model_id as needed)
ROBOFLOW_MODEL_ID = "waste-detection-zaokv/2"
ROBOFLOW_API_URL = f"https://detect.roboflow.com/{ROBOFLOW_MODEL_ID}"


def _map_class_to_waste_type(class_name: str) -> str:
    """Map Roboflow class names to our waste type enum."""
    cl = class_name.lower()
    if any(k in cl for k in ["plastic", "bottle", "bag"]):
        return "plastic"
    if any(k in cl for k in ["organic", "food", "bio"]):
        return "biodegradable"
    if any(k in cl for k in ["hazard", "chemical", "battery"]):
        return "hazardous"
    if any(k in cl for k in ["electronic", "e-waste", "device"]):
        return "e-waste"
    if any(k in cl for k in ["metal", "can", "aluminum"]):
        return "metal"
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


async def analyze_image(image_base64: str) -> dict:
    """
    Analyze a base64-encoded image for waste detection.
    Returns: { waste_type, severity, confidence, action }
    """
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                ROBOFLOW_API_URL,
                params={"api_key": ROBOFLOW_API_KEY},
                headers={"Content-Type": "application/x-www-form-urlencoded"},
                content=image_base64,
            )
            resp.raise_for_status()
            data = resp.json()

        predictions = data.get("predictions", [])
        if not predictions:
            return {
                "waste_type": "mixed",
                "severity": "low",
                "confidence": 0.0,
                "action": "No waste detected. If this is wrong, please submit manually.",
            }

        # Use the highest-confidence prediction for classification
        best = max(predictions, key=lambda p: p.get("confidence", 0))
        waste_type = _map_class_to_waste_type(best.get("class", ""))
        confidence = round(best.get("confidence", 0.0), 3)
        severity = _severity_from_count(len(predictions))
        action = _action_advice(waste_type, severity)

        return {
            "waste_type": waste_type,
            "severity": severity,
            "confidence": confidence,
            "action": action,
        }

    except Exception as e:
        print(f"[Roboflow Error] {e}")
        # Fallback simulated result
        return {
            "waste_type": "mixed",
            "severity": "medium",
            "confidence": 0.75,
            "action": "AI analysis unavailable. Requires manual segregation. Do not burn.",
        }
