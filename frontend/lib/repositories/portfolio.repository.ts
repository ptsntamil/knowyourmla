import { DynamoDBWrapper } from "../dynamodb";

export class PortfolioRepository {
  private client: DynamoDBWrapper;

  constructor(tableName: string = process.env.PORTFOLIOS_TABLE || "knowyourmla_portfolios") {
    this.client = new DynamoDBWrapper(tableName);
  }

  /**
   * Fetches the pre-aggregated cabinet roster for a given year
   */
  async getCabinetRoster(year: string = "2021") {
    try {
      return await this.client.get({
        Key: { PK: `CABINET#${year}`, SK: "CURRENT_ROSTER" },
      });
    } catch (error) {
      console.error(`Error fetching cabinet roster for ${year}:`, error);
      return null;
    }
  }

  /**
   * Fetches portfolios for a specific candidate
   */
  async getCandidatePortfolios(candidateId: string) {
    try {
      return await this.client.query({
        IndexName: "CandidateIndex",
        KeyConditionExpression: "CandidateIndexPK = :pk",
        ExpressionAttributeValues: { ":pk": candidateId },
      });
    } catch (error) {
      console.error(`Error fetching portfolios for candidate ${candidateId}:`, error);
      return [];
    }
  }
}
