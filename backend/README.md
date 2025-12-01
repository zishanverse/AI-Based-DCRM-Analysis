# DCRM Monitor Backend

Lightweight FastAPI backend that powers authentication for the DCRM Monitor Next.js frontend. Data lives entirely in memory so every server restart starts from a clean slate.

## Requirements

- Python 3.11+
- (Optional) virtual environment such as `venv` or `conda`
- Pre-trained diagnostic artifacts placed under `dcrm_models/` (configurable via `DCRM_MODEL_DIR`)

## Setup

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
```

## Running locally

```powershell
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The server enables CORS for `http://localhost`, `http://localhost:3000`, and `http://localhost:5173`, so the Next.js frontend can call it without extra configuration.

> **Production note:** For deployment place the app behind HTTPS (FastAPI + uvicorn typically sits behind a reverse proxy such as Nginx or Azure Front Door).

### Cloudinary prerequisites for uploads

CSV uploads flow through Cloudinary. Create a `.env` file (you can copy `.env.example`) and populate either the single connection string or the individual variables before running the server:

```
# Preferred one-line format
CLOUDINARY_URL=cloudinary://your-api-key:your-api-secret@your-cloud-name

# Optional overrides (used if CLOUDINARY_URL is absent or missing a field)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-secret
# optional (defaults to dcrm/csv)
CLOUDINARY_UPLOAD_FOLDER=dcrm/csv
```

> Alternatively, export the same variables in your shell if you prefer not to use a `.env` file.

Optional tuning:

```
# Max rows evaluated per upload (defaults to 50)
UPLOAD_DIAGNOSTIC_ROW_LIMIT=50
```
```

### Diagnostic model configuration

The ML endpoints read these environment variables (defaults shown):

```powershell
$env:DCRM_MODEL_DIR = "dcrm_models"
```

The folder must contain `xgb_dcrm_model.pkl`, `adaboost_dcrm_model.pkl`, `feature_names.pkl`, and `label_map.json` exactly as produced by your training pipeline.

## Auth endpoints

### `POST /api/v1/auth/login`
Body:
```json
{
  "station_id": "STN-0001",
  "password": "pass123"
}
```
Response:
```json
{
  "accessToken": "<token>",
  "user": {
    "id": "STN-0001",
    "name": "Station One",
    "role": "engineer"
  }
}
```
An HttpOnly `refresh_token` cookie is also set for issuing fresh access tokens.

### `GET /api/v1/auth/me`
Requires header `Authorization: Bearer <accessToken>` and returns the user profile.

### `POST /api/v1/auth/refresh`
Reads the `refresh_token` cookie and returns a new access token without touching credentials.

## Upload endpoint

`POST /api/v1/uploads` accepts `multipart/form-data` with a `file` field (CSV), streams it to Cloudinary, and simultaneously feeds the CSV rows (up to `UPLOAD_DIAGNOSTIC_ROW_LIMIT`, default 50) into the diagnostic models. The JSON response includes the Cloudinary asset identifiers plus a `diagnostics` array describing the per-row predictions (diagnosis, confidence, secondary diagnosis, and probability distribution) along with counters showing how many rows were processed. This allows the frontend to display model output immediately after the upload completes without making a second API call.

## Diagnostic endpoints

- `GET /api/v1/diagnostics/features` &rarr; `{ "features": [...] }`
- `POST /api/v1/diagnostics/predict` consumes a JSON map of `featureName: value` pairs and returns:

```json
{
  "diagnosis": "Healthy",
  "confidence": 97.1,
  "secondary_diagnosis": "Contact wear",
  "probabilities": {
    "Healthy": 97.1,
    "Contact wear": 2.3
  },
  "status": "Healthy"
}
```

## Placeholder routes

Router modules for devices, uploads, waveforms, analyses, simulate, and reports are wired up but (aside from uploads) currently return stubbed data. They are ready to be fleshed out when additional requirements land.
