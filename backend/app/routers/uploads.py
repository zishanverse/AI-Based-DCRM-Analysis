from __future__ import annotations

import io
import logging
import os
import uuid
from pathlib import Path

import cloudinary
import cloudinary.uploader
import pandas as pd
from fastapi import APIRouter, File, HTTPException, UploadFile, status

from ..config import settings
from ..models import UploadResponse
from ..services import diagnostics_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/uploads", tags=["uploads"])

CLOUDINARY_CLOUD_NAME = settings.cloudinary_cloud_name
CLOUDINARY_API_KEY = settings.cloudinary_api_key
CLOUDINARY_API_SECRET = settings.cloudinary_api_secret
CLOUDINARY_UPLOAD_FOLDER = settings.cloudinary_upload_folder
MAX_DIAGNOSTIC_ROWS = int(os.getenv("UPLOAD_DIAGNOSTIC_ROW_LIMIT", "50"))

if settings.cloudinary_configured:
    cloudinary.config(
        cloud_name=CLOUDINARY_CLOUD_NAME,
        api_key=CLOUDINARY_API_KEY,
        api_secret=CLOUDINARY_API_SECRET,
        secure=True,
    )
else:
    logger.warning("Cloudinary configuration is incomplete. Upload endpoint will return 500 until configured.")


@router.post("/", response_model=UploadResponse)
async def upload_csv(file: UploadFile = File(...)) -> UploadResponse:
    if not settings.cloudinary_configured:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Cloudinary is not configured")

    filename = file.filename or "upload.csv"
    if not filename.lower().endswith(".csv"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only .csv files are allowed")

    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file is empty")

    try:
        dataframe = pd.read_csv(io.BytesIO(contents))
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid CSV format") from exc

    if dataframe.empty:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="CSV has no data rows")

    try:
        diagnostics_service.ensure_models_ready()
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc

    diagnostics_results: list[dict[str, object]] = []
    limited_dataframe = dataframe.head(MAX_DIAGNOSTIC_ROWS)
    for idx, row in limited_dataframe.iterrows():
        try:
            prediction = diagnostics_service.predict_single(row.to_dict())
        except RuntimeError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

        diagnostics_results.append({"rowIndex": int(idx), **prediction})

    public_id = f"{Path(filename).stem}-{uuid.uuid4().hex[:8]}"

    try:
        result = cloudinary.uploader.upload(
            contents,
            resource_type="raw",
            folder=CLOUDINARY_UPLOAD_FOLDER,
            public_id=public_id,
            overwrite=False,
            format="csv",
        )
    except Exception as exc:  # pragma: no cover - network call
        logger.exception("Cloudinary upload failed: %s", exc)
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Cloudinary upload failed") from exc
    finally:
        await file.close()

    return UploadResponse(
        assetId=result.get("asset_id", ""),
        publicId=result.get("public_id", public_id),
        secureUrl=result.get("secure_url", ""),
        bytes=result.get("bytes", len(contents)),
        format=result.get("format", "csv"),
        diagnostics=diagnostics_results,
        diagnosticsProcessedRows=len(diagnostics_results),
        diagnosticsTotalRows=len(dataframe),
    )
