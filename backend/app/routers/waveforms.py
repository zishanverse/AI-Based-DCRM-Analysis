from fastapi import APIRouter

router = APIRouter(prefix="/api/v1/waveforms", tags=["waveforms"])


@router.get("/")
def list_waveforms():
    return {"waveforms": []}
