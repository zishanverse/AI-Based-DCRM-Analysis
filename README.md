<div align="center">

# DCRM Condition Monitor

Digital Contact Resistance Monitoring platform with a Next.js front-end and FastAPI back-end that lets utilities upload breaker waveforms, visualize KPIs, and run on-demand ML diagnostics.

</div>

## Table of contents

1. [Architecture](#architecture)
2. [Key Features](#key-features)
3. [Frontend (Next.js) Setup](#frontend-nextjs-setup)
4. [Backend (FastAPI) Setup](#backend-fastapi-setup)
5. [Environment Variables](#environment-variables)
6. [Typical Workflow](#typical-workflow)
7. [Diagnostics Endpoints](#diagnostics-endpoints)
8. [Available Scripts](#available-scripts)
9. [Project Structure](#project-structure)

## Architecture

- **Frontend**: Next.js 14 App Router with Tailwind, shadcn/ui components, and client-side charts for dashboarding.
- **Backend**: FastAPI service exposing authentication, device metadata, CSV uploads, and ML prediction endpoints.
- **ML models**: Gradient boosted (XGBoost) + AdaBoost models trained offline under `backend/dcrm_models/`.
- **Storage**: CSV waveforms upload to Cloudinary (raw asset type). Diagnostic results are returned immediately to the client.

```
Next.js UI  ─┐            ┌─>  FastAPI routers (auth, diagnostics, uploads, ...)
			 ├─ REST ---> │    ├─ Cloudinary (raw CSV assets)
Chat + CSV ─┘            └─>  │    └─ ML inference (joblib models)
```

## Key Features

- **DCRM Dashboard**: Overview cards, overall score, model visualizations, and hero/header sections tailored to maintenance crews.
- **Conversational Assistant**: Chat UI for questions plus CSV attachment button so operators can drop fresh waveform exports directly into the advisor.
- **One-click Diagnostics**: Both manual model sweeps ("Run Model" button) and automatic inference after CSV upload. Predictions include primary label, confidence, secondary label, and class probabilities.
- **Cloud-Backed Imports**: CSVs stream to Cloudinary and return secure URLs so the same file can be referenced later in reports.
- **Configurable Limits**: `UPLOAD_DIAGNOSTIC_ROW_LIMIT` caps the number of rows scored per file to keep requests responsive.

## Frontend (Next.js) Setup

```powershell
cd frontend/company-assigmnet
pnpm install
pnpm dev        # starts on http://localhost:3000
```

The frontend expects `NEXT_PUBLIC_API_BASE_URL` (defaults to `http://localhost:8000`). Update it in `.env.local` if the API runs elsewhere.

## Backend (FastAPI) Setup

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env   # fill in credentials
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### ML Artifacts

Place `xgb_dcrm_model.pkl`, `adaboost_dcrm_model.pkl`, `feature_names.pkl`, and `label_map.json` under `backend/dcrm_models/`. Set `DCRM_MODEL_DIR` if you change the folder.

## Environment Variables

| Location | Variable | Description |
|----------|----------|-------------|
| Frontend | `NEXT_PUBLIC_API_BASE_URL` | Base URL of the FastAPI service |
| Backend  | `CLOUDINARY_URL` | Preferred Cloudinary connection string (`cloudinary://key:secret@cloud`) |
| Backend  | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Explicit overrides if you cannot use `CLOUDINARY_URL` |
| Backend  | `CLOUDINARY_UPLOAD_FOLDER` | Folder for raw CSV assets (default `dcrm/csv`) |
| Backend  | `UPLOAD_DIAGNOSTIC_ROW_LIMIT` | Rows scored per upload (default `50`) |
| Backend  | `DCRM_MODEL_DIR` | Path to ML artifacts (default `dcrm_models`) |

## Typical Workflow

1. **Operator uploads CSV** via the chat paperclip.
2. Frontend calls `POST /api/v1/uploads` with multipart form data.
3. Backend validates CSV, runs the ML models row-by-row (respecting `UPLOAD_DIAGNOSTIC_ROW_LIMIT`), then streams the file to Cloudinary.
4. Response returns Cloudinary metadata plus a `diagnostics` array (one entry per processed row) that the chat surfaces as a summary message.
5. Operator can also trigger `GET /api/v1/diagnostics/features` + `POST /api/v1/diagnostics/predict` for ad-hoc what-if analyses.

## Diagnostics Endpoints

### `POST /api/v1/diagnostics/predict`

- Accepts a JSON object where each key is one of the model feature names (see `GET /api/v1/diagnostics/features`).
- The payload is converted into a pandas row and passed to both trained models stored under `backend/dcrm_models/`:
	- **XGBoost (`xgb_dcrm_model.pkl`)** → primary `diagnosis`, `confidence`, `probabilities`, and derived `status`.
	- **AdaBoost (`adaboost_dcrm_model.pkl`)** → `secondary_diagnosis` (used as an alternate opinion).
- The endpoint returns the combined response so the frontend can show a single message summarizing both models.

### Chat “Run Model” button

- Lives in `src/components/chat-area.tsx` and now calls `runAdvancedModelSuite()` when clicked.
- Pulls the advanced feature list (if not cached), builds a placeholder payload where every feature is set to `50`, and sends it to `/api/v1/new-models/predict`.
- The chat assistant posts a summary describing which advanced models ran plus one bubble per model (XGBoost, AdaBoost, Autoencoder) with confidences/anomaly verdicts.
- This flow validates the `new models` artifacts end-to-end without touching the legacy DCRM inference pipeline.

## Available Scripts

### Frontend

- `pnpm dev` – Start Next.js in dev mode.
- `pnpm lint` – Run ESLint checks.
- `pnpm build && pnpm start` – Production build + start.

### Backend

- `uvicorn app.main:app --reload` – Launch API with auto-reload.
- `pytest` (if tests are added) – Run unit/integration tests.

## Project Structure

```
frontend/company-assigmnet/
├─ src/
│  ├─ app/…                # Next.js routes (dashboard, auth, heat maps)
│  ├─ components/…         # Reusable UI (chat, uploader, charts, etc.)
│  ├─ lib/api-client.ts    # Typed API helpers hitting FastAPI
│  └─ provider/            # Theme and layout providers
└─ public/avatars          # Avatar assets for chat bubbles

backend/
├─ app/
│  ├─ routers/             # FastAPI route modules (uploads, diagnostics, auth)
│  ├─ services/            # Diagnostics service (model loading + inference)
│  ├─ models.py            # Pydantic schemas shared across routers
│  └─ config.py            # Settings loader (.env + Cloudinary helpers)
├─ dcrm_models/            # ML artifacts (not checked in)
├─ data/                   # Sample CSV + mapping utilities
└─ README.md               # Backend-specific docs
```

## Talking to GPT or other copilots

If you are feeding this repository into a coding assistant, mention:

- FastAPI backend exposes `/api/v1/uploads` (multipart) and `/api/v1/diagnostics/*` (JSON) endpoints.
- CSV uploads now include diagnostic results in the same response, so the frontend only makes a single round trip.
- Cloudinary credentials are loaded via `CLOUDINARY_URL` or individual variables through `backend/app/config.py`.
- DCRM models live under `backend/dcrm_models/` and are loaded lazily via `diagnostics_service`.

This README should give enough context for any model (or teammate) to understand the moving pieces of the project.
