from pydantic import BaseModel

from typing import List, Optional

class DistrictResponse(BaseModel):
    id: str
    name: str

    model_config = {
        "json_schema_extra": {
            "example": {
                "id": "DISTRICT#chennai",
                "name": "CHENNAI"
            }
        }
    }

class DistrictStatYear(BaseModel):
    year: int
    total_electors: int
    male: Optional[int] = None
    female: Optional[int] = None
    third_gender: Optional[int] = None

class DistrictDetailResponse(BaseModel):
    id: str
    name: str
    stats: List[DistrictStatYear] = []
