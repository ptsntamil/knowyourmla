import { PortfolioRepository } from "../repositories/portfolio.repository";
import { unstable_cache } from "next/cache";

export class PortfolioService {
  private portfolioRepo: PortfolioRepository;

  constructor(portfolioRepo?: PortfolioRepository) {
    this.portfolioRepo = portfolioRepo || new PortfolioRepository();
  }

  async getCabinetList(year: string = "2021") {
    return unstable_cache(
      async () => {
        const roster = await this.portfolioRepo.getCabinetRoster(year);
        if (!roster || !roster.ministers) {
          return [];
        }
        return roster.ministers;
      },
      ["cabinet-list", year],
      { revalidate: 86400, tags: ["cabinet"] }
    )();
  }

  async getCandidatePortfolios(candidateId: string) {
    return unstable_cache(
      async () => {
        const result = await this.portfolioRepo.getCandidatePortfolios(candidateId);
        if (!Array.isArray(result)) {
          return [];
        }
        return result;
      },
      ["candidate-portfolios", candidateId],
      { revalidate: 86400, tags: ["portfolios", candidateId] }
    )();
  }
}
