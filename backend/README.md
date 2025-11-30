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

### AWS prerequisites for uploads

CSV upload URLs require the following environment variables to be set before starting uvicorn:

```powershell
$env:AWS_ACCESS_KEY_ID = "..."
$env:AWS_SECRET_ACCESS_KEY = "..."
$env:AWS_S3_BUCKET_NAME = "my-bucket"
# optional (defaults to ap-south-1)
$env:AWS_REGION = "ap-south-1"
```

Credentials must belong to an IAM principal with `s3:PutObject` permissions on the chosen bucket.

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

`POST /api/v1/uploads/presign` accepts `{ "filename": "data.csv", "contentType": "text/csv" }` and returns a time-limited presigned URL for directly PUT-ing the CSV to S3 under `teacher/upload/<filename>`.

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

Router modules for devices, uploads, waveforms, analyses, simulate, and reports are wired up but currently return stubbed data. They are ready to be fleshed out when additional requirements land.
