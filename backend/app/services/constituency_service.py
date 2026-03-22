from typing import List, Optional
from app.repositories.constituency_repository import ConstituencyRepository
from app.repositories.person_repository import PersonRepository
from app.models.constituency import ConstituencyResponse, ConstituencyWinnerHistoryResponse, WinnerHistoryRecord

class ConstituencyService:
    def __init__(self, repository: ConstituencyRepository = None, person_repo: PersonRepository = None):
        self.repository = repository or ConstituencyRepository()
        self.person_repo = person_repo or PersonRepository()

    def list_constituencies(self, district_id: Optional[str] = None) -> List[ConstituencyResponse]:
        """
        Fetches all constituencies, optionally filtered by district_id.
        Maps raw data to ConstituencyResponse models.
        """
        if district_id:
            raw_constituencies = self.repository.get_constituencies_by_district(district_id)
        else:
            raw_constituencies = self.repository.get_all_constituencies()

        result = []
        for c in raw_constituencies:
            result.append(ConstituencyResponse(
                id=c.get("PK", ""),
                name=c.get("name", ""),
                district_id=c.get("district_id", ""),
                type=c.get("type", "")
            ))
            
        return result

    def _slugify(self, name: str) -> str:
        if not name:
            return ""
        import re
        s = name.lower()
        s = re.sub(r'[^a-z0-9\s]', '', s)
        s = s.strip()
        s = re.sub(r'\s+', '-', s)
        return s

    def _parse_margin(self, raw_margin: str) -> int:
        try:
            return int(str(raw_margin).replace(",", ""))
        except (ValueError, TypeError):
            return 0

    def _get_party_info(self, raw_party_id: str, party_cache: dict) -> dict:
        if not raw_party_id:
            return {"id": "NA"}

        if raw_party_id in party_cache:
            return party_cache[raw_party_id]

        party_data = self.repository.get_party_by_id(raw_party_id) or {}
        
        info = {
            "id": raw_party_id,
            "name": party_data.get("name"),
            "short_name": party_data.get("short_name"),
            "logo_url": party_data.get("logo_url"),
            "color_bg": party_data.get("color_bg"),
            "color_text": party_data.get("color_text"),
            "color_border": party_data.get("color_border")
        }
        party_cache[raw_party_id] = info
        
        return info

    def get_winner_history(self, constituency_id: str) -> ConstituencyWinnerHistoryResponse:
        """
        Fetches winner history for a specific constituency.
        """
        raw_history = self.repository.get_winner_history(constituency_id)
        
        # Batch fetch person metadata for consistent names/slugs
        person_ids = list(set(h.get("person_id") for h in raw_history if h.get("person_id")))
        persons = self.person_repo.get_persons_by_ids(person_ids)
        person_map = {p.get("PK"): p for p in persons if p.get("PK")}

        history_records = []
        party_cache = {}

        for h in raw_history:
            margin = self._parse_margin(h.get("winning_margin", 0))
            party_info = self._get_party_info(h.get("party_id"), party_cache)

            person_id = h.get("person_id")
            person_meta = person_map.get(person_id, {}) if person_id else {}
            
            # Favor name from Person record
            winner_name = person_meta.get("name") or h.get("candidate_name") or "Unknown"
            year_val = h.get("year") or 0
            if isinstance(year_val, str):
                year_val = int(year_val)
            
            history_records.append(WinnerHistoryRecord(
                year = year_val,
                winner=str(winner_name),
                profile_pic=person_meta.get("image_url") or h.get("profile_pic"),
                party=party_info,
                margin=margin,
                person_id=person_id,
                slug=self._slugify(winner_name) if winner_name != "Unknown" else None
            ))
            
        # Sort history by year descending to ensure latest winner is at index 0
        history_records.sort(key=lambda x: x.year, reverse=True)
            
        # Fetch constituency metadata for statistics
        metadata = self.repository.get_constituency_metadata(constituency_id)
        stats = []
        if metadata and "statistics" in metadata:
            raw_stats = metadata["statistics"]
            for year, data in raw_stats.items():
                stats.append({
                    "year": int(year),
                    "total_electors": data.get("total_electors", 0),
                    "total_votes_polled": data.get("total_votes_polled", 0),
                    "poll_percentage": data.get("poll_percentage", 0),
                    "male": data.get("male"),
                    "female": data.get("female"),
                    "third_gender": data.get("third_gender")
                })
        
        # Sort stats by year descending
        stats.sort(key=lambda x: x["year"], reverse=True)

        # Extract plain constituency name from the ID (e.g. CONSTITUENCY#kolathur -> kolathur)
        constituency_name = constituency_id.replace("CONSTITUENCY#", "")
        
        return ConstituencyWinnerHistoryResponse(
            constituency=constituency_name,
            history=history_records,
            stats=stats
        )
