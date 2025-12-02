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

### Supabase configuration

1. Create (or use an existing) Supabase project and apply the SQL in `schema.sql` to provision the `stations` table along with the rest of the backend tables:

  ```powershell
  psql "$env:SUPABASE_DB_CONNECTION" -f schema.sql
  ```

  > Replace `SUPABASE_DB_CONNECTION` with the full Postgres connection string that Supabase exposes under **Project Settings → Database → Connection string**. Alternatively, run the SQL directly from the Supabase SQL editor.

2. Add these variables to `backend/.env` (or export them in your shell):

  ```dotenv
  SUPABASE_URL=your-project-url
  SUPABASE_SERVICE_ROLE_KEY=service-role-key
  SUPABASE_STATIONS_TABLE=stations # optional, defaults to "stations"
  SUPABASE_DEFAULT_STATION_ROLE=engineer # optional fallback when the row has no role column
  SUPABASE_HEATMAP_TABLE=heatmap_points # optional, defaults to "heatmap_points"
  ADVANCED_MODEL_DIR="new models" # optional, folder containing the improved ML artifacts
  ```

  The service-role key is required so the API can read hashed passwords from the `stations` table while bypassing row-level security. Use the anon key only if you have RLS policies that explicitly allow the necessary reads.

  ### Seeding heatmap data

  Run the provided script to push the previously hard-coded heatmap coordinates into Supabase:

  ```powershell
  cd backend
  python -m app.scripts.seed_heatmap
  ```

  The script inserts 21 sample stations into the `heatmap_points` table (or the table defined via `SUPABASE_HEATMAP_TABLE`). Run it once on a clean table, or truncate the existing rows before re-running to avoid duplicates.

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

The authentication routes now validate station credentials against the Supabase `stations` table. Store bcrypt hashes in the `password_hash` column (plain text is temporarily supported to ease migrations, but should be avoided).

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

## Advanced model endpoints

The improved XGBoost/AdaBoost/Autoencoder bundle under `ADVANCED_MODEL_DIR` now exposes richer APIs that stay independent of the legacy DCRM models:

- `GET /api/v1/new-models/status` &rarr; reports the artifact directory, detected model files (size/kind/timestamp), available label classes, and which model runtimes are ready.
- `GET /api/v1/new-models/features` &rarr; surfaces the normalized feature list shared by the scaler together with available model names and class labels.
- `POST /api/v1/new-models/predict` &rarr; accepts a single JSON row and returns an envelope describing when the request was made, which models ran, and the per-model outputs.
- `POST /api/v1/new-models/batch` &rarr; processes an array of rows and returns the same detailed envelope with `rowCount` plus the list of advanced diagnostic results.

Populate `ADVANCED_MODEL_DIR` with the artifacts generated by `train_model.py` (scaler/encoder `.pkl` files, `xgboost_model.pkl`, `adaboost_model.pkl`, `autoencoder_model.keras`, and `ae_threshold.pkl`). When these files are present, `/api/v1/uploads` automatically appends an `advancedDiagnostics` array so the chat assistant can report each model's outcome separately after a CSV upload.

## Heatmap endpoint

- `GET /api/v1/heatmap/points?limit=256`

Fetches up to `limit` rows from the Supabase `heatmap_points` table (newest first) and converts them into the `[lat, lon, intensity]` triples expected by the Leaflet heat layer. The payload contains:

```json
{
  "points": [
    {
      "lat": 19.076,
      "lon": 72.8777,
      "intensity": 975.0,
      "severity": 0.97,
      "status": "fault",
      "deviceId": "MUM-4512",
      "timestamp": "2025-12-02T07:31:05.123Z",
      "healthScore": 12.5
    }
  ],
  "total": 1,
  "generatedAt": "2025-12-02T08:00:00.000Z"
}
```

`intensity` is scaled from the stored `severity` (or derived from `health_score`) to roughly match the magnitude previously hard-coded in the frontend. Update the heatmap UI to consume this endpoint instead of the static array.

## Placeholder routes

Router modules for devices, uploads, waveforms, analyses, simulate, and reports are wired up but (aside from uploads) currently return stubbed data. They are ready to be fleshed out when additional requirements land.
