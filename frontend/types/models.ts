export interface DistrictResponse {
  id: string;
  name: string;
  slug?: string;
  total_constituencies?: number;
  image_url?: string;
}

export interface DistrictStatYear {
  year: number;
  total_electors: number;
  male?: number;
  female?: number;
  third_gender?: number;
}

export interface DistrictDetailResponse {
  id: string;
  name: string;
  description?: string;
  total_constituencies?: number;
  image_url?: string;
  stats: DistrictStatYear[];
}

export interface ConstituencyResponse {
  id: string;
  name: string;
  slug?: string;
  district_id: string;
  type: string;
}

export interface PartyObj {
  id: string;
  name: string | null;
  short_name?: string | null;
  logo_url?: string | null;
  color_bg?: string | null;
  color_text?: string | null;
  color_border?: string | null;
}

export interface WinnerHistoryRecord {
  year: number;
  winner: string;
  profile_pic?: string;
  party: PartyObj;
  margin: number;
  person_id?: string;
  slug?: string;
  district_name?: string;
  district_id?: string;
}

export interface ConstituencyStatYear {
  year: number;
  total_electors: number;
  total_votes_polled: number;
  poll_percentage: number;
  male?: number;
  female?: number;
  third_gender?: number;
}

export interface ConstituencyWinnerHistoryResponse {
  constituency: string;
  district_name?: string;
  district_id?: string;
  history: WinnerHistoryRecord[];
  stats: ConstituencyStatYear[];
}

export interface PersonDetail {
  person_id: string;
  name: string;
  image_url?: string;
  education?: string;
  profession?: string;
}

export interface ElectionHistoryRecord {
  year: number;
  constituency: string;
  party: string;
  party_logo_url?: string;
  party_color_bg?: string;
  party_color_text?: string;
  party_color_border?: string;
  winner: boolean;
  district_name?: string;
  margin?: number | null;
  margin_percent?: number | null;
}

export interface WinRate {
  total_contested: number;
  total_wins: number;
  win_rate: number;
}

export interface AssetGrowthRecord {
  year: number;
  assets: number;
  growth_percent: number | null;
}

export interface VoteTrendRecord {
  year: number;
  votes: number;
  vote_percent: number | null;
}

export interface IncomeGrowthRecord {
  year: number;
  income: number;
  growth_percent: number | null;
}

export interface CriminalCaseRecord {
  year: number;
  cases: number;
}

export interface MarginTrendRecord {
  year: number;
  margin: number;
  margin_percent: number | null;
}

export interface ElectionExpenseRecord {
  year: number;
  amount: number;
  growth_percent: number | null;
}

export interface MLAAnalytics {
  win_rate: WinRate;
  asset_growth: AssetGrowthRecord[];
  vote_trend: VoteTrendRecord[];
  margin_trend: MarginTrendRecord[];
  income_growth: IncomeGrowthRecord[];
  criminal_case_trend: CriminalCaseRecord[];
  election_expenses_trend: ElectionExpenseRecord[];
  itr_history?: Record<string, Record<string, number>> | null;
  gold_assets?: any | null;
  silver_assets?: any | null;
  vehicle_assets?: any | null;
  land_assets?: any | null;
}

export interface MLAProfileResponse {
  person: PersonDetail;
  history: ElectionHistoryRecord[];
  analytics: MLAAnalytics;
}

export interface MLAListItem {
  person_id: string;
  slug: string;
  name: string;
  constituency: string;
  constituency_id: string;
  party: string;
  party_logo_url?: string;
  party_color_bg?: string;
  party_color_text?: string;
  party_color_border?: string;
  period: string;
  image_url?: string;
}

export interface MLAListResponse {
  mlas: MLAListItem[];
  total: number;
}
export interface CandidateHistoryRecordShort {
  year: number;
  constituency: string;
  party: string;
  winner: boolean;
}

export interface CandidateHistoryResponse {
  person_id: string;
  history: CandidateHistoryRecordShort[];
}

export interface ElectionResponse {
  id: string;
  year: number;
  type: string;
  category: string;
}
