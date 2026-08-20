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

  async getMinisterProfileHistory(personId: string) {
    return unstable_cache(
      async () => {
        const result = await this.portfolioRepo.getMinistryHistory(personId);
        if (!Array.isArray(result)) {
          return [];
        }
        // Filter by entity type just to be safe
        return result.filter(item => item.entity_type === 'MINISTRY_HISTORY');
      },
      ["ministry-history", personId],
      { revalidate: 86400, tags: ["ministry", personId] }
    )();
  }

  async getPortfolioTimeline(portfolioName: string) {
    const normalizedName = portfolioName.toLowerCase().replace(/[^a-z0-9]/g, "");
    return unstable_cache(
      async () => {
        const result = await this.portfolioRepo.getPortfolioTimeline(normalizedName);
        if (!Array.isArray(result)) {
          return [];
        }
        return result;
      },
      ["portfolio-timeline", normalizedName],
      { revalidate: 86400, tags: ["portfolio", normalizedName] }
    )();
  }

  async getDepartmentHistory(departmentName: string) {
    const normalizedName = departmentName.toLowerCase().replace(/[^a-z0-9]/g, "");
    return unstable_cache(
      async () => {
        const result = await this.portfolioRepo.getDepartmentHistory(normalizedName);
        if (!Array.isArray(result)) {
          return [];
        }
        return result;
      },
      ["department-history", normalizedName],
      { revalidate: 86400, tags: ["department", normalizedName] }
    )();
  }
  async getAllPortfolios() {
    return unstable_cache(
      async () => {
        const result = await this.portfolioRepo.getAllPortfolios();
        return Array.isArray(result) ? result : [];
      },
      ["all-portfolios"],
      { revalidate: 86400, tags: ["portfolios"] }
    )();
  }

  async getAllDepartments() {
    return unstable_cache(
      async () => {
        const result = await this.portfolioRepo.getAllDepartments();
        return Array.isArray(result) ? result : [];
      },
      ["all-departments"],
      { revalidate: 86400, tags: ["departments"] }
    )();
  }
}
