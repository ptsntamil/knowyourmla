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

  /**
   * Fetches the ministry history for a person
   */
  async getMinistryHistory(personId: string) {
    try {
      return await this.client.query({
        IndexName: "CandidateIndex",
        KeyConditionExpression: "CandidateIndexPK = :pk",
        ExpressionAttributeValues: { ":pk": personId },
      });
    } catch (error) {
      console.error(`Error fetching ministry history for ${personId}:`, error);
      return [];
    }
  }

  /**
   * Fetches the historical timeline for a specific portfolio
   */
  async getPortfolioTimeline(normalizedName: string) {
    try {
      return await this.client.query({
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :skPrefix)",
        ExpressionAttributeValues: {
          ":pk": `PORTFOLIO#${normalizedName}`,
          ":skPrefix": "PORTFOLIO_HISTORY#",
        },
      });
    } catch (error) {
      console.error(`Error fetching portfolio timeline for ${normalizedName}:`, error);
      return [];
    }
  }

  /**
   * Fetches the history of a department
   */
  async getDepartmentHistory(normalizedName: string) {
    try {
      return await this.client.query({
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :skPrefix)",
        ExpressionAttributeValues: {
          ":pk": `DEPARTMENT#${normalizedName}`,
          ":skPrefix": "HISTORY#",
        },
      });
    } catch (error) {
      console.error(`Error fetching department history for ${normalizedName}:`, error);
      return [];
    }
  }
  /**
   * Fetches all portfolio metadata records
   */
  async getAllPortfolios() {
    try {
      return await this.client.scan({
        FilterExpression: "begins_with(PK, :pkPrefix) AND SK = :sk",
        ExpressionAttributeValues: {
          ":pkPrefix": "PORTFOLIO#",
          ":sk": "METADATA",
        },
      });
    } catch (error) {
      console.error(`Error fetching all portfolios:`, error);
      return [];
    }
  }

  /**
   * Fetches all department metadata records
   */
  async getAllDepartments() {
    try {
      return await this.client.scan({
        FilterExpression: "begins_with(PK, :pkPrefix) AND SK = :sk",
        ExpressionAttributeValues: {
          ":pkPrefix": "DEPARTMENT#",
          ":sk": "METADATA",
        },
      });
    } catch (error) {
      console.error(`Error fetching all departments:`, error);
      return [];
    }
  }
}
