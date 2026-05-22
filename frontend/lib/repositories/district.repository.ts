import { DynamoDBWrapper } from "../dynamodb";

export class DistrictRepository {
  private client: DynamoDBWrapper;

  constructor(tableName: string = process.env.DISTRICTS_TABLE || "knowyourmla_districts") {
    this.client = new DynamoDBWrapper(tableName);
  }

  /**
   * Fetches all districts using MetadataIndex GSI.
   *
   * Uses QueryCommand against MetadataIndex (SK = METADATA) instead of a
   * full-table ScanCommand. The GSI is already provisioned in Terraform.
   * ProjectionExpression limits transfer to only the fields consumed by
   * DistrictService and StateService.
   */
  async getAllDistricts() {
    return this.client.query({
      IndexName: "MetadataIndex",
      KeyConditionExpression: "SK = :sk",
      ExpressionAttributeValues: { ":sk": "METADATA" },
      ProjectionExpression:
        "PK, #name, normalized_name, alias, state_id, total_constituencies, image_url, description",
      ExpressionAttributeNames: {
        "#name": "name",
      },
    });
  }

  /**
   * Fetches a single district by its PK using GetItem.
   *
   * @param districtId - The full PK value, e.g. "DISTRICT#chennai".
   * @returns The district item or null if not found.
   */
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
