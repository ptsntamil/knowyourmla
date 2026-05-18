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
   * Resolves a party by its slug.
   * Priority: Direct PK -> MetadataIndex Search.
   */
  async getPartyBySlug(slug: string) {
    const normalizedSlug = slug.toLowerCase().replace(/[^a-z0-9]/g, "");
    
    // 1. Try direct PK lookup with normalized slug
    const direct = await this.getPartyById(`PARTY#${normalizedSlug}`);
    if (direct) return direct;

    // 2. Try exact uppercase short name (common PK pattern: PARTY#DMK)
    const upperShort = await this.getPartyById(`PARTY#${slug.toUpperCase()}`);
    if (upperShort) return upperShort;

    // 3. Fallback: Query via MetadataIndex and match in-memory (limited volume)
    const all = await this.getAllParties();
    return all.find(p => {
      const pNameNorm = (p.name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      const pShortNorm = (p.short_name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      const pSlugNorm = (p.slug || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      return pNameNorm === normalizedSlug || pShortNorm === normalizedSlug || pSlugNorm === normalizedSlug;
    }) || null;
  }
}
