import { MLARepository } from "../repositories/mla.repository";
import { ElectionResponse } from "@/types/models";
import { DynamoDBWrapper } from "../dynamodb";
import { unstable_cache } from "next/cache";

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
    return unstable_cache(
      async (): Promise<ElectionResponse[]> => {
        const rawElections = await this.repository.getAllElections();
        rawElections.sort((a, b) => parseInt(b.year || "0") - parseInt(a.year || "0"));

        return rawElections.map((item: any) => ({
          id: item.PK,
          year: parseInt(item.year || "0"),
          type: item.type,
          category: item.category,
        }));
      },
      ["all-elections-list"],
      { revalidate: 86400, tags: ["elections"] }
    )();
  }

  async getElection(electionId: string): Promise<ElectionResponse | null> {
    return unstable_cache(
      async (eId: string): Promise<ElectionResponse | null> => {
        const item = await this.repository.getElectionById(eId);
        if (!item) return null;

        return {
          id: item.PK,
          year: parseInt(item.year || "0"),
          type: item.type,
          category: item.category,
        };
      },
      ["election-by-id", electionId],
      { revalidate: 86400, tags: [`election-${electionId}`] }
    )(electionId);
  }
}
