from fastapi import APIRouter
from app.models.mla import MLAProfileResponse, MLAListResponse
from app.models.candidate import CandidateHistoryResponse
from app.services.mla_service import MLAService
from app.services.candidate_service import CandidateService

router = APIRouter(prefix="/api/v1/mlas", tags=["MLAs"])

@router.get("", response_model=MLAListResponse)
def get_mlas(year: int = 2021):
    """
    Get the list of MLAs for a specific year.
    Defaults to 2021.
    """
    service = MLAService()
    return service.get_current_mlas(year=year)

@router.get("/{identifier}/profile", response_model=MLAProfileResponse)
def get_mla_profile(identifier: str):
    """
    Get the complete profile and analytics for a specific MLA/Candidate.
    Path identifier can be PERSON#id or normalized-name-slug.
    """
    service = MLAService()
    return service.get_mla_profile(identifier=identifier)

@router.get("/{person_id}/history", response_model=CandidateHistoryResponse)
def get_candidate_history(person_id: str):
    """
    Get the election history for a specific person.
    """
    service = CandidateService()
    return service.get_candidate_history(person_id=person_id)
