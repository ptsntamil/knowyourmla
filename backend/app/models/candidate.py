from pydantic import BaseModel
from typing import List

class CandidateHistoryRecord(BaseModel):
    year: int
    constituency: str
    party: str
    winner: bool

    model_config = {
        "json_schema_extra": {
            "example": {
                "year": 2011,
                "constituency": "kolathur",
                "party": "DMK",
                "winner": True
            }
        }
    }


class CandidateHistoryResponse(BaseModel):
    person_id: str
    history: List[CandidateHistoryRecord]

    model_config = {
        "json_schema_extra": {
            "example": {
                "person_id": "PERSON#3f2a5bd91c4e7a82f0d6b5c1e9a03f7d",
                "history": [
                    {
                        "year": 2021,
                        "constituency": "kolathur",
                        "party": "DMK",
                        "winner": True
                    }
                ]
            }
        }
    }
