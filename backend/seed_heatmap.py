"""
Seed script – creates 6 waste reports at specific coordinates with sample images.
Run:  python seed_heatmap.py
Requires the backend to be running on localhost:8000.
"""
import httpx
import os
import base64

API = "http://localhost:8000/api"
SAMPLES_DIR = os.path.join(os.path.dirname(__file__), "..", "samples")

# Coordinates + image file pairs
REPORTS = [
    {
        "lat": 10.364744, "lng": 123.636080,
        "image": "trash1.jpeg",
        "waste_type": "plastic",
        "severity": "high",
        "description": "Scattered plastic waste along the roadside",
    },
    {
        "lat": 10.364948, "lng": 123.636024,
        "image": "trash2.png",
        "waste_type": "mixed",
        "severity": "critical",
        "description": "Large pile of mixed waste near drainage",
    },
    {
        "lat": 10.365135, "lng": 123.636021,
        "image": "trash3.png",
        "waste_type": "biodegradable",
        "severity": "medium",
        "description": "Food waste and organic debris on the curb",
    },
    {
        "lat": 10.365559, "lng": 123.636092,
        "image": "trash1.jpeg",
        "waste_type": "plastic",
        "severity": "high",
        "description": "Plastic bags and bottles dumped on sidewalk",
    },
    {
        "lat": 10.365705, "lng": 123.636235,
        "image": "trash2.png",
        "waste_type": "hazardous",
        "severity": "critical",
        "description": "Hazardous waste containers left near creek",
    },
    {
        "lat": 10.365932, "lng": 123.636402,
        "image": "trash3.png",
        "waste_type": "metal",
        "severity": "medium",
        "description": "Metal scraps and cans scattered along the road",
    },
]

SEED_USER_ID = "seed_heatmap_user"


def upload_image(filepath: str) -> str:
    """Upload an image file via the backend upload endpoint."""
    filename = os.path.basename(filepath)
    ext = filename.rsplit(".", 1)[-1].lower()
    mime = "image/jpeg" if ext in ("jpg", "jpeg") else "image/png"

    with open(filepath, "rb") as f:
        files = {"file": (filename, f, mime)}
        r = httpx.post(f"{API}/upload/image", files=files, timeout=30)
        r.raise_for_status()
        return r.json()["url"]


def seed():
    # Ensure the seed user exists
    try:
        httpx.post(f"{API}/auth/register", json={
            "uid": SEED_USER_ID,
            "full_name": "Heatmap Seeder",
            "email": "heatmap@ecomap.ph",
        }, timeout=10)
    except Exception:
        pass

    created = 0
    for i, entry in enumerate(REPORTS):
        img_path = os.path.join(SAMPLES_DIR, entry["image"])
        if not os.path.exists(img_path):
            print(f"  ✗ Image not found: {img_path}")
            continue

        # Upload image to Cloudinary
        print(f"  Uploading {entry['image']}...")
        try:
            image_url = upload_image(img_path)
            print(f"    → {image_url}")
        except Exception as e:
            print(f"  ✗ Upload failed: {e}")
            image_url = ""

        # Create report
        report = {
            "user_id": SEED_USER_ID,
            "image_url": image_url,
            "geo_lat": entry["lat"],
            "geo_lng": entry["lng"],
            "waste_type": entry["waste_type"],
            "severity": entry["severity"],
            "ai_confidence": 0.85,
            "description": entry["description"],
        }
        try:
            r = httpx.post(f"{API}/reports", json=report, timeout=10)
            if r.status_code == 200:
                created += 1
                print(f"  ✓ Report #{created}: {entry['waste_type']} @ ({entry['lat']}, {entry['lng']})")
            else:
                print(f"  ✗ Failed: {r.status_code} {r.text[:120]}")
        except Exception as e:
            print(f"  ✗ Error: {e}")

    print(f"\nDone! Created {created} / {len(REPORTS)} reports.")


if __name__ == "__main__":
    seed()
