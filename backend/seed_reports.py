"""
Seed script – creates realistic mock waste reports along Cebu City streets.
Run:  python seed_reports.py
Requires the backend to be running on localhost:8000.
"""
import httpx, random, time

API = "http://localhost:8000/api"

# ── Cebu City center & surrounding streets ──
# Each cluster is (center_lat, center_lng, label)
CLUSTERS = [
    # Colon Street / Downtown
    (10.2969, 123.8997, "Colon St"),
    (10.2980, 123.8985, "Colon-Osmena"),
    # Carbon Market area
    (10.2935, 123.8990, "Carbon Market"),
    (10.2942, 123.9005, "Carbon East"),
    # Fuente Osmena Circle
    (10.3105, 123.8917, "Fuente Circle"),
    (10.3112, 123.8930, "Fuente Boulevard"),
    # IT Park / Lahug
    (10.3272, 123.9058, "IT Park"),
    (10.3265, 123.9045, "IT Park West"),
    # Mango Avenue
    (10.3088, 123.8935, "Mango Ave North"),
    (10.3055, 123.8948, "Mango Ave South"),
    # SM City Cebu area
    (10.3120, 123.9185, "SM City Cebu"),
    (10.3135, 123.9170, "SM North Reclamation"),
    # Ayala Center
    (10.3187, 123.9054, "Ayala Center"),
    (10.3195, 123.9068, "Cebu Business Park"),
    # SRP (South Road Properties)
    (10.2850, 123.8920, "SRP Area"),
    (10.2870, 123.8935, "SRP Coastal"),
    # Talamban / USC area
    (10.3505, 123.9112, "Talamban"),
    (10.3490, 123.9098, "USC Main"),
    # Guadalupe / JY Square
    (10.3220, 123.9005, "Guadalupe"),
    (10.3235, 123.8988, "JY Square"),
]

WASTE_TYPES = ["plastic", "biodegradable", "hazardous", "metal", "e-waste", "mixed", "paper", "glass"]
SEVERITIES  = ["low", "medium", "high", "critical"]
SEV_WEIGHTS = [0.25, 0.35, 0.25, 0.15]

DESCRIPTIONS = [
    "Pile of plastic bags near drainage",
    "Food waste beside road",
    "Old electronics dumped on sidewalk",
    "Scattered bottles and cans",
    "Construction debris blocking pathway",
    "Household trash left on curb",
    "Waste bin overflowing",
    "Illegal dumping site along creek",
    "Plastic containers near mangroves",
    "Medical waste found near barangay hall",
    "Rubber tires stacked on empty lot",
    "Styrofoam packaging on the street",
    "Oil containers near storm drain",
    "Broken glass near pedestrian lane",
    "Mixed waste pile under bridge",
]

# A dummy user ID to associate the reports with
SEED_USER_ID = "seed_demo_user"


def jitter(center: float, meters: float = 100) -> float:
    """Add random offset in degrees (~1 degree ≈ 111km)."""
    offset_deg = meters / 111_000
    return center + random.uniform(-offset_deg, offset_deg)


def seed():
    # Ensure the seed user exists
    try:
        httpx.post(f"{API}/auth/register", json={
            "uid": SEED_USER_ID,
            "full_name": "EcoMap Demo",
            "email": "demo@ecomap.ph",
        }, timeout=10)
    except Exception:
        pass

    created = 0
    for lat, lng, label in CLUSTERS:
        # 2-4 reports per cluster
        count = random.randint(2, 4)
        for _ in range(count):
            report = {
                "user_id": SEED_USER_ID,
                "image_url": "",
                "geo_lat": round(jitter(lat, 80), 6),
                "geo_lng": round(jitter(lng, 80), 6),
                "waste_type": random.choice(WASTE_TYPES),
                "severity": random.choices(SEVERITIES, weights=SEV_WEIGHTS, k=1)[0],
                "ai_confidence": round(random.uniform(0.55, 0.98), 2),
                "description": f"{random.choice(DESCRIPTIONS)} ({label})",
            }
            try:
                r = httpx.post(f"{API}/reports", json=report, timeout=10)
                if r.status_code == 200:
                    created += 1
                    print(f"  ✓ Report #{created} at {label}  ({report['waste_type']}, {report['severity']})")
                else:
                    print(f"  ✗ Failed: {r.status_code} {r.text[:80]}")
            except Exception as e:
                print(f"  ✗ Error: {e}")

    print(f"\nDone! Created {created} reports across {len(CLUSTERS)} clusters in Cebu City.")


if __name__ == "__main__":
    seed()
