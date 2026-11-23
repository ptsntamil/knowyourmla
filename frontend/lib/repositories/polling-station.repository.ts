import { DynamoDBWrapper } from "../dynamodb";
import { getAcNoFromSlug } from "../utils/constituency-ac-map";

export interface PollingStationBuilding {
  name: string;
  category: string;
  management?: string;
  wing_portion?: string;
  facing?: string;
  room_no?: string | null;
  location?: string | null;
  pincode?: string | null;
  raw_text?: string;
}

export interface PollingAreaDetail {
  area_no: number;
  raw_text?: string;
  local_body_name?: string;
  local_body_type?: string;
  is_revenue_village?: boolean;
  locality?: string;
  ward_nos?: string[];
  door_from?: string | null;
  door_to?: string | null;
  local_body_canonical?: string;
  local_body_id?: string;
  locality_id?: string;
}

export interface PollingStationFilters {
  pincodes?: string[];
  local_body_ids?: string[];
  rv_ids?: string[];
  ward_nos?: string[];
  ward_keys?: string[];
  locality_ids?: string[];
  building_category?: string;
}

export interface PollingStationMaster {
  PK?: string;
  SK?: string;
  entity?: string;
  entity_type?: string;
  constituency_id?: string;
  ac_no?: number;
  ac_name?: string;
  pc_no?: number;
  pc_name?: string;
  pc_category?: string;
  ps_no: number;
  ps_no_suffix?: string | null;
  polling_station_no: string;
  sl_no?: number;
  station_type?: string;
  has_overseas_electors?: boolean;
  building: PollingStationBuilding;
  areas?: PollingAreaDetail[];
  filters?: PollingStationFilters;
  search_text?: string;
  pincode?: string | null;
  wards?: string[];
  local_bodies?: string[];
  localities?: string[];
  polling_areas?: PollingAreaDetail[];
  search_keywords?: string[];
  created_at?: number;
}

export interface LocalBodyLookup {
  id: string;
  names: string[];
  types?: string[];
  is_revenue_village?: boolean;
  wards: string[];
  pincodes: string[];
  station_nos: number[];
}

export interface PollingStationLookups {
  pincodes: Record<string, number[]>;
  building_categories?: string[];
  local_bodies: LocalBodyLookup[];
  wards: Record<string, Record<string, number[]>>;
  localities: Record<string, number[]>;
  overseas_station_nos?: number[];
}

export interface PollingStationBundle {
  schema_version?: string;
  meta: {
    state_code?: string;
    state_name?: string;
    ac_no: number;
    ac_name: string;
    pc_no?: number;
    pc_name?: string;
    pc_category?: string;
    source_file?: string;
    total_stations?: number;
  };
  summary?: Record<string, unknown>;
  lookups: PollingStationLookups;
  stations: PollingStationMaster[];
}

interface RawDynamoStationItem {
  SK?: string;
  PK?: string;
  entity?: string;
  ps_no?: number;
  polling_station_no?: string;
  state_code?: string;
  state_name?: string;
  ac_name?: string;
  pc_no?: number;
  pc_name?: string;
  pc_category?: string;
  id?: string;
  name?: string;
  names?: string[];
  types?: string[];
  is_revenue_village?: boolean;
  wards?: string[];
  pincodes?: string[];
  pincode?: string;
  station_nos?: number[];
  filters?: {
    ward_keys?: string[];
    locality_ids?: string[];
    pincodes?: string[];
    local_body_ids?: string[];
  };
  building?: PollingStationBuilding;
  areas?: PollingAreaDetail[];
  [key: string]: unknown;
}

export class PollingStationRepository {
  private client: DynamoDBWrapper;

  constructor(
    tableName: string = process.env.POLLING_STATIONS_TABLE || "knowyourmla_polling_stations"
  ) {
    this.client = new DynamoDBWrapper(tableName);
  }

