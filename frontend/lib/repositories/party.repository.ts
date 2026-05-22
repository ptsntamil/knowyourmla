import { DynamoDBWrapper } from "../dynamodb";

export class PartyRepository {
  private client: DynamoDBWrapper;

  constructor(tableName: string = process.env.PARTIES_TABLE || "knowyourmla_political_parties") {
    this.client = new DynamoDBWrapper(tableName);
  }

  /**
   * Fetches all political parties (METADATA) using MetadataIndex.
   */
  async getAllParties() {
    return this.client.query({
      IndexName: "MetadataIndex",
      KeyConditionExpression: "SK = :sk",
      ExpressionAttributeValues: { ":sk": "METADATA" },
      ProjectionExpression: "PK, #name, short_name, logo_url, color_bg, color_text, color_border, vote_share",
      ExpressionAttributeNames: {
        "#name": "name"
      }
    });
  }

  async getPartyById(partyId: string) {
    let pk = partyId;
    if (!pk.startsWith("PARTY#")) {
      pk = `PARTY#${pk}`;
    }

    try {
      return this.client.get({
        Key: { PK: pk, SK: "METADATA" },
      });
    } catch (error) {
      console.error(`Error fetching party ${pk}:`, error);
      return null;
    }
  }

  /**
   * Attempts to resolve a party by its slug using direct ID lookups.
   * Returns null if it cannot be found directly.
   */
  async getPartyBySlugDirect(slug: string) {
    const normalizedSlug = slug.toLowerCase().replace(/[^a-z0-9]/g, "");
    
    // 1. Try direct PK lookup with normalized slug
    const direct = await this.getPartyById(`PARTY#${normalizedSlug}`);
    if (direct) return direct;

    // 2. Try exact uppercase short name (common PK pattern: PARTY#DMK)
    const upperShort = await this.getPartyById(`PARTY#${slug.toUpperCase()}`);
    if (upperShort) return upperShort;

    return null;
  }
}
