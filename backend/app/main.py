from __future__ import annotations

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from .routers import (
    analyses,
    auth,
    devices,
    diagnostics,
    heatmap,
    model_tests,
    reports,
    simulate,
    uploads,
    waveforms,
)


from .db import database

app = FastAPI(title="DCRM Monitor API", version="0.1.0")

@app.on_event("startup")
async def startup():
    await database.connect()

@app.on_event("shutdown")
async def shutdown():
    await database.disconnect()


import os

ALLOWED_ORIGINS = [
    "http://localhost",
    "http://localhost:3000",
    "http://localhost:5173",
    "https://ai-based-dcrm-analysis.vercel.app",
]

# Add origins from environment variable (comma separated)
env_origins = os.getenv("ALLOWED_ORIGINS")
if env_origins:
    ALLOWED_ORIGINS.extend([origin.strip() for origin in env_origins.split(",")])

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(devices.router)
app.include_router(waveforms.router)
app.include_router(analyses.router)
app.include_router(uploads.router)
app.include_router(simulate.router)
app.include_router(reports.router)
app.include_router(diagnostics.router)
app.include_router(heatmap.router)
app.include_router(model_tests.router)


@app.get("/healthz")
async def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


@app.websocket("/ws/echo")
async def websocket_echo(websocket: WebSocket) -> None:
    await websocket.accept()
    try:
        while True:
            payload = await websocket.receive_text()
            await websocket.send_text(payload)
    except WebSocketDisconnect:
        pass
