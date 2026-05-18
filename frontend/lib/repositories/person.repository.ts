import { DynamoDBWrapper, ddbDocClient } from "../dynamodb";
import { BatchGetCommand } from "@aws-sdk/lib-dynamodb";

export class PersonRepository {
  private client: DynamoDBWrapper;
  private tableName: string;

  constructor(tableName: string = process.env.PERSONS_TABLE || "knowyourmla_persons") {
    this.client = new DynamoDBWrapper(tableName);
    this.tableName = tableName;
  }

  async getPersonById(personId: string) {
    const response = await this.client.query({
      KeyConditionExpression: "PK = :pk AND SK = :sk",
      ExpressionAttributeValues: {
        ":pk": personId,
        ":sk": "METADATA",
      },
    });

    return response.length > 0 ? response[0] : null;
  }

  async getPersonByNormalizedName(normalizedName: string) {
    const response = await this.client.query({
      IndexName: "NameIndex",
      KeyConditionExpression: "normalized_name = :normalized_name",
      ExpressionAttributeValues: {
        ":normalized_name": normalizedName,
      },
    });

    if (response.length > 0) {
      const metadataRecords = response.filter((r: any) => r.SK === "METADATA");
      return metadataRecords.length > 0 ? metadataRecords[0] : response[0];
    }
    return null;
  }

  async getPersonsByIds(personIds: string[]) {
    if (!personIds || personIds.length === 0) return [];

    const keys = personIds
      .filter((pid) => pid)
      .map((pid) => ({ PK: pid, SK: "METADATA" }));

    const results: any[] = [];
    // DynamoDB BatchGetItem limit is 100
    for (let i = 0; i < keys.length; i += 100) {
      const chunk = keys.slice(i, i + 100);
      try {
        let unprocessedKeys = {
          [this.tableName]: {
            Keys: chunk,
          },
        };

        while (unprocessedKeys && Object.keys(unprocessedKeys).length > 0) {
          const command: any = new BatchGetCommand({
            RequestItems: unprocessedKeys,
          });
          const response: any = await ddbDocClient.send(command);
          if (response.Responses && response.Responses[this.tableName]) {
            results.push(...response.Responses[this.tableName]);
          }
          unprocessedKeys = response.UnprocessedKeys || {};
        }
      } catch (error) {
        console.error("Error in getPersonsByIds batch get:", error);
      }
    }

    return results;
  }
}
