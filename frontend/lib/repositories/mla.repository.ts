import { DynamoDBWrapper } from "../dynamodb";

export class MLARepository {
  private client: DynamoDBWrapper;

  constructor(tableName: string = process.env.CANDIDATES_TABLE || "knowyourmla_candidates") {
    this.client = new DynamoDBWrapper(tableName);
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
      ProjectionExpression: "PK, person_id, candidate_name, constituency_id, party_id, #year, winning_margin, total_votes, total_assets, education, total_wins, margin_percentage, profile_pic",
    });
  }

  /**
   * Fetches winners within a year range. 
   * Note: Since year is Partition Key in YearIndex, we query each year.
   */
  async getWinnersByYearRange(startYear: number, endYear: number) {
    const years = [];
    for (let y = startYear; y <= endYear; y++) {
      years.push(y);
    }

    const results = await Promise.all(years.map(y => this.getWinnersByYear(y)));
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
      ProjectionExpression: "PK, person_id, candidate_name, constituency_id, party_id, #year, is_winner, total_votes, vote_percent, turnout_percent, total_assets, total_liabilities, age, sex, winning_margin, district_id, constituency_name, district_name, profile_pic, education, criminal_cases, profession, is_incumbent, new_comer, is_star_canidate, is_star_candidate, author_foused, author_focused, deposit_lost",
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
      ProjectionExpression: "PK, person_id, candidate_name, constituency_id, party_id, #year, is_winner, total_assets, criminal_cases, education, profile_pic, winning_margin, total_votes, is_incumbent, new_comer",
    });
  }
}
