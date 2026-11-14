export interface ExpenditureCategory {
  category_id: string;
  category_name: string;
  display_category_name: string;
  expenditure_group: string;
  amount_rs?: number;
  amount_lakh?: number;
  amount_crore?: number;
  ratio_of_total_pct?: number;
  ratio_of_general_propaganda_pct?: number;
  source_section: string;
  reported_or_calculated: 'REPORTED' | 'NOT_DISCLOSED';
}

export interface ExpenditureReport {
  PK: string;
  SK: string;
  entity_type: string;
  party_id: string;
  party_short: string;
  party_full: string;
  election_id: string;
  year: number;
  election_type: string;
  election_category: string;
  state_id: string;
  report_scope: string;
  reported_total_rs?: number;
  general_propaganda_rs?: number;
  candidate_expenditure_rs?: number;
  calculated_category_total_rs: number;
  reconciliation_difference_rs?: number;
  source_type: string;
  data_quality_note: string;
  categories?: ExpenditureCategory[];
}
