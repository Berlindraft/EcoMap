"""
Seed script – creates rewards in Firestore so redemption deducts points properly.
Run:  python seed_rewards.py
"""
import firebase_admin
from firebase_admin import credentials, firestore

# Reuse existing app or initialize
if not firebase_admin._apps:
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred)

db = firestore.client()

# Admin UID — default rewards are "by" the admin
ADMIN_UID = "5Fv2YsAf10cU6qS54U1zsyy5hCJ3"

REWARDS = [
    {
        "reward_id": "fb1",
        "name": "Eco Bag",
        "description": "Reusable shopping bag",
        "points_required": 50,
        "stock": 100,
        "icon": "🛍️",
        "partner_name": "EcoMap",
        "partner_id": ADMIN_UID,
    },
    {
        "reward_id": "fb2",
        "name": "Reusable Bottle",
        "description": "BPA-free water bottle",
        "points_required": 100,
        "stock": 50,
        "icon": "🥤",
        "partner_name": "EcoMap",
        "partner_id": ADMIN_UID,
    },
    {
        "reward_id": "fb3",
        "name": "Plant Seed Pack",
        "description": "Grow your own herbs",
        "points_required": 75,
        "stock": 200,
        "icon": "🌱",
        "partner_name": "EcoMap",
        "partner_id": ADMIN_UID,
    },
    {
        "reward_id": "fb4",
        "name": "Sticker Pack",
        "description": "EcoMap stickers",
        "points_required": 20,
        "stock": 500,
        "icon": "📦",
        "partner_name": "EcoMap",
        "partner_id": ADMIN_UID,
    },
]


def main():
    for r in REWARDS:
        doc_id = r["reward_id"]
        db.collection("rewards").document(doc_id).set(r, merge=True)
        print(f"  ✔  {r['name']} ({doc_id}) — {r['points_required']} pts, stock {r['stock']}")

    print(f"\nSeeded {len(REWARDS)} rewards into Firestore.")


if __name__ == "__main__":
    main()
