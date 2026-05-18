import { CandidateRepository } from "../repositories/candidate.repository";
import { CandidateHistoryResponse } from "@/types/models";

export class CandidateService {
  private repository: CandidateRepository;

  constructor(repository?: CandidateRepository) {
    this.repository = repository || new CandidateRepository();
  }

  async getCandidateHistory(personId: string): Promise<CandidateHistoryResponse> {
    const rawHistory = await this.repository.getPersonHistory(personId);

    const historyRecords = rawHistory.map((h: any) => ({
      year: parseInt(h.year || "0"),
      constituency: (h.constituency_id || "").replace("CONSTITUENCY#", ""),
      party: (h.party_id || "").replace("PARTY#", "").toUpperCase(),
      winner: Boolean(h.is_winner),
    }));

    return {
      person_id: personId,
      history: historyRecords,
    };
  }
}
