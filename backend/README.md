# DCRM Monitor Backend

Lightweight FastAPI backend that powers authentication for the DCRM Monitor Next.js frontend. Data lives entirely in memory so every server restart starts from a clean slate.

## Requirements

- Python 3.11+
- (Optional) virtual environment such as `venv` or `conda`

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

## Placeholder routes

Router modules for devices, uploads, waveforms, analyses, simulate, and reports are wired up but currently return stubbed data. They are ready to be fleshed out when additional requirements land.
