from fastapi import APIRouter

from app.services.data_calendar_service import get_available_data_dates


router = APIRouter(prefix="/api", tags=["data-calendar"])


@router.get("/data/available-dates")
def available_dates():
    return get_available_data_dates()
