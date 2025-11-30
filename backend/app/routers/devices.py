from fastapi import APIRouter

router = APIRouter(prefix="/api/v1/devices", tags=["devices"])


@router.get("/")
def list_devices():
    return {"devices": [], "total": 0}
