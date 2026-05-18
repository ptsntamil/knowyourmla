import { LATEST_ELECTION_YEAR, PREVIOUS_ELECTION_YEAR } from "@/lib/constants/elections";

export const ELECTION_YEAR_CURRENT = parseInt(LATEST_ELECTION_YEAR);
export const ELECTION_YEAR_PRIOR = parseInt(PREVIOUS_ELECTION_YEAR);
export const ELECTION_STATE = "Tamil Nadu";
export const ELECTION_TYPE = "Assembly";

export const TAG_THRESHOLD_CLOSE_MARGIN = 5000;
export const VOTER_STATS_KEY = "202604";

export const STATUS_MAP = {
  ANNOUNCED: 'announced',
  CONFIRMED: 'confirmed',
  EXPECTED: 'expected',
  REPLACED: 'replaced',
  WITHDRAWN: 'withdrawn'
} as const;

export const AGE_BANDS = [
  { label: 'Under 35', min: 0, max: 34 },
  { label: '35 - 50', min: 35, max: 50 },
  { label: '51 - 65', min: 51, max: 65 },
  { label: 'Over 65', min: 66, max: 150 }
];

export const ASSET_BANDS = [
  { label: 'Under 10L', min: 0, max: 1000000 },
  { label: '10L - 1Cr', min: 1000000, max: 10000000 },
  { label: '1Cr - 10Cr', min: 10000000, max: 100000000 },
  { label: 'Over 10Cr', min: 100000000, max: 100000000000 }
];

export const TN_PARTY_DISPLAY_ORDER = [
  "DMK",
  "AIADMK",
  "BJP",
  "INC",
  "PMK",
  "DMDK",
  "NTK",
  "TVK",
  "AMMK"
];
