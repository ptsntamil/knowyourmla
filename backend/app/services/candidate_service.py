from typing import List
from app.repositories.candidate_repository import CandidateRepository
from app.models.candidate import CandidateHistoryResponse, CandidateHistoryRecord

class CandidateService:
    def __init__(self, repository: CandidateRepository = None):
        self.repository = repository or CandidateRepository()

    def get_candidate_history(self, person_id: str) -> CandidateHistoryResponse:
        """
        Fetches historical election data for a specific candidate.
        Maps raw data to CandidateHistoryResponse model.
        """
        raw_history = self.repository.get_person_history(person_id)
        
        history_records = []
        for h in raw_history:
            # Extract plain constituency name from the ID 
            constituency_id = h.get("constituency_id", "")
            constituency_name = constituency_id.replace("CONSTITUENCY#", "")
            
            history_records.append(CandidateHistoryRecord(
                year=int(h.get("year", 0)),
                constituency=constituency_name,
                party=h.get("party_id", "").replace("PARTY#", "").upper(),
                winner=bool(h.get("is_winner", False))
            ))
            
        return CandidateHistoryResponse(
            person_id=person_id,
            history=history_records
        )
