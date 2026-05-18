/**
 * Helper functions to derive insights from constituency election data.
 */

interface ElectionHistory {
  year: number;
  winner: string;
  party: {
    name: string;
    short_name?: string;
  };
  margin: number;
}

interface VoterStats {
  year: number;
  total_electors: number;
  total_votes_polled: number;
  poll_percentage: number;
  male?: number;
  female?: number;
}

/**
 * Derives the seat type based on historical winning margins and party consistency.
 */
export function getSeatType(history: ElectionHistory[], stats: VoterStats[]) {
  if (!history || history.length === 0 || !stats || stats.length === 0) return "Unknown";

  const margins: number[] = [];
  let partyChanges = 0;

  for (let i = 0; i < history.length; i++) {
    const h = history[i];
    const s = stats.find((st) => st.year === h.year);
    if (s && s.total_votes_polled > 0) {
      const marginPct = (h.margin / s.total_votes_polled) * 100;
      margins.push(marginPct);
    }
    if (i > 0 && history[i].party.name !== history[i - 1].party.name) {
      partyChanges++;
    }
  }

  if (margins.length === 0) return "General";

  const avgMargin = margins.reduce((a, b) => a + b, 0) / margins.length;

  if (avgMargin < 5 && partyChanges >= 1) return "Battleground";
  if (avgMargin < 5) return "Competitive";
  if (avgMargin < 10 && partyChanges >= 1) return "Swing";
  if (avgMargin >= 15) return "Safe";
  if (avgMargin >= 10) return "Lean";

  return "Competitive";
}

/**
 * Determines the party leaning based on recent election winners.
 */
export function getPartyLeaning(history: ElectionHistory[]) {
  if (!history || history.length === 0) return "No data";

  const recentHistory = history.slice(0, 5);
  const partyCounts: Record<string, number> = {};

  recentHistory.forEach((h) => {
    const partyName = h.party.short_name || h.party.name;
    partyCounts[partyName] = (partyCounts[partyName] || 0) + 1;
  });

  const sortedParties = Object.entries(partyCounts).sort((a, b) => b[1] - a[1]);

  if (sortedParties.length === 0) return "No clear dominance";
  
  const [topParty, topCount] = sortedParties[0];
  
  if (topCount >= 4) return `${topParty}-Stronghold`;
  if (topCount >= 3) return `${topParty}-Leaning`;
  if (sortedParties.length > 1 && topCount === sortedParties[1][1]) return "Alliance-sensitive";
  
  return "Swing between parties";
}

/**
 * Determines the turnout trend by comparing recent elections.
 */
export function getTurnoutTrend(stats: VoterStats[]) {
  const conductedElections = (stats || []).filter(s => s.poll_percentage > 0);
  if (conductedElections.length < 2) return "Stable";

  const recent = conductedElections[0].poll_percentage;
  const previous = conductedElections[1].poll_percentage;
  const diff = recent - previous;

  if (Math.abs(diff) < 0.5) return "Stable";
  return diff > 0 ? "Increasing" : "Decreasing";
}

/**
 * Determines the elector profile based on gender distribution.
 */
export function getElectorProfile(stats: VoterStats[]) {
  const conductedElections = (stats || []).filter(s => s.poll_percentage > 0);
  if (conductedElections.length === 0) return "Balanced";
  
  const latest = conductedElections[0];
  if (!latest.male || !latest.female) return "Balanced";

  const diff = ((latest.female - latest.male) / latest.total_electors) * 100;

  if (Math.abs(diff) < 1) return "Balanced electorate";
  return diff > 0 ? "Female-led electorate" : "Male-led electorate";
}

/**
 * Determines political stability based on winning party change frequency.
 */
export function getPoliticalStability(history: ElectionHistory[]) {
  if (!history || history.length < 2) return "Stable";

  let changes = 0;
  for (let i = 1; i < history.length; i++) {
    if (history[i].party.name !== history[i - 1].party.name) {
      changes++;
    }
  }

  const changeRate = changes / (history.length - 1);

  if (changeRate > 0.6) return "High change";
  if (changeRate > 0.3) return "Moderate change";
  return "Stable";
}
