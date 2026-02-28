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
    # ===== Capitol Site / Fuente (3) =====
    {"lat": 10.3165, "lng": 123.8864, "image": "trash2.png", "waste_type": "mixed", "severity": "critical", "description": "Garbage overflow near Fuente Circle"},
    {"lat": 10.3172, "lng": 123.8873, "image": "trash3.png", "waste_type": "biodegradable", "severity": "medium", "description": "Food waste near street vendors"},

    {"lat": 10.2922, "lng": 123.8997, "image": "trash6.webp", "waste_type": "biodegradable", "severity": "medium", "description": "Vegetable waste beside wet market"},

    # ===== IT Park / Lahug (3) =====
    {"lat": 10.3289, "lng": 123.9065, "image": "trash7.webp", "waste_type": "plastic", "severity": "high", "description": "Plastic cups near IT Park entrance"},
    {"lat": 10.3296, "lng": 123.9073, "image": "trash1.jpeg", "waste_type": "mixed", "severity": "critical", "description": "Garbage pile near food park"},
    {"lat": 10.3305, "lng": 123.9081, "image": "trash2.png", "waste_type": "biodegradable", "severity": "medium", "description": "Food waste near BPO canteen"},

    # ===== Banilad (3) =====
    {"lat": 10.3524, "lng": 123.9165, "image": "trash3.png", "waste_type": "plastic", "severity": "high", "description": "Plastic waste near Banilad highway"},
    {"lat": 10.3532, "lng": 123.9176, "image": "trash4.webp", "waste_type": "mixed", "severity": "critical", "description": "Illegal dumping near creek"},
    {"lat": 10.3541, "lng": 123.9187, "image": "trash5.webp", "waste_type": "biodegradable", "severity": "medium", "description": "Food waste near residences"},

    # ===== Talamban (3) =====
    {"lat": 10.3685, "lng": 123.9148, "image": "trash6.webp", "waste_type": "plastic", "severity": "high", "description": "Plastic waste near Talamban road"},
    {"lat": 10.3694, "lng": 123.9161, "image": "trash7.webp", "waste_type": "mixed", "severity": "critical", "description": "Garbage pile near school"},
    {"lat": 10.3702, "lng": 123.9173, "image": "trash1.jpeg", "waste_type": "biodegradable", "severity": "medium", "description": "Food waste near food stalls"},

    # ===== Mabolo / SM (3) =====
    {"lat": 10.3104, "lng": 123.9188, "image": "trash2.png", "waste_type": "plastic", "severity": "high", "description": "Plastic trash near SM City Cebu"},
    {"lat": 10.3113, "lng": 123.9198, "image": "trash3.png", "waste_type": "mixed", "severity": "critical", "description": "Garbage pile near terminal"},
    {"lat": 10.3122, "lng": 123.9207, "image": "trash4.webp", "waste_type": "biodegradable", "severity": "medium", "description": "Food waste near mall vendors"},

    # ===== SRP (3) =====
    {"lat": 10.2815, "lng": 123.8705, "image": "trash5.webp", "waste_type": "plastic", "severity": "high", "description": "Plastic waste near SRP road"},
    {"lat": 10.2825, "lng": 123.8720, "image": "trash6.webp", "waste_type": "mixed", "severity": "critical", "description": "Dumped garbage near seawall"},
    {"lat": 10.2836, "lng": 123.8735, "image": "trash7.webp", "waste_type": "biodegradable", "severity": "medium", "description": "Food waste near fishing area"},

    # ===== Guadalupe (3) =====
    {"lat": 10.3095, "lng": 123.8908, "image": "trash1.jpeg", "waste_type": "plastic", "severity": "high", "description": "Plastic waste near Guadalupe road"},
    {"lat": 10.3107, "lng": 123.8919, "image": "trash2.png", "waste_type": "mixed", "severity": "critical", "description": "Garbage pile near residential area"},
    {"lat": 10.3116, "lng": 123.8928, "image": "trash3.png", "waste_type": "biodegradable", "severity": "medium", "description": "Food waste near local market"},

    # ===== Other Cities & Provinces (26) =====
    {"lat": 10.3463, "lng": 123.9422, "image": "trash4.webp", "waste_type": "plastic", "severity": "high", "description": "Plastic waste in Mandaue"},
    {"lat": 10.3451, "lng": 123.9409, "image": "trash5.webp", "waste_type": "mixed", "severity": "critical", "description": "Illegal dump in Mandaue"},
    {"lat": 10.3440, "lng": 123.9396, "image": "trash6.webp", "waste_type": "biodegradable", "severity": "medium", "description": "Food waste in Mandaue"},

    {"lat": 10.3097, "lng": 123.9495, "image": "trash7.webp", "waste_type": "plastic", "severity": "high", "description": "Plastic waste in Lapu-Lapu"},
    {"lat": 10.3084, "lng": 123.9481, "image": "trash1.jpeg", "waste_type": "mixed", "severity": "critical", "description": "Dumped garbage in Lapu-Lapu"},

    {"lat": 10.2722, "lng": 123.8475, "image": "trash2.png", "waste_type": "plastic", "severity": "high", "description": "Plastic waste near Talisay"},
    {"lat": 10.2711, "lng": 123.8460, "image": "trash3.png", "waste_type": "mixed", "severity": "critical", "description": "Garbage pile near Talisay"},

    {"lat": 10.2614, "lng": 123.8423, "image": "trash4.webp", "waste_type": "plastic", "severity": "high", "description": "Plastic waste near Minglanilla"},
    {"lat": 10.2626, "lng": 123.8436, "image": "trash5.webp", "waste_type": "mixed", "severity": "critical", "description": "Illegal dump in Minglanilla"},

    {"lat": 10.3782, "lng": 123.9571, "image": "trash6.webp", "waste_type": "plastic", "severity": "high", "description": "Plastic waste near Consolacion"},
    {"lat": 10.3794, "lng": 123.9585, "image": "trash7.webp", "waste_type": "mixed", "severity": "critical", "description": "Dumped garbage near Consolacion"},

    {"lat": 10.3999, "lng": 123.9992, "image": "trash1.jpeg", "waste_type": "plastic", "severity": "high", "description": "Plastic waste near Liloan"},
    {"lat": 10.4011, "lng": 124.0006, "image": "trash2.png", "waste_type": "mixed", "severity": "critical", "description": "Illegal dump in Liloan"},

    {"lat": 10.2532, "lng": 123.7710, "image": "trash3.png", "waste_type": "plastic", "severity": "high", "description": "Plastic waste near Naga"},
    {"lat": 10.1067, "lng": 123.6404, "image": "trash4.webp", "waste_type": "mixed", "severity": "critical", "description": "Dumped garbage in Carcar"},

    {"lat": 10.5267, "lng": 124.0276, "image": "trash5.webp", "waste_type": "plastic", "severity": "high", "description": "Plastic waste near Danao"},
    {"lat": 10.3800, "lng": 123.6332, "image": "trash6.webp", "waste_type": "mixed", "severity": "critical", "description": "Illegal dumping in Toledo"},

    {"lat": 10.4943, "lng": 123.7090, "image": "trash7.webp", "waste_type": "plastic", "severity": "high", "description": "Plastic waste near Balamban"},
    {"lat": 10.3303, "lng": 124.0089, "image": "trash1.jpeg", "waste_type": "mixed", "severity": "critical", "description": "Garbage pile in Compostela"},
    {"lat": 10.2001, "lng": 123.7583, "image": "trash2.png", "waste_type": "plastic", "severity": "high", "description": "Plastic waste near San Fernando"},
    {"lat": 10.1435, "lng": 123.7656, "image": "trash3.png", "waste_type": "mixed", "severity": "critical", "description": "Illegal dumping in Sibonga"},
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
