import { DynamoDBWrapper } from "../dynamodb";

export class SearchRepository {
  private personsTable: string;
  private constituenciesTable: string;
  private districtsTable: string;

  constructor() {
    this.personsTable = process.env.PERSONS_TABLE || "knowyourmla_persons";
    this.constituenciesTable = process.env.CONSTITUENCIES_TABLE || "knowyourmla_constituencies";
    this.districtsTable = process.env.DISTRICTS_TABLE || "knowyourmla_districts";
  }

  async searchPersons(query: string, limit: number = 7) {
    const wrapper = new DynamoDBWrapper(this.personsTable);
    const normalizedQuery = query.toLowerCase().replace(/[^a-z0-9]/g, "");
    
    // We use a scan with FilterExpression for partial matching.
    // For production scaling, this should be moved to OpenSearch or a GSI with better indexing.
    return await wrapper.scan({
      FilterExpression: "contains(normalized_name, :q)",
      ExpressionAttributeValues: {
        ":q": normalizedQuery,
      },
      Limit: limit,
      ProjectionExpression: "PK, SK, #n, normalized_name, image_url",
      ExpressionAttributeNames: {
        "#n": "name"
      }
    });
  }

  async searchConstituencies(query: string, limit: number = 7) {
    const wrapper = new DynamoDBWrapper(this.constituenciesTable);
    const normalizedQuery = query.toLowerCase().replace(/[^a-z0-9]/g, "");

    return await wrapper.scan({
      FilterExpression: "contains(normalized_name, :q)",
      ExpressionAttributeValues: {
        ":q": normalizedQuery,
      },
      Limit: limit,
      ProjectionExpression: "PK, #n, normalized_name, district_id",
      ExpressionAttributeNames: {
        "#n": "name"
      }
    });
  }

  async searchDistricts(query: string, limit: number = 7) {
    const wrapper = new DynamoDBWrapper(this.districtsTable);
    const normalizedQuery = query.toLowerCase().replace(/[^a-z0-9]/g, "");

    return await wrapper.scan({
      FilterExpression: "contains(normalized_name, :q)",
      ExpressionAttributeValues: {
        ":q": normalizedQuery,
      },
      Limit: limit,
      ProjectionExpression: "PK, #n, normalized_name",
      ExpressionAttributeNames: {
        "#n": "name"
      }
    });
  }
}
