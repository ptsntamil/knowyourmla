import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { 
  DynamoDBDocumentClient, 
  QueryCommand, 
  ScanCommand, 
  GetCommand,
  QueryCommandInput,
  ScanCommandInput,
  GetCommandInput
} from "@aws-sdk/lib-dynamodb";

const REGION = process.env.AWS_REGION || "ap-south-2";

const client = new DynamoDBClient({
  region: REGION,
});

export const ddbDocClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

export class DynamoDBWrapper {
  private tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  async query(params: Omit<QueryCommandInput, "TableName">) {
    const items: any[] = [];
    let lastEvaluatedKey: Record<string, any> | undefined;

    do {
      const command = new QueryCommand({
        ...params,
        TableName: this.tableName,
        ExclusiveStartKey: lastEvaluatedKey,
      });

      const response = await ddbDocClient.send(command);
      items.push(...(response.Items || []));
      lastEvaluatedKey = response.LastEvaluatedKey;
    } while (lastEvaluatedKey);

    return items;
  }

  async scan(params: Omit<ScanCommandInput, "TableName"> = {}) {
    const items: any[] = [];
    let lastEvaluatedKey: Record<string, any> | undefined;

    do {
      const command = new ScanCommand({
        ...params,
        TableName: this.tableName,
        ExclusiveStartKey: lastEvaluatedKey,
      });

      const response = await ddbDocClient.send(command);
      items.push(...(response.Items || []));
      lastEvaluatedKey = response.LastEvaluatedKey;
    } while (lastEvaluatedKey);

    return items;
  }

  async get(params: Omit<GetCommandInput, "TableName">) {
    const command = new GetCommand({
      ...params,
      TableName: this.tableName,
    });

    const response = await ddbDocClient.send(command);
    return response.Item;
  }
}
