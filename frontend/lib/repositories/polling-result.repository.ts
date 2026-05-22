import { DynamoDBWrapper } from "../dynamodb";

export interface PollingStationResult {
  PK: string;
  SK: string;
  constituency_id: string;
  polling_station_no: string;
  year: number;
  results: Record<string, {
    votes: number;
    vote_share_percentage: number;
    candidate_contribution_percentage: number;
  }>;
  valid_votes: number;
  nota_votes: number;
  rejected_votes?: number;
  total_votes_polled: number;
  total_electors?: number;
  created_at: number;
  ps_name?: string;
  polling_station_name?: string;
  electors?: number;
}


export interface ACSummary {
  PK: string;
  SK: string;
  constituency_id: string;
  candidate_totals: Record<string, number>;
  total_electors: number;
  poll_percentage: number;
  total_valid_votes: number;
  total_votes_polled: number;
}

export class PollingResultRepository {
  private client: DynamoDBWrapper;

  constructor(
    tableName: string = process.env.POLLING_RESULTS_TABLE || "knowyourmla_polling_results"
  ) {
    this.client = new DynamoDBWrapper(tableName);
  }

  /**
   * Fetches all polling station results for a constituency using ConstituencyIndex.
   */
  async getPollingResultsByConstituency(constituencyId: string, year: number): Promise<PollingStationResult[]> {
    const cid = constituencyId.startsWith("CONSTITUENCY#") ? constituencyId : `CONSTITUENCY#${constituencyId}`;
    
    return this.client.query({
      IndexName: "ConstituencyIndex",
      KeyConditionExpression: "constituency_id = :constituency_id",
      ExpressionAttributeValues: {
        ":constituency_id": cid,
      }
    }) as Promise<PollingStationResult[]>;
  }

  /**
   * Fetches a specific polling station result.
   */
  async getPollingStationDetail(constituencyId: string, year: number, psNo: string): Promise<PollingStationResult | null> {
    const cid = constituencyId.startsWith("CONSTITUENCY#") ? constituencyId : `CONSTITUENCY#${constituencyId.toLowerCase()}`;
    const pk = `${cid}#YEAR#${year}#PS#${psNo}`;
    
    try {
      return await this.client.get({
        Key: { PK: pk, SK: "METADATA" },
      }) as PollingStationResult;
    } catch (error) {
      console.error(`Error fetching polling station ${psNo} for ${cid}:`, error);
      return null;
    }
  }

  /**
   * Fetches the AC Summary for a constituency and year.
   */
  async getACSummary(constituencyId: string, year: number): Promise<ACSummary | null> {
    const cid = constituencyId.startsWith("CONSTITUENCY#") ? constituencyId : `CONSTITUENCY#${constituencyId.toLowerCase()}`;
    const pk = `${cid}#YEAR#${year}`;
    
    try {
      return await this.client.get({
        Key: { PK: pk, SK: "AC_SUMMARY" },
      }) as ACSummary;
    } catch (error) {
      console.error(`Error fetching AC Summary for ${cid}:`, error);
      return null;
    }
  }
  /**
   * Fetches the Postal Votes for a constituency and year.
   */
  async getPostalVotes(constituencyId: string, year: number): Promise<PollingStationResult | null> {
    const cid = constituencyId.split('#').pop()?.toLowerCase() || constituencyId.toLowerCase();
    const pk = `CONSTITUENCY#${cid}#YEAR#${year}`;
    
    try {
      return await this.client.get({
        Key: { PK: pk, SK: "POSTAL" },
      }) as PollingStationResult;
    } catch (error) {
      console.error(`Error fetching Postal Votes for ${cid}:`, error);
      return null;
    }
  }
}
