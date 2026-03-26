from pydantic import BaseModel
from typing import List, Optional

class MLAListItem(BaseModel):
    person_id: str
    name: str
    constituency: str
    constituency_id: str
    party: str
    party_logo_url: Optional[str] = None
    party_color_bg: Optional[str] = None
    party_color_text: Optional[str] = None
    party_color_border: Optional[str] = None
    period: str = "2021-2026"
    slug: Optional[str] = None
    image_url: Optional[str] = None

    model_config = {
        "json_schema_extra": {
            "example": {
                "person_id": "PERSON#3f2a5bd91c4e7a82f0d6b5c1e9a03f7d",
                "name": "M.K. STALIN",
                "constituency": "KOLATHUR",
                "constituency_id": "CONSTITUENCY#kolathur",
                "party": "DMK",
                "period": "2021-2026"
            }
        }
    }

class MLAListResponse(BaseModel):
    mlas: List[MLAListItem]
    total: int

    model_config = {
        "json_schema_extra": {
            "example": {
                "mlas": [
                    {
                        "person_id": "PERSON#3f2a5bd91c4e7a82f0d6b5c1e9a03f7d",
                        "name": "M.K. STALIN",
                        "constituency": "KOLATHUR",
                        "constituency_id": "CONSTITUENCY#kolathur",
                        "party": "DMK",
                        "period": "2021-2026"
                    }
                ],
                "total": 1
            }
        }
    }

class PersonDetail(BaseModel):
    person_id: str
    name: str
    image_url: Optional[str] = None

    model_config = {
        "json_schema_extra": {
            "example": {
                "person_id": "PERSON#3f2a5bd91c4e7a82f0d6b5c1e9a03f7d",
                "name": "M.K. STALIN"
            }
        }
    }

class ElectionHistoryRecord(BaseModel):
    year: int
    constituency: str
    party: str
    party_logo_url: Optional[str] = None
    party_color_bg: Optional[str] = None
    party_color_text: Optional[str] = None
    party_color_border: Optional[str] = None
    winner: bool
    margin: Optional[int] = None
    margin_percent: Optional[float] = None

    model_config = {
        "json_schema_extra": {
            "example": {
                "year": 2011,
                "constituency": "Kolathur",
                "party": "DMK",
                "winner": True
            }
        }
    }

class WinRate(BaseModel):
    total_contested: int
    total_wins: int
    win_rate: float

    model_config = {
        "json_schema_extra": {
            "example": {
                "total_contested": 4,
                "total_wins": 3,
                "win_rate": 75.0
            }
        }
    }

class AssetGrowthRecord(BaseModel):
    year: int
    assets: float
    growth_percent: Optional[float] = None

    model_config = {
        "json_schema_extra": {
            "example": {
                "year": 2016,
                "assets": 45000000.0,
                "growth_percent": 125.0
            }
        }
    }

class VoteTrendRecord(BaseModel):
    year: int
    votes: int
    vote_percent: Optional[float] = None

    model_config = {
        "json_schema_extra": {
            "example": {
                "year": 2016,
                "votes": 102000,
                "vote_percent": 54.7
            }
        }
    }

class IncomeGrowthRecord(BaseModel):
    year: int
    income: float
    growth_percent: Optional[float] = None

    model_config = {
        "json_schema_extra": {
            "example": {
                "year": 2021,
                "income": 5000000.0,
                "growth_percent": 150.0
            }
        }
    }

class MarginTrendRecord(BaseModel):
    year: int
    margin: int
    margin_percent: Optional[float] = None

    model_config = {
        "json_schema_extra": {
            "example": {
                "year": 2021,
                "margin": 50000,
                "margin_percent": 23.5
            }
        }
    }

class ElectionExpenseRecord(BaseModel):
    year: int
    amount: float
    growth_percent: Optional[float] = None

    model_config = {
        "json_schema_extra": {
            "example": {
                "year": 2021,
                "amount": 2800000.0,
                "growth_percent": 15.0
            }
        }
    }

class CriminalCaseRecord(BaseModel):
    year: int
    cases: int

    model_config = {
        "json_schema_extra": {
            "example": {
                "year": 2021,
                "cases": 5
            }
        }
    }

class MLAAnalytics(BaseModel):
    win_rate: WinRate
    asset_growth: List[AssetGrowthRecord]
    vote_trend: List[VoteTrendRecord]
    margin_trend: List[MarginTrendRecord]
    income_growth: List[IncomeGrowthRecord]
    criminal_case_trend: List[CriminalCaseRecord]
    election_expenses_trend: List[ElectionExpenseRecord]
    itr_history: Optional[dict] = None
    gold_assets: Optional[dict] = None
    vehicle_assets: Optional[dict] = None
    land_assets: Optional[dict] = None

    model_config = {
        "json_schema_extra": {
            "example": {
                "win_rate": {
                    "total_contested": 4,
                    "total_wins": 3,
                    "win_rate": 75.0
                },
                "asset_growth": [
                    {"year": 2011, "assets": 20000000.0},
                    {"year": 2016, "assets": 45000000.0, "growth_percent": 125.0}
                ],
                "vote_trend": [
                    {"year": 2016, "votes": 102000, "vote_percent": 54.7}
                ],
                "income_growth": [
                    {"year": 2016, "income": 2000000.0},
                    {"year": 2021, "income": 5000000.0, "growth_percent": 150.0}
                ],
                "criminal_case_trend": [
                    {"year": 2011, "cases": 0},
                    {"year": 2021, "cases": 5}
                ],
                "election_expenses_trend": [
                    {"year": 2016, "amount": 2000000.0},
                    {"year": 2021, "amount": 2800000.0, "growth_percent": 40.0}
                ],
                "itr_history": {
                    "self": {
                        "2019-2020": 500000
                    }
                }
            }
        }
    }

class MLAProfileResponse(BaseModel):
    person: PersonDetail
    history: List[ElectionHistoryRecord]
    analytics: MLAAnalytics

    model_config = {
        "json_schema_extra": {
            "example": {
                "person": {
                    "person_id": "PERSON#3f2a5bd91c4e7a82f0d6b5c1e9a03f7d",
                    "name": "M.K. STALIN"
                },
                "history": [
                    {
                        "year": 2011,
                        "constituency": "Kolathur",
                        "party": "DMK",
                        "winner": True
                    }
                ],
                "analytics": {
                    "win_rate": {
                        "total_contested": 1,
                        "total_wins": 1,
                        "win_rate": 100.0
                    },
                    "asset_growth": [],
                    "vote_trend": [],
                    "income_growth": [],
                    "criminal_case_trend": []
                }
            }
        }
    }
