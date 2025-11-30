from fastapi import APIRouter

router = APIRouter(prefix="/api/v1/uploads", tags=["uploads"])


@router.get("/")
def list_uploads():
    return {"uploads": []}
