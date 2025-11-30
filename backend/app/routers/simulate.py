from fastapi import APIRouter

router = APIRouter(prefix="/api/v1/simulate", tags=["simulate"])


@router.get("/")
def simulate_placeholder():
    return {"status": "pending"}
