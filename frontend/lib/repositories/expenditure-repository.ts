import { DynamoDBWrapper, ddbDocClient } from "../dynamodb";
import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { ExpenditureReport, ExpenditureCategory } from "../../types/models";

const EXPENDITURE_TABLE = "knowyourmla_election_expenditures";
const wrapper = new DynamoDBWrapper(EXPENDITURE_TABLE);

export class ExpenditureRepository {
  static async getReportByParty(electionId: string, partyId: string): Promise<ExpenditureReport | null> {
    const pk = `EXPENDITURE#${electionId}#${partyId}`;
    
    const command = new QueryCommand({
      TableName: EXPENDITURE_TABLE,
      KeyConditionExpression: "PK = :pk",
      ExpressionAttributeValues: {
        ":pk": pk,
      },
    });

    const response = await ddbDocClient.send(command);
    
    if (!response.Items || response.Items.length === 0) {
      return null;
    }

    const report = response.Items.find(item => item.SK === "REPORT") as ExpenditureReport;
    if (!report) return null;

    const categories = response.Items.filter(item => item.SK.startsWith("CATEGORY#")) as ExpenditureCategory[];
    report.categories = categories;

    return report;
  }

  static async getAllReports(electionId: string): Promise<ExpenditureReport[]> {
    // We could use a GSI, but for this implementation we'll fetch known parties
    // or we'd need a GSI on election_id. Let's assume we fetch by known party IDs for TN 2026.
    const partyIds = [
      "PARTY#dmk", 
      "PARTY#aiadmk", 
      "PARTY#bjp", 
      "PARTY#ntk", 
      "PARTY#bsp", 
      "PARTY#cpim", 
      "PARTY#cpimlliberation", 
      "PARTY#tvk"
    ];

    const promises = partyIds.map(partyId => this.getReportByParty(electionId, partyId));
    const results = await Promise.all(promises);
    
    return results.filter((report): report is ExpenditureReport => report !== null);
  }
}
