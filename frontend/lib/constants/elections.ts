export const AVAILABLE_ELECTION_YEARS = ['202610', '2026', '2021', '2016', '2011'];
export const LATEST_ELECTION_YEAR = '2026';
export const PREVIOUS_ELECTION_YEAR = '2021';
export const LAST_COMPLETED_ELECTION_YEAR = '2026';
export const CURRENT_ASSEMBLY_TERM = '2026–2031';

export const ELECTION_LABELS: Record<string, string> = {
  '202610': '2026 Bye-Election',
  '2026': '2026 Assembly',
  '2021': '2021 Assembly',
  '2016': '2016 Assembly',
  '2011': '2011 Assembly',
};

export function formatHistoryTerm(year: number, newerYear?: number): string {
  if (year === 202610) {
    return "2026 (Oct - Present)";
  }
  if (year === 2026 && newerYear === 202610) {
    return "2026 (May - Oct)";
  }
  return `${year}`;
}

export function getAssemblyPeriod(yearCode: number): string {
  const y = parseInt(yearCode.toString().substring(0, 4));
  const generalYears = [2026, 2021, 2016, 2011];
  
  let baseYear = generalYears[generalYears.length - 1];
  for (const gy of generalYears) {
    if (y >= gy) {
      baseYear = gy;
      break;
    }
  }
  
  return `${baseYear}-${baseYear + 5}`;
}
