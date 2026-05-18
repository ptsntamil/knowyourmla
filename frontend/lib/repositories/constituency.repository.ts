import { DynamoDBWrapper } from "../dynamodb";

export class ConstituencyRepository {
  private clientConstituency: DynamoDBWrapper;
  private clientCandidates: DynamoDBWrapper;
  private clientParties: DynamoDBWrapper;

  constructor(
    constituencyTable: string = process.env.CONSTITUENCIES_TABLE || "knowyourmla_constituencies",
    candidateTable: string = process.env.CANDIDATES_TABLE || "knowyourmla_candidates",
    partyTable: string = process.env.PARTIES_TABLE || "knowyourmla_political_parties"
  ) {
    this.clientConstituency = new DynamoDBWrapper(constituencyTable);
    this.clientCandidates = new DynamoDBWrapper(candidateTable);
    this.clientParties = new DynamoDBWrapper(partyTable);
  }

  /**
   * Fetches all constituencies (METADATA) using MetadataIndex.
   */
  async getAllConstituencies() {
    return this.clientConstituency.query({
      IndexName: "MetadataIndex",
      KeyConditionExpression: "SK = :sk",
      ExpressionAttributeValues: { ":sk": "METADATA" },
      // Minimal projection for listing constituencies
      ProjectionExpression: "PK, #name, normalized_name, district_id, #type, statistics",
      ExpressionAttributeNames: {
        "#name": "name",
        "#type": "type"
      }
    });
  }

  /**
   * Fetches constituencies within a district using DistrictIndex.
   */
  async getConstituenciesByDistrict(districtId: string) {
    return this.clientConstituency.query({
      IndexName: "DistrictIndex",
      KeyConditionExpression: "district_id = :district_id",
      ExpressionAttributeValues: {
        ":district_id": districtId,
      },
      ProjectionExpression: "PK, #name, normalized_name, district_id, #type, statistics",
      ExpressionAttributeNames: {
        "#name": "name",
        "#type": "type"
      }
    });
  }

  /**
   * Fetches winner history for a constituency.
   */
  async getWinnerHistory(constituencyId: string) {
    return this.clientCandidates.query({
      IndexName: "ConstituencyIndex",
      KeyConditionExpression: "constituency_id = :constituency_id",
      FilterExpression: "is_winner = :is_winner",
      ExpressionAttributeValues: {
        ":constituency_id": constituencyId,
        ":is_winner": true,
      },
      // Projection: Key details for historal winners list
      ProjectionExpression: "PK, person_id, candidate_name, party_id, #year, winning_margin, margin_percentage, constituency_id, total_assets, education, total_wins, profile_pic",
      ExpressionAttributeNames: {
        "#year": "year"
      }
    });
  }

  async getPartyById(partyId: string) {
    try {
      return this.clientParties.get({
        Key: { PK: partyId, SK: "METADATA" },
      });
    } catch (error) {
      console.error(`Error fetching party ${partyId}:`, error);
      return null;
    }
  }

  async getConstituencyMetadata(constituencyId: string) {
    try {
      return this.clientConstituency.get({
        Key: { PK: constituencyId, SK: "METADATA" },
      });
    } catch (error) {
      console.error(`Error fetching constituency metadata ${constituencyId}:`, error);
      return null;
    }
  }
}
