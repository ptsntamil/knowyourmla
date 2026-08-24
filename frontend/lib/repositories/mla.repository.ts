import { DynamoDBWrapper } from "../dynamodb";
import { ElectionRepository } from "./election.repository";

export class MLARepository {
  private client: DynamoDBWrapper;
  private electionRepo: ElectionRepository;

  constructor(tableName: string = process.env.CANDIDATES_TABLE || "knowyourmla_candidates") {
    this.client = new DynamoDBWrapper(tableName);
    this.electionRepo = new ElectionRepository();
  }

  /**
   * Fetches all winners for a specific year using YearIndex.
   * PK: year = year, Filter: is_winner = true
   */
  async getWinnersByYear(year: number) {
    return this.client.query({
      IndexName: "YearIndex",
      KeyConditionExpression: "#year = :year",
      FilterExpression: "is_winner = :winner",
      ExpressionAttributeNames: {
        "#year": "year",
      },
      ExpressionAttributeValues: {
        ":winner": true,
        ":year": year,
      },
      ProjectionExpression: "PK, person_id, candidate_name, constituency_id, party_id, #year, winning_margin, total_votes, total_assets, education, total_wins, margin_percentage, profile_pic, is_resigned",
    });
  }

  /**
   * Fetches all winners for a specific year including vehicle_assets.
   */
  async getWinnersWithVehiclesByYear(year: number) {
    return this.client.query({
      IndexName: "YearIndex",
      KeyConditionExpression: "#year = :year",
      FilterExpression: "is_winner = :winner",
      ExpressionAttributeNames: {
        "#year": "year",
      },
      ExpressionAttributeValues: {
        ":winner": true,
        ":year": year,
      },
      ProjectionExpression: "PK, person_id, candidate_name, constituency_id, party_id, #year, vehicle_assets, profile_pic, is_resigned",
    });
  }

  /**
   * Fetches winners within a year range. 
   * Note: Queries only valid election years dynamically fetched from the elections table.
   */
  async getWinnersByYearRange(startYear: number, endYear: number) {
    const allElections = await this.electionRepo.getAllElections();
    
    // Filter for Assembly elections to isolate relevant years (includes bye-elections if defined)
    const validYears = Array.from(new Set(
      allElections
        .filter(e => e.type === "Assembly")
        .map(e => e.year)
    ));

    let targetYears = validYears.filter(y => y >= startYear && y <= endYear);

    // Fallback if the elections table is empty or missing data
    if (targetYears.length === 0) {
      targetYears = [startYear];
    }

    const results = await Promise.all(targetYears.map(y => this.getWinnersByYear(y)));
    return results.flat();
  }

  /**
   * Fetches all candidates for a specific year using YearIndex.
   */
  async getAllCandidatesByYear(year: number) {
    return this.client.query({
      IndexName: "YearIndex",
      KeyConditionExpression: "#year = :year",
      ExpressionAttributeNames: {
        "#year": "year",
      },
      ExpressionAttributeValues: {
        ":year": year,
      },
      ProjectionExpression: "PK, person_id, candidate_name, constituency_id, party_id, #year, is_winner, is_resigned, total_votes, vote_percent, turnout_percent, total_assets, total_liabilities, age, sex, winning_margin, district_id, constituency_name, district_name, profile_pic, education, criminal_cases, profession, is_incumbent, new_comer, is_star_canidate, is_star_candidate, author_foused, author_focused, deposit_lost",
    });
  }

  /**
   * Fetches candidates for a specific constituency and year.
   */
  async getCandidatesByConstituencyAndYear(constituencyId: string, year: number) {
    return this.client.query({
      IndexName: "ConstituencyIndex",
      KeyConditionExpression: "constituency_id = :cid",
      FilterExpression: "#year = :year",
      ExpressionAttributeNames: {
        "#year": "year",
      },
      ExpressionAttributeValues: {
        ":cid": constituencyId,
        ":year": year,
      },
      // Projection: Slightly more detail for constituency-level candidate list
      ProjectionExpression: "PK, person_id, candidate_name, constituency_id, party_id, #year, is_winner, is_resigned, total_assets, criminal_cases, education, profile_pic, winning_margin, total_votes, is_incumbent, new_comer",
    });
  }
}
