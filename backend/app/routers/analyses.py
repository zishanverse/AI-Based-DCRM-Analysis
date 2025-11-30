from fastapi import APIRouter

router = APIRouter(prefix="/api/v1/analyses", tags=["analyses"])


@router.get("/")
def list_analyses():
    return {"analyses": []}
