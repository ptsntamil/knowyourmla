import { ExpenditureRepository } from "../repositories/expenditure-repository";
import { ExpenditureReport, ExpenditureCategory } from "../../types/models";
import { unstable_cache } from "next/cache";

export class ExpenditureService {
  static getElectionExpenditureReport = unstable_cache(
    async (electionId: string, partyId: string): Promise<ExpenditureReport | null> => {
      return await ExpenditureRepository.getReportByParty(electionId, partyId);
    },
    ["expenditure-report"],
    { revalidate: 3600 }
  );

  static getAllElectionExpenditureReports = unstable_cache(
    async (electionId: string): Promise<ExpenditureReport[]> => {
      return await ExpenditureRepository.getAllReports(electionId);
    },
    ["all-expenditure-reports"],
    { revalidate: 3600 }
  );

  static extractCategories(reports: ExpenditureReport[], categoryName: string): any[] {
    return reports.map(report => {
      const cat = report.categories?.find(c => c.category_name === categoryName);
      return {
        party_short: report.party_short,
        party_slug: report.party_id.replace("PARTY#", ""),
        report_scope: report.report_scope,
        source_type: report.source_type,
        amount_rs: cat?.amount_rs ?? null,
        ratio_of_total_pct: cat?.ratio_of_total_pct ?? null,
        ratio_of_general_propaganda_pct: cat?.ratio_of_general_propaganda_pct ?? null,
        reported_or_calculated: cat?.reported_or_calculated ?? "NOT_DISCLOSED"
      };
    });
  }
}
