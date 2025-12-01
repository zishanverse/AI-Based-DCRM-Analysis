from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path
from urllib.parse import urlparse

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
ENV_PATH = BASE_DIR / ".env"

if ENV_PATH.exists():
    load_dotenv(ENV_PATH)


@dataclass
class Settings:
    cloudinary_url: str | None = field(default_factory=lambda: os.getenv("CLOUDINARY_URL"))
    cloudinary_cloud_name: str | None = field(default_factory=lambda: os.getenv("CLOUDINARY_CLOUD_NAME"))
    cloudinary_api_key: str | None = field(default_factory=lambda: os.getenv("CLOUDINARY_API_KEY"))
    cloudinary_api_secret: str | None = field(default_factory=lambda: os.getenv("CLOUDINARY_API_SECRET"))
    cloudinary_upload_folder: str = field(default_factory=lambda: os.getenv("CLOUDINARY_UPLOAD_FOLDER", "dcrm/csv"))

    def __post_init__(self) -> None:
        if self.cloudinary_url:
            self._hydrate_from_url(self.cloudinary_url)

    def _hydrate_from_url(self, url: str) -> None:
        parsed = urlparse(url)
        if parsed.scheme != "cloudinary":
            return

        self.cloudinary_cloud_name = self.cloudinary_cloud_name or parsed.hostname
        self.cloudinary_api_key = self.cloudinary_api_key or parsed.username
        self.cloudinary_api_secret = self.cloudinary_api_secret or parsed.password

    @property
    def cloudinary_configured(self) -> bool:
        return bool(
            self.cloudinary_cloud_name
            and self.cloudinary_api_key
            and self.cloudinary_api_secret
        )


settings = Settings()
