from fastapi import APIRouter
from typing import List
from app.models.district import DistrictResponse, DistrictDetailResponse
from app.services.district_service import DistrictService

router = APIRouter(prefix="/api/v1/districts", tags=["Districts"])

@router.get("", response_model=List[DistrictResponse])
def get_districts():
    """
    List all districts.
    """
    service = DistrictService()
    return service.list_districts()

@router.get("/{district_id}", response_model=DistrictDetailResponse)
def get_district(district_id: str):
    """
    Get detailed district information including aggregated statistics.
    """
    service = DistrictService()
    return service.get_district_details(district_id)