  /**
   * Fetches all polling stations for a given constituency using ConstituencyIndex.
   */
  async getStationsByConstituency(constituencySlug: string): Promise<PollingStationMaster[]> {
    const slug = constituencySlug.replace(/^CONSTITUENCY#/i, "").toLowerCase();
    const cid = `CONSTITUENCY#${slug}`;

    return this.client.query({
      IndexName: "ConstituencyIndex",
      KeyConditionExpression: "constituency_id = :constituency_id",
      ExpressionAttributeValues: {
        ":constituency_id": cid,
      },
    }) as Promise<PollingStationMaster[]>;
  }

  /**
   * Fetches the complete constituency polling station bundle (meta, lookups, and stations).
   * Follows DB_README.md & scraper/helper/polling_station_details.md schema.
   * Queries DynamoDB knowyourmla_polling_stations, with graceful local JSON fallback.
   */
  async getConstituencyBundle(
    constituencySlug: string,
    acNo?: number | null
  ): Promise<PollingStationBundle | null> {
    const slug = constituencySlug.replace(/^CONSTITUENCY#/i, "").toLowerCase();
    const resolvedAcNo = acNo || getAcNoFromSlug(slug);

    if (resolvedAcNo) {
      const paddedAc = String(resolvedAcNo).padStart(3, "0");
      const pk = `AC#TN#${paddedAc}`;

      // 1. Try querying DynamoDB knowyourmla_polling_stations
      try {
        const items = (await this.client.query({
          KeyConditionExpression: "PK = :pk",
          ExpressionAttributeValues: {
            ":pk": pk,
          },
        })) as RawDynamoStationItem[];

        if (items && items.length > 0) {
          const metaItem = items.find((i: RawDynamoStationItem) => i.SK === "META" || i.entity === "AC_META");
          const stationItems = items
            .filter((i: RawDynamoStationItem) => i.SK?.startsWith("PS#") && (i.entity === "STATION" || !i.SK.includes("#STATS")))
            .sort((a: RawDynamoStationItem, b: RawDynamoStationItem) => (a.ps_no || 0) - (b.ps_no || 0));

          if (stationItems.length > 0) {
            const localBodyItems: LocalBodyLookup[] = items
              .filter((i: RawDynamoStationItem) => i.SK?.startsWith("LB#") || i.entity === "LOCAL_BODY")
              .map((i: RawDynamoStationItem) => ({
                id: i.id || (i.SK ? i.SK.replace("LB#", "") : ""),
                names: i.names || [i.name || i.id || ""],
                types: i.types || [],
                is_revenue_village: i.is_revenue_village ?? true,
                wards: i.wards || [],
                pincodes: i.pincodes || [],
                station_nos: i.station_nos || [],
              }));

            const pincodeItems = items.filter((i: RawDynamoStationItem) => i.SK?.startsWith("PIN#") || i.entity === "PINCODE");
            const pincodesMap: Record<string, number[]> = {};
            pincodeItems.forEach((pi: RawDynamoStationItem) => {
              const pin = pi.pincode || (pi.SK ? pi.SK.replace("PIN#", "") : "");
              pincodesMap[pin] = pi.station_nos || [];
            });

            const wardsMap: Record<string, Record<string, number[]>> = {};
            const localitiesMap: Record<string, number[]> = {};

            stationItems.forEach((st: RawDynamoStationItem) => {
              const pNo = st.ps_no || (st.polling_station_no ? parseInt(st.polling_station_no, 10) : 0);
              if (st.filters?.ward_keys) {
                st.filters.ward_keys.forEach((wk: string) => {
                  const [lbId, wNo] = wk.split("#");
                  if (lbId && wNo) {
                    if (!wardsMap[lbId]) wardsMap[lbId] = {};
                    if (!wardsMap[lbId][wNo]) wardsMap[lbId][wNo] = [];
                    if (!wardsMap[lbId][wNo].includes(pNo)) wardsMap[lbId][wNo].push(pNo);
                  }
                });
              }
              if (st.filters?.locality_ids) {
                st.filters.locality_ids.forEach((locId: string) => {
                  if (!localitiesMap[locId]) localitiesMap[locId] = [];
                  if (!localitiesMap[locId].includes(pNo)) localitiesMap[locId].push(pNo);
                });
              }
            });

            return {
              meta: {
                state_code: metaItem?.state_code || "TN",
                state_name: metaItem?.state_name || "Tamil Nadu",
                ac_no: resolvedAcNo,
                ac_name: metaItem?.ac_name || slug.toUpperCase(),
                pc_no: metaItem?.pc_no,
                pc_name: metaItem?.pc_name,
                pc_category: metaItem?.pc_category,
                total_stations: stationItems.length,
              },
              lookups: {
                pincodes: pincodesMap,
                local_bodies: localBodyItems,
                wards: wardsMap,
                localities: localitiesMap,
              },
              stations: stationItems.map((st: RawDynamoStationItem) => ({
                ...(st as unknown as PollingStationMaster),
                polling_station_no: st.polling_station_no || String(st.ps_no),
              })) as PollingStationMaster[],
            };
          }
        }
      } catch (err) {
        console.warn(`[PollingStationRepository] DynamoDB query failed for ${pk}:`, err);
      }

      // 2. Fallback to local JSON files if DynamoDB is unavailable or empty
      try {
        const fs = await import("fs/promises");
        const path = await import("path");

        const possiblePaths = [
          path.join(process.cwd(), "data", "polling_stations", `AC${paddedAc}.json`),
          path.join(process.cwd(), "frontend", "data", "polling_stations", `AC${paddedAc}.json`),
          path.join(process.cwd(), "..", "scraper", "assets", "polling_stations", `AC${paddedAc}`, `AC${paddedAc}.json`),
          path.join(process.cwd(), "scraper", "assets", "polling_stations", `AC${paddedAc}`, `AC${paddedAc}.json`),
        ];

        for (const filePath of possiblePaths) {
          try {
            const data = await fs.readFile(filePath, "utf-8");
            const parsed = JSON.parse(data) as PollingStationBundle;
            if (parsed && parsed.stations && parsed.stations.length > 0) {
              return {
                ...parsed,
                stations: parsed.stations.map((st: PollingStationMaster) => ({
                  ...st,
                  polling_station_no: st.polling_station_no || String(st.ps_no),
                })),
              };
            }
          } catch {
            // try next path
          }
        }
      } catch (fileErr) {
        console.warn(`[PollingStationRepository] File fallback failed for AC${paddedAc}:`, fileErr);
      }
    }

    return null;
  }

  /**
   * Fetches a specific polling station by constituency and booth number.
   */
  async getStationDetail(
    constituencySlug: string,
    psNo: string
  ): Promise<PollingStationMaster | null> {
    const slug = constituencySlug.replace(/^CONSTITUENCY#/i, "").toLowerCase();
    const pk = `CONSTITUENCY#${slug}`;
    const sk = `PS#${psNo}`;

    try {
      const dbItem = (await this.client.get({
        Key: { PK: pk, SK: sk },
      })) as PollingStationMaster | null;

      if (dbItem) return dbItem;
    } catch (error) {
      console.warn(`Error fetching polling station ${psNo} for ${slug} from DB:`, error);
    }

    // Fallback to constituency bundle
    const bundle = await this.getConstituencyBundle(slug);
    if (bundle && bundle.stations) {
      const match = bundle.stations.find(
        (s) => String(s.ps_no) === psNo || s.polling_station_no === psNo
      );
      if (match) return match;
    }

    return null;
  }

  /**
   * Fetches all polling stations across the state that belong to a specific pincode.
   */
  async getStationsByPincode(pincode: string): Promise<PollingStationMaster[]> {
    return this.client.query({
      IndexName: "PincodeIndex",
      KeyConditionExpression: "pincode = :pincode",
      ExpressionAttributeValues: {
        ":pincode": pincode.trim(),
      },
    }) as Promise<PollingStationMaster[]>;
  }
}
