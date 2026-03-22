from fastapi import APIRouter, HTTPException
from typing import List, Optional
from app.models.election import ElectionResponse
from app.services.election_service import ElectionService

router = APIRouter(prefix="/api/v1/elections", tags=["Elections"])

@router.get("", response_model=List[ElectionResponse])
def get_elections():
    """
    List all elections.
    """
    service = ElectionService()
    return service.list_elections()

@router.get("/{election_id}", response_model=ElectionResponse)
def get_election(election_id: str):
    """
    Get details of a specific election.
    """
    service = ElectionService()
    election = service.get_election(election_id)
    if not election:
        raise HTTPException(status_code=404, detail="Election not found")
    return election
