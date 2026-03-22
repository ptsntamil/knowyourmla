from typing import List, Optional, Dict, Any
from app.repositories.district_repository import DistrictRepository
from app.repositories.constituency_repository import ConstituencyRepository
from app.models.district import DistrictResponse, DistrictDetailResponse, DistrictStatYear

class DistrictService:
    def __init__(self, repository: DistrictRepository = None, constituency_repo: ConstituencyRepository = None):
        self.repository = repository or DistrictRepository()
        self.constituency_repo = constituency_repo or ConstituencyRepository()

    def list_districts(self) -> List[DistrictResponse]:
        """
        Fetches all districts and maps them to DistrictResponse models.
        """
        raw_districts = self.repository.get_all_districts()
        
        result = []
        for d in raw_districts:
            result.append(DistrictResponse(
                id=d.get("PK", ""),
                name=d.get("name", "")
            ))
        # Sort districts by name alphabetically
        result.sort(key=lambda x: x.name)
            
        return result

    def get_district_details(self, district_id: str) -> Optional[DistrictDetailResponse]:
        """
        Fetches district details and aggregates stats from its constituencies.
        """
        raw_district = self.repository.get_district_by_id(district_id)
        if not raw_district:
            return None

        # Fetch all constituencies in this district
        constituencies = self.constituency_repo.get_constituencies_by_district(district_id)
        
        # Aggregate statistics by year
        aggregated_stats: Dict[int, Dict[str, Any]] = {}
        
        for c in constituencies:
            stats_map = c.get("statistics", {})
            for year_str, data in stats_map.items():
                year = int(year_str)
                if year not in aggregated_stats:
                    aggregated_stats[year] = {
                        "total_electors": 0,
                        "male": 0,
                        "female": 0,
                        "third_gender": 0
                    }
                
                aggregated_stats[year]["total_electors"] += data.get("total_electors", 0)
                aggregated_stats[year]["male"] += data.get("male", 0)
                aggregated_stats[year]["female"] += data.get("female", 0)
                aggregated_stats[year]["third_gender"] += data.get("third_gender", 0)

        # Convert to response model
        stats_list = []
        for year, data in aggregated_stats.items():
            stats_list.append(DistrictStatYear(
                year=year,
                total_electors=data["total_electors"],
                male=data["male"] if data["male"] > 0 else None,
                female=data["female"] if data["female"] > 0 else None,
                third_gender=data["third_gender"] if data["third_gender"] > 0 else None
            ))
        
        # Sort stats by year descending
        stats_list.sort(key=lambda x: x.year, reverse=True)

        return DistrictDetailResponse(
            id=raw_district.get("PK", ""),
            name=raw_district.get("name", ""),
            stats=stats_list
        )
