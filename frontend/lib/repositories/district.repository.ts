import { DynamoDBWrapper } from "../dynamodb";

export class DistrictRepository {
  private client: DynamoDBWrapper;

  constructor(tableName: string = process.env.DISTRICTS_TABLE || "knowyourmla_districts") {
    this.client = new DynamoDBWrapper(tableName);
  }

  async getAllDistricts() {
    return this.client.scan({
      FilterExpression: "SK = :sk",
      ExpressionAttributeValues: { ":sk": "METADATA" },
    });
  }

  async getDistrictById(districtId: string) {
    try {
      return this.client.get({
        Key: { PK: districtId, SK: "METADATA" },
      });
    } catch (error) {
      console.error(`Error fetching district ${districtId}:`, error);
      return null;
    }
  }
}
