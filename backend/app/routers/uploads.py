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
from ..models import UploadResponse, WaveformPoint, WaveformPreview
from ..services import advanced_models_service, diagnostics_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/uploads", tags=["uploads"])

CLOUDINARY_CLOUD_NAME = settings.cloudinary_cloud_name
CLOUDINARY_API_KEY = settings.cloudinary_api_key
CLOUDINARY_API_SECRET = settings.cloudinary_api_secret
CLOUDINARY_UPLOAD_FOLDER = settings.cloudinary_upload_folder
MAX_DIAGNOSTIC_ROWS = int(os.getenv("UPLOAD_DIAGNOSTIC_ROW_LIMIT", "50"))
MAX_WAVEFORM_POINTS = 600
MAX_WAVEFORM_SERIES = 8
# Column alias definitions to align incoming CSV headers with expected telemetry fields
_COLUMN_ALIASES = {
    "timeMs": [
        "time_ms",
        "time",
        "timestamp",
        "milliseconds",
        "ms",
        "t",
    ],
}


def _normalize_column(name: str) -> str:
    return (
        name.strip()
        .lower()
        .replace(" ", "")
        .replace("-", "")
        .replace("/", "")
        .replace("\\", "")
        .replace("(", "")
        .replace(")", "")
        .replace("_", "")
    )


def _slugify_column(name: str) -> str:
    normalized = _normalize_column(name)
    return normalized or "value"


def _match_column(df: pd.DataFrame, aliases: list[str]) -> str | None:
    normalized_aliases = {_normalize_column(alias) for alias in aliases}
    for column in df.columns:
        if _normalize_column(column) in normalized_aliases:
            return column
    return None


def _coerce_numeric(series_value: object) -> float | None:
    if series_value is None or (isinstance(series_value, float) and pd.isna(series_value)):
        return None
    if isinstance(series_value, (int, float)):
        return float(series_value)
    if isinstance(series_value, str):
        cleaned = series_value.replace(",", "").strip()
        if not cleaned:
            return None
        try:
            return float(cleaned)
        except ValueError:
            return None
    return None


def _extract_waveform_preview(df: pd.DataFrame) -> WaveformPreview | None:
    subset = df.iloc[:MAX_WAVEFORM_POINTS].copy()
    time_column = _match_column(subset, _COLUMN_ALIASES["timeMs"])
    if time_column:
        time_series = pd.to_numeric(subset[time_column], errors="coerce")
    else:
        # Fallback: synthesize a time axis when CSV lacks explicit timestamps
        time_series = pd.Series(
            data=range(len(subset)),
            index=subset.index,
            dtype=float,
        )

    numeric_columns: list[tuple[str, pd.Series]] = []
    for column in df.columns:
        if column == time_column:
            continue
        numeric_series = pd.to_numeric(df[column], errors="coerce")
        if numeric_series.notna().sum() == 0:
            continue
        numeric_columns.append((column, numeric_series))

    if not numeric_columns:
        return None

    column_map: dict[str, str] = {}
    ordered_columns: list[str] = []
    for original, _ in numeric_columns:
        slug = _slugify_column(original)
        candidate = slug
        suffix = 1
        while candidate in column_map:
            suffix += 1
            candidate = f"{slug}{suffix}"
        column_map[candidate] = original
        ordered_columns.append(candidate)
        if len(ordered_columns) >= MAX_WAVEFORM_SERIES:
            break

    points: list[WaveformPoint] = []
    for idx, row in subset.iterrows():
        raw_time = time_series.at[idx]
        time_value = _coerce_numeric(raw_time)
        if time_value is None:
            continue

        values: dict[str, float | None] = {}
        for slug in ordered_columns:
            original = column_map[slug]
            values[slug] = _coerce_numeric(row.get(original))

        points.append(
            WaveformPoint(
                timeMs=float(time_value),
                values=values,
            )
        )

    if not points:
        return None

    return WaveformPreview(
        rowCount=len(points),
        sourceName=time_column or "row_index",
        valueColumns=ordered_columns,
        columnMap=column_map or None,
        points=points,
    )

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

    advanced_models_ready = True
    try:
        advanced_models_service.ensure_advanced_models_ready()
    except RuntimeError as exc:
        advanced_models_ready = False
        logger.warning("Advanced model artifacts unavailable: %s", exc)

    diagnostics_results: list[dict[str, object]] = []
    advanced_results: list[dict[str, object]] = []
    limited_dataframe = dataframe.head(MAX_DIAGNOSTIC_ROWS)
    waveform_preview = _extract_waveform_preview(dataframe)
    for idx, row in limited_dataframe.iterrows():
        try:
            prediction = diagnostics_service.predict_single(row.to_dict())
        except RuntimeError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

        diagnostics_results.append({"rowIndex": int(idx), **prediction})

        if advanced_models_ready:
            try:
                advanced_prediction = advanced_models_service.predict_row(row.to_dict())
                advanced_results.append({"rowIndex": int(idx), **advanced_prediction})
            except RuntimeError as exc:  # pragma: no cover - row specific issues
                logger.warning("Advanced model prediction failed for row %s: %s", idx, exc)

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
        advancedDiagnostics=advanced_results or None,
        waveformPreview=waveform_preview,
    )
