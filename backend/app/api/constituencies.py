from fastapi import APIRouter, Query
from typing import List, Optional
from app.models.constituency import ConstituencyResponse, ConstituencyWinnerHistoryResponse
from app.services.constituency_service import ConstituencyService

router = APIRouter(prefix="/api/v1/constituencies", tags=["Constituencies"])

@router.get("", response_model=List[ConstituencyResponse])
def get_constituencies(district_id: Optional[str] = Query(None, description="Filter by district_id")):
    """
    List all constituencies. Optionally filter by district ID.
    """
    service = ConstituencyService()
    return service.list_constituencies(district_id=district_id)

@router.get("/{constituency_id}/winners", response_model=ConstituencyWinnerHistoryResponse)
def get_winner_history(constituency_id: str):
    """
    Get the historical list of winners for a specific constituency.
    """
    service = ConstituencyService()
    return service.get_winner_history(constituency_id=constituency_id)
