from pydantic import BaseModel
from typing import Optional

class ElectionResponse(BaseModel):
    """Pydantic model for an election record response."""
    id: str  # PK e.g. ELECTION#2021#ASSEMBLY#GENERAL
    year: int
    type: str  # Assembly / Lok Sabha
    category: str  # General / Bye-Election

    model_config = {
        "json_schema_extra": {
            "example": {
                "id": "ELECTION#2021#ASSEMBLY#GENERAL",
                "year": 2021,
                "type": "Assembly",
                "category": "General"
            }
        }
    }
