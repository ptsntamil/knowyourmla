import { DynamoDBWrapper } from "../dynamodb";

export interface ElectionRecord {
  PK: string;
  SK: string;
  year: number;
  type: string;
  category: string;
  created_at: number;
}

export class ElectionRepository {
  private client: DynamoDBWrapper;

  constructor(tableName: string = process.env.ELECTIONS_TABLE || "knowyourmla_elections") {
    this.client = new DynamoDBWrapper(tableName);
  }

  async getAllElections(): Promise<ElectionRecord[]> {
    return this.client.scan();
  }

  async getElectionByYear(year: number, type: string = "Assembly", category: string = "General"): Promise<ElectionRecord | null> {
    const pk = `ELECTION#${year}#${type.toUpperCase()}#${category.toUpperCase()}`;
    const result = await this.client.get({
      Key: { PK: pk, SK: "METADATA" },
    });
    return (result as ElectionRecord) || null;
  }
}
