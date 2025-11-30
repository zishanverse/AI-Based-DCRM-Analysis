from fastapi import APIRouter

router = APIRouter(prefix="/api/v1/reports", tags=["reports"])


@router.get("/")
def list_reports():
    return {"reports": []}
