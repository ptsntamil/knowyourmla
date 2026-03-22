from pydantic import BaseModel
from typing import List, Optional

class ConstituencyResponse(BaseModel):
    id: str
    name: str
    district_id: str
    type: str

    model_config = {
        "json_schema_extra": {
            "example": {
                "id": "CONSTITUENCY#kolathur",
                "name": "KOLATHUR",
                "district_id": "DISTRICT#chennai",
                "type": "GEN"
            }
        }
    }

class PartyObj(BaseModel):
    id: str
    name: Optional[str] = None
    short_name: Optional[str] = None
    logo_url: Optional[str] = None
    color_bg: Optional[str] = None
    color_text: Optional[str] = None
    color_border: Optional[str] = None

    model_config = {
        "json_schema_extra": {
            "example": {
                "id": "PARTY#dmk",
                "name": "DMK"
            }
        }
    }

class WinnerHistoryRecord(BaseModel):
    year: int
    winner: str
    profile_pic: Optional[str] = None
    party: PartyObj
    margin: int
    person_id: Optional[str] = None
    slug: Optional[str] = None

    model_config = {
        "json_schema_extra": {
            "example": {
                "year": 2021,
                "winner": "M.K. STALIN",
                "party": {
                    "id": "PARTY#dmk",
                    "name": "DMK"
                },
                "margin": 50000
            }
        }
    }

class ConstituencyStatYear(BaseModel):
    year: int
    total_electors: int
    total_votes_polled: int
    poll_percentage: float
    male: Optional[int] = None
    female: Optional[int] = None
    third_gender: Optional[int] = None

    model_config = {
        "json_schema_extra": {
            "example": {
                "year": 2021,
                "total_electors": 259194,
                "total_votes_polled": 212864,
                "poll_percentage": 82.1,
                "male": 128000,
                "female": 131194,
                "third_gender": 0
            }
        }
    }

class ConstituencyWinnerHistoryResponse(BaseModel):
    constituency: str
    history: List[WinnerHistoryRecord]
    stats: List[ConstituencyStatYear] = []

    model_config = {
        "json_schema_extra": {
            "example": {
                "constituency": "kolathur",
                "history": [
                    {
                        "year": 2021,
                        "winner": "M.K. STALIN",
                        "party": {
                            "id": "PARTY#dmk",
                            "name": "DMK"
                        },
                        "margin": 50000
                    }
                ],
                "stats": [
                    {
                        "year": 2021,
                        "total_electors": 259194,
                        "total_votes_polled": 212864,
                        "poll_percentage": 82.1
                    }
                ]
            }
        }
    }
