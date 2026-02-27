"""
Cloudinary image upload service.
"""
import cloudinary.uploader
from app.core.config import cloudinary  # noqa – ensures cloudinary is configured


def upload_image(file_bytes: bytes, folder: str = "ecomap_reports") -> str:
    """Upload image bytes to Cloudinary and return the secure URL."""
    result = cloudinary.uploader.upload(
        file_bytes,
        folder=folder,
        resource_type="image",
    )
    return result.get("secure_url", "")
