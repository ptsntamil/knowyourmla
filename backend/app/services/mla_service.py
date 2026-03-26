from typing import List, Optional, Dict, Any
from fastapi import HTTPException
from app.repositories.person_repository import PersonRepository
from app.repositories.candidate_repository import CandidateRepository
from app.repositories.constituency_repository import ConstituencyRepository
from app.models.mla import (
    MLAProfileResponse,
    PersonDetail,
    ElectionHistoryRecord,
    MLAAnalytics,
    WinRate,
    AssetGrowthRecord,
    VoteTrendRecord,
    IncomeGrowthRecord,
    CriminalCaseRecord,
    MarginTrendRecord,
    ElectionExpenseRecord,
    MLAListItem,
    MLAListResponse
)
from app.repositories.mla_repository import MLARepository
from app.repositories.party_repository import PartyRepository

class MLAService:
    def __init__(self, person_repo: PersonRepository = None, candidate_repo: CandidateRepository = None, mla_repo: MLARepository = None, constituency_repo: ConstituencyRepository = None, party_repo: PartyRepository = None):
        self.person_repo = person_repo or PersonRepository()
        self.candidate_repo = candidate_repo or CandidateRepository()
        self.mla_repo = mla_repo or MLARepository()
        self.constituency_repo = constituency_repo or ConstituencyRepository()
        self.party_repo = party_repo or PartyRepository()
        self._party_cache = None

    def _get_constituency_name(self, record: dict) -> str:
        constituency_id = record.get("constituency_id", "")
        return constituency_id.replace("CONSTITUENCY#", "").title()

    def _get_party_name(self, record: dict) -> str:
        party_id = record.get("party_id", "")
        if not party_id:
            return ""
        
        info = self._get_party_info(party_id)
        if info.get("short_name"):
            return info["short_name"].upper()
            
        return party_id.replace("PARTY#", "").upper()

    def _get_party_logo(self, party_id: str) -> Optional[str]:
        info = self._get_party_info(party_id)
        return info.get("logo")

    def _ensure_party_cache(self) -> None:
        if self._party_cache is None:
            try:
                parties = self.party_repo.get_all_parties()
                self._party_cache = {}
                for p in parties:
                    pk = p.get("PK", "").upper()
                    data = {
                        "logo": p.get("logo_url"),
                        "short_name": p.get("short_name"),
                        "color_bg": p.get("color_bg"),
                        "color_text": p.get("color_text"),
                        "color_border": p.get("color_border")
                    }
                    self._party_cache[pk] = data
                    if data["short_name"]:
                        self._party_cache[f"PARTY#{data['short_name'].upper()}"] = data
                    if p.get("name"):
                        self._party_cache[f"PARTY#{p['name'].upper()}"] = data
            except Exception:
                self._party_cache = {}

    def _get_party_info(self, party_id: str) -> Dict[str, Any]:
        if not party_id:
            return {"logo": None, "short_name": None, "color_bg": None, "color_text": None, "color_border": None}
        self._ensure_party_cache()
        return self._party_cache.get(party_id.upper(), {"logo": None, "short_name": None, "color_bg": None, "color_text": None, "color_border": None})

    def _slugify(self, name: str) -> str:
        if not name:
            return ""
        # Remove common initials and titles if redundant, but for now just basic slugify
        import re
        # Convert to lowercase and replace non-alphanumeric with hyphens
        s = name.lower()
        s = re.sub(r'[^a-z0-9\s]', '', s) # Strip dots, commas etc.
        s = s.strip()
        s = re.sub(r'\s+', '-', s)
        return s

    def _process_asset_growth(self, record: dict, prev_assets: float) -> AssetGrowthRecord:
        current_assets = float(record.get("total_assets") or 0)
        growth_pct = None
        if prev_assets is not None and prev_assets > 0:
            growth_pct = round(((current_assets - prev_assets) / prev_assets) * 100, 2)
        return AssetGrowthRecord(
            year=int(record.get("year", 0)),
            assets=current_assets,
            growth_percent=growth_pct
        ), current_assets

    def _process_income_growth(self, record: dict, prev_income: float) -> IncomeGrowthRecord:
        current_income = float(record.get("income_itr") or 0)
        growth_pct = None
        if prev_income is not None and prev_income > 0:
            growth_pct = round(((current_income - prev_income) / prev_income) * 100, 2)
        return IncomeGrowthRecord(
            year=int(record.get("year", 0)),
            income=current_income,
            growth_percent=growth_pct
        ), current_income

    def _aggregate_itr_history(self, record: dict, total_itr_history: dict) -> None:
        itr_h = record.get("itr_history")
        if isinstance(itr_h, dict):
            for relation, years in itr_h.items():
                if relation is None or str(relation).lower() == "none":
                    continue
                if relation not in total_itr_history:
                    total_itr_history[relation] = {}
                if isinstance(years, dict):
                    for yr_range, amt in years.items():
                        if yr_range is None or str(yr_range).lower() == "none":
                            continue
                        try:
                            total_itr_history[relation][yr_range] = float(amt)
                        except (ValueError, TypeError):
                            total_itr_history[relation][yr_range] = 0.0

    def _process_election_expenses(self, record: dict, prev_expenses: float) -> ElectionExpenseRecord:
        current_expenses = float(record.get("election_expenses") or 0)
        growth_pct = None
        if prev_expenses is not None and prev_expenses > 0:
            growth_pct = round(((current_expenses - prev_expenses) / prev_expenses) * 100, 2)
        return ElectionExpenseRecord(
            year=int(record.get("year", 0)),
            amount=current_expenses,
            growth_percent=growth_pct
        ), current_expenses

    def _get_person_detail(self, identifier: str) -> PersonDetail:
        if not identifier.startswith("PERSON#"):
            identifier = f"PERSON#{identifier}"
       
        person_data = self.person_repo.get_person_by_id(identifier)
            
        if not person_data:
            # Fallback to normalized SEO slug (e.g. mk-stalin) to match database normalized_name (mkstalin)
            normalized_slug = "".join(filter(str.isalnum, identifier.lower()))
            person_data = self.person_repo.get_person_by_normalized_name(normalized_slug)

        if not person_data:
            raise HTTPException(status_code=404, detail="Person not found")

        return PersonDetail(
            person_id=person_data.get("PK"),
            name=person_data.get("name", "Unknown"),
            image_url=person_data.get("image_url")
        )

    def _update_analytics_from_record(self, record: dict, state: dict) -> None:
        year = int(record.get("year", 0))
        is_winner = bool(record.get("is_winner", False))
        if is_winner:
            state['total_wins'] += 1

        party_info = self._get_party_info(record.get("party_id"))
        state['history'].append(ElectionHistoryRecord(
            year=year,
            constituency=self._get_constituency_name(record),
            party=self._get_party_name(record),
            party_logo_url=party_info.get("logo"),
            party_color_bg=party_info.get("color_bg"),
            party_color_text=party_info.get("color_text"),
            party_color_border=party_info.get("color_border"),
            winner=is_winner,
            margin=int(record.get("winning_margin") or 0) if is_winner and "winning_margin" in record else None,
            margin_percent=float(record.get("margin_percentage") or 0) if is_winner and "margin_percentage" in record else None
        ))

        asset_rec, state['prev_assets'] = self._process_asset_growth(record, state['prev_assets'])
        state['asset_growth'].append(asset_rec)

        if "total_votes" in record:
            state['vote_trend'].append(VoteTrendRecord(year=year, votes=int(record.get("total_votes", 0)), vote_percent=None))

        income_rec, state['prev_income'] = self._process_income_growth(record, state['prev_income'])
        state['income_growth'].append(income_rec)

        state['criminal_case_trend'].append(CriminalCaseRecord(year=year, cases=int(record.get("criminal_cases") or 0)))

        if is_winner and ("winning_margin" in record or "margin_percentage" in record):
            state['margin_trend'].append(MarginTrendRecord(
                year=year,
                margin=int(record.get("winning_margin") or 0),
                margin_percent=float(record.get("margin_percentage") or 0)
            ))
        
        expense_rec, state['prev_expenses'] = self._process_election_expenses(record, state['prev_expenses'])
        state['election_expenses_trend'].append(expense_rec)
        self._aggregate_itr_history(record, state['total_itr_history'])

    def _process_candidate_history_data(self, candidates_data: List[dict]) -> tuple:
        state = {
            'history': [], 'asset_growth': [], 'vote_trend': [], 'income_growth': [],
            'criminal_case_trend': [], 'margin_trend': [], 'election_expenses_trend': [],
            'total_itr_history': {}, 'total_wins': 0, 'prev_assets': None, 'prev_income': None, 'prev_expenses': None
        }

        for record in candidates_data:
            self._update_analytics_from_record(record, state)

        return (state['history'], state['asset_growth'], state['vote_trend'], state['income_growth'], 
                state['criminal_case_trend'], state['margin_trend'], state['election_expenses_trend'], 
                state['total_itr_history'], state['total_wins'])

    def get_mla_profile(self, identifier: str) -> MLAProfileResponse:
        """
        Gathers person and candidate data, computing all required analytics for the MLA profile.
        """
        person_detail = self._get_person_detail(identifier)
        person_id = person_detail.person_id

        candidates_data = self.candidate_repo.get_person_history(person_id)
        candidates_data.sort(key=lambda x: int(x.get("year", 0)))

        (history, asset_growth, vote_trend, income_growth, criminal_case_trend, 
         margin_trend, election_expenses_trend, total_itr_history, total_wins) = self._process_candidate_history_data(candidates_data)

        total_contested = len(candidates_data)
        win_rate_val = (total_wins / total_contested * 100) if total_contested > 0 else 0.0

        if not person_detail.image_url and candidates_data:
            person_detail.image_url = candidates_data[-1].get("profile_pic")

        # Extract detailed assets from the latest record
        latest_record = candidates_data[-1] if candidates_data else {}
        gold_assets = latest_record.get("gold_assets")
        vehicle_assets = latest_record.get("vehicle_assets")
        land_assets = latest_record.get("land_assets")

        analytics = MLAAnalytics(
            win_rate=WinRate(total_contested=total_contested, total_wins=total_wins, win_rate=round(win_rate_val, 2)),
            asset_growth=asset_growth,
            vote_trend=vote_trend,
            margin_trend=margin_trend,
            income_growth=income_growth,
            criminal_case_trend=criminal_case_trend,
            election_expenses_trend=election_expenses_trend,
            itr_history=total_itr_history if total_itr_history else None,
            gold_assets=gold_assets,
            vehicle_assets=vehicle_assets,
            land_assets=land_assets
        )

        history.sort(key=lambda x: x.year, reverse=True)
        return MLAProfileResponse(person=person_detail, history=history, analytics=analytics)

    def _prepare_mla_list_item(self, const: dict, winner_map: dict, person_map: dict) -> MLAListItem:
        const_id = const.get("PK", "")
        winner = winner_map.get(const_id)
        
        if not winner:
            return MLAListItem(
                person_id="", slug="", name="",
                constituency=const.get("name", const_id.replace("CONSTITUENCY#", "").title()),
                constituency_id=const_id, party="", period="2021-2026"
            )
            
        person_id = winner.get("person_id", "")
        person_meta = person_map.get(person_id, {})
        display_name = person_meta.get("name") or winner.get("candidate_name") or "Unknown"
        
        party_info = self._get_party_info(winner.get("party_id"))
        return MLAListItem(
            person_id=person_id,
            slug=self._slugify(display_name),
            name=display_name,
            constituency=const.get("name", const_id.replace("CONSTITUENCY#", "").title()),
            constituency_id=const_id,
            party=self._get_party_name(winner),
            party_logo_url=party_info.get("logo"),
            party_color_bg=party_info.get("color_bg"),
            party_color_text=party_info.get("color_text"),
            party_color_border=party_info.get("color_border"),
            period="2021-2026"
        )

    def get_current_mlas(self, year: int = 2021) -> MLAListResponse:
        """
        Fetches the list of winners for the specified election year.
        If year is 2021, it fetches all winners for the 2021-2026 term.
        """
        try:
            year_int = int(year)
        except (ValueError, TypeError):
            year_int = 2021

        constituencies = self.constituency_repo.get_all_constituencies()
        
        # For the current term starting 2021, we want the latest winners up to 2026 (bye-elections)
        if year_int == 2021:
            winners = self.mla_repo.get_winners_by_year_range(2021, 2026)
        else:
            winners = self.mla_repo.get_winners_by_year(year_int)
        
        # Sort winners by year ascending so that when building winner_map,
        # the latest winner for a constituency overwrites earlier ones.
        winners.sort(key=lambda x: int(x.get("year", 0)))
        
        person_ids = list(set(w.get("person_id") for w in winners if w.get("person_id")))
        persons = self.person_repo.get_persons_by_ids(person_ids)
        person_map = {p.get("PK"): p for p in persons if p.get("PK")}
        winner_map = {w.get("constituency_id"): w for w in winners if w.get("constituency_id")}
        
        mla_list = [self._prepare_mla_list_item(c, winner_map, person_map) for c in constituencies]
        mla_list.sort(key=lambda x: x.constituency)
        
        return MLAListResponse(mlas=mla_list, total=len(mla_list))
