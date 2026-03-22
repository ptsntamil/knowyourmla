from typing import List, Optional
from app.repositories.election_repository import ElectionRepository
from app.models.election import ElectionResponse

class ElectionService:
    """Service layer for election-related business logic."""

    def __init__(self, repository: ElectionRepository = None):
        self.repository = repository or ElectionRepository()

    def list_elections(self) -> List[ElectionResponse]:
        """
        Fetches all elections and maps them to ElectionResponse models.
        """
        raw_elections = self.repository.get_all_elections()
        
        # Sort elections by year descending
        raw_elections.sort(key=lambda x: x.get("year", 0), reverse=True)

        return [
            ElectionResponse(
                id=item.get("PK", ""),
                year=item.get("year", 0),
                type=item.get("type", ""),
                category=item.get("category", "")
            )
            for item in raw_elections
        ]

    def get_election(self, election_id: str) -> Optional[ElectionResponse]:
        """
        Fetches a single election and maps it to an ElectionResponse model.
        """
        item = self.repository.get_election_by_id(election_id)
        if not item:
            return None

        return ElectionResponse(
            id=item.get("PK", ""),
            year=item.get("year", 0),
            type=item.get("type", ""),
            category=item.get("category", "")
        )
