import { MLARepository } from "../repositories/mla.repository";
import { ElectionResponse } from "@/types/models";

// Reusing MLARepository or creating a dedicated ElectionRepository if needed. 
// However, based on backend/app/services/election_service.py, it uses ElectionRepository.
// I'll check if I implemented ElectionRepository. I didn't. I'll need it.

import { DynamoDBWrapper } from "../dynamodb";

export class ElectionRepository {
  private client: DynamoDBWrapper;

  constructor(tableName: string = process.env.ELECTIONS_TABLE || "knowyourmla_elections") {
    this.client = new DynamoDBWrapper(tableName);
  }

  async getAllElections() {
    return this.client.scan();
  }

  async getElectionById(electionId: string) {
    return this.client.get({
      Key: { PK: electionId, SK: "METADATA" },
    });
  }
}

export class ElectionService {
  private repository: ElectionRepository;

  constructor(repository?: ElectionRepository) {
    this.repository = repository || new ElectionRepository();
  }

  async listElections(): Promise<ElectionResponse[]> {
    const rawElections = await this.repository.getAllElections();
    rawElections.sort((a, b) => parseInt(b.year || "0") - parseInt(a.year || "0"));

    return rawElections.map((item: any) => ({
      id: item.PK,
      year: parseInt(item.year || "0"),
      type: item.type,
      category: item.category,
    }));
  }

  async getElection(electionId: string): Promise<ElectionResponse | null> {
    const item = await this.repository.getElectionById(electionId);
    if (!item) return null;

    return {
      id: item.PK,
      year: parseInt(item.year || "0"),
      type: item.type,
      category: item.category,
    };
  }
}
