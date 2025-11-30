from __future__ import annotations

import os

import boto3
from botocore.exceptions import BotoCoreError, ClientError
from fastapi import APIRouter, HTTPException, status

from ..models import PresignUploadRequest, PresignUploadResponse

router = APIRouter(prefix="/api/v1/uploads", tags=["uploads"])

S3_REGION = os.getenv("AWS_REGION", "ap-south-1")
S3_BUCKET = os.getenv("AWS_S3_BUCKET_NAME")
UPLOAD_PREFIX = "teacher/upload/"


def _get_s3_client():
    if not S3_BUCKET:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="AWS bucket not configured")
    try:
        return boto3.client("s3", region_name=S3_REGION)
    except Exception as exc:  # pragma: no cover - boto3 raises many client-specific errors
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc)) from exc


@router.post("/presign", response_model=PresignUploadResponse)
def create_csv_upload_url(payload: PresignUploadRequest) -> PresignUploadResponse:
    if not payload.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only .csv uploads are allowed")

    client = _get_s3_client()
    object_key = f"{UPLOAD_PREFIX}{payload.filename}"

    try:
        signed_url = client.generate_presigned_url(
            "put_object",
            Params={
                "Bucket": S3_BUCKET,
                "Key": object_key,
                "ContentType": payload.contentType,
            },
            ExpiresIn=900,
        )
    except (BotoCoreError, ClientError) as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Failed to create upload URL: {exc}") from exc

    return PresignUploadResponse(uploadUrl=signed_url, key=object_key, bucket=S3_BUCKET)
