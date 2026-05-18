/**
 * Interface for transformed vote share entry
 */
export interface VoteShareEntry {
  year: number;
  votes: number;
  voteShare: number;
}

/**
 * Transforms the raw vote share object from party data into a sorted array.
 * 
 * @param voteShareObj - The vote share object (e.g., party.vote_share.assembly)
 * @returns Sorted array of VoteShareEntry
 */
export function transformVoteShareHistory(voteShareObj: any): VoteShareEntry[] {
  if (!voteShareObj || typeof voteShareObj !== 'object') {
    return [];
  }

  return Object.entries(voteShareObj)
    .map(([year, data]: [string, any]) => ({
      year: parseInt(year),
      votes: data.votes || 0,
      voteShare: data.vote_share_percent || 0,
    }))
    .sort((a, b) => a.year - b.year);
}
