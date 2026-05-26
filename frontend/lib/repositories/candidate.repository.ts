import { DynamoDBWrapper } from "../dynamodb";

export class CandidateRepository {
  private client: DynamoDBWrapper;

  constructor(tableName: string = process.env.CANDIDATES_TABLE || "knowyourmla_candidates") {
    this.client = new DynamoDBWrapper(tableName);
  }

  /**
   * Fetches the election history for a person using PersonIndex.
   */
  async getPersonHistory(personId: string) {
    return this.client.query({
      IndexName: "PersonIndex",
      KeyConditionExpression: "person_id = :person_id",
      ExpressionAttributeValues: {
        ":person_id": personId,
      },
      // Projection: All necessary fields for the profile and analytics
      ProjectionExpression: "PK, person_id, candidate_name, constituency_id, party_id, #year, is_winner, is_resigned, winning_margin, margin_percentage, total_assets, assets, total_votes, vote_percent, criminal_cases, election_expenses, itr_history, income_itr, gold_assets, silver_assets, vehicle_assets, land_assets, education, profession, profile_pic, district_name, district_id",
      ExpressionAttributeNames: {
        "#year": "year",
      },
    });
  }

  /**
   * Fetches candidates by party using PartyIndex.
   */
  async getCandidatesByParty(partyId: string) {
    return this.client.query({
      IndexName: "PartyIndex",
      KeyConditionExpression: "party_id = :party_id",
      ExpressionAttributeValues: {
        ":party_id": partyId,
      },
      ProjectionExpression: "PK, person_id, candidate_name, constituency_id, party_id, #year, is_winner, is_resigned, total_assets, criminal_cases, education, profession, profile_pic, deposit_lost",
      ExpressionAttributeNames: {
        "#year": "year",
      },
    });
  }

  /**
   * Fetches candidates by party and optional year.
   */
  async getCandidatesByPartyAndYear(partyId: string, year?: number) {
    if (!year) {
      return this.getCandidatesByParty(partyId);
    }
    return this.client.query({
      IndexName: "PartyIndex",
      KeyConditionExpression: "party_id = :party_id AND #year = :year",
      ExpressionAttributeNames: {
        "#year": "year",
      },
      ExpressionAttributeValues: {
        ":party_id": partyId,
        ":year": year,
      },
      ProjectionExpression: "PK, person_id, candidate_name, constituency_id, party_id, #year, is_winner, is_resigned, total_assets, criminal_cases, education, profession, profile_pic, deposit_lost",
    });
  }

  /**
   * Fetches candidates for a specific constituency and year.
   */
  async getCandidatesByConstituencyAndYear(constituencyId: string, year: number) {
    return this.client.query({
      IndexName: "ConstituencyIndex",
      KeyConditionExpression: "constituency_id = :constituency_id",
      FilterExpression: "#year = :year",
      ExpressionAttributeNames: {
        "#year": "year",
      },
      ExpressionAttributeValues: {
        ":constituency_id": constituencyId,
        ":year": year,
      },
      ProjectionExpression: "PK, person_id, candidate_name, constituency_id, party_id, #year, is_winner, is_resigned, total_votes, vote_percent, total_assets, criminal_cases, education, profession, profile_pic, winning_margin, margin_percentage",
    });
  }
}
