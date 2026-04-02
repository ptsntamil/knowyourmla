import {
  DistrictResponse,
  ConstituencyResponse,
  ConstituencyWinnerHistoryResponse,
  MLAProfileResponse,
  MLAListResponse,
  DistrictDetailResponse,
  PartyObj
} from "@/types/models";

// Default to V2 API (Next.js routes) unless explicitly disabled or in local dev without Vercel prefix
const USE_V2_API = process.env.NEXT_PUBLIC_USE_V2_API !== "false";
const PYTHON_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
const isServer = typeof window === "undefined";
const getSiteUrl = () => {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
};

const SITE_URL = getSiteUrl();

const BASE_URL = USE_V2_API
  ? (isServer ? `${SITE_URL}/api/v2` : "/api/v2")
  : PYTHON_API_URL;

export async function fetchDistricts(): Promise<DistrictResponse[]> {
  if (isServer && USE_V2_API) {
    const { DistrictService } = await import("@/lib/services/district.service");
    const service = new DistrictService();
    return service.getAllDistricts();
  }
  const res = await fetch(`${BASE_URL}/districts`, { next: { revalidate: 3600 } });
  if (!res.ok) {
    const errorBody = await res.text().catch(() => "No error body");
    throw new Error(`Failed to fetch districts: ${res.status} ${res.statusText} - ${errorBody}`);
  }
  return res.json();
}

export async function fetchDistrictDetails(districtId: string): Promise<DistrictDetailResponse> {
  if (isServer && USE_V2_API) {
    const { DistrictService } = await import("@/lib/services/district.service");
    const service = new DistrictService();
    return service.getDistrictDetails(districtId);
  }
  const res = await fetch(`${BASE_URL}/districts/${encodeURIComponent(districtId)}`, { next: { revalidate: 3600 } });
  if (!res.ok) {
    const errorBody = await res.text().catch(() => "No error body");
    throw new Error(`Failed to fetch district details: ${res.status} ${res.statusText} - ${errorBody}`);
  }
  return res.json();
}

export async function fetchConstituencies(district_id?: string): Promise<ConstituencyResponse[]> {
  if (isServer && USE_V2_API) {
    const { ConstituencyService } = await import("@/lib/services/constituency.service");
    const service = new ConstituencyService();
    return service.listConstituencies(district_id);
  }
  const url = district_id
    ? `${BASE_URL}/constituencies?district_id=${encodeURIComponent(district_id)}`
    : `${BASE_URL}/constituencies`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) {
    const errorBody = await res.text().catch(() => "No error body");
    throw new Error(`Failed to fetch constituencies: ${res.status} ${res.statusText} - ${errorBody}`);
  }
  return res.json();
}

export async function fetchConstituencyWinners(constituencyId: string): Promise<ConstituencyWinnerHistoryResponse> {
  if (isServer && USE_V2_API) {
    const { ConstituencyService } = await import("@/lib/services/constituency.service");
    const service = new ConstituencyService();
    return service.getWinnerHistory(constituencyId);
  }
  const res = await fetch(`${BASE_URL}/constituencies/${encodeURIComponent(constituencyId)}/winners`, { next: { revalidate: 3600 } });
  if (!res.ok) {
    const errorBody = await res.text().catch(() => "No error body");
    throw new Error(`Failed to fetch constituency winners: ${res.status} ${res.statusText} - ${errorBody}`);
  }
  return res.json();
}

export async function fetchMLAProfile(identifier: string): Promise<MLAProfileResponse> {
  if (isServer && USE_V2_API) {
    const { MLAService } = await import("@/lib/services/mla.service");
    const service = new MLAService();
    return service.getMLAProfile(identifier);
  }
  const res = await fetch(`${BASE_URL}/mlas/${encodeURIComponent(identifier)}/profile`, { next: { revalidate: 0 } });
  if (!res.ok) {
    const errorBody = await res.text().catch(() => "No error body");
    throw new Error(`Failed to fetch MLA profile: ${res.status} ${res.statusText} - ${errorBody}`);
  }
  return res.json();
}

export async function fetchMLAs(year: number = 2021): Promise<MLAListResponse> {
  if (isServer && USE_V2_API) {
    const { MLAService } = await import("@/lib/services/mla.service");
    const service = new MLAService();
    return service.getCurrentMLAs(year);
  }
  const res = await fetch(`${BASE_URL}/mlas?year=${year}`, { next: { revalidate: 3600 } });
  if (!res.ok) {
    const errorBody = await res.text().catch(() => "No error body");
    throw new Error(`Failed to fetch MLAs: ${res.status} ${res.statusText} - ${errorBody}`);
  }
  return res.json();
}

export async function submitFeedback(message: string, url: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/feedback`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message, url }),
  });
  if (!res.ok) {
    const errorBody = await res.text().catch(() => "No error body");
    throw new Error(`Failed to submit feedback: ${res.status} ${res.statusText} - ${errorBody}`);
  }
  return res.json();
}

export async function fetchParties(): Promise<any[]> {
  if (isServer && USE_V2_API) {
    const { PartyService } = await import("@/lib/services/party.service");
    const service = new PartyService();
    return service.getAllParties();
  }
  const res = await fetch(`${BASE_URL}/parties`, { next: { revalidate: 3600 } });
  if (!res.ok) {
    const errorBody = await res.text().catch(() => "No error body");
    throw new Error(`Failed to fetch parties: ${res.status} ${res.statusText} - ${errorBody}`);
  }
  return res.json();
}

export async function fetchPartyDetails(slug: string, year?: string): Promise<any> {
  if (isServer && USE_V2_API) {
    const { PartyService } = await import("@/lib/services/party.service");
    const service = new PartyService();
    const party = await service.getPartyBySlug(slug);
    if (!party) throw new Error("Party not found");
    
    // Aggregate metadata and analytics
    const [elections, analytics] = await Promise.all([
      service.getPartyElections(party.PK),
      service.getPartyAnalytics(party.PK, year && year !== "all" ? parseInt(year) : undefined)
    ]);

    return {
      ...party,
      id: party.PK,
      elections,
      analytics
    };
  }
  const url = year && year !== "all" 
    ? `${BASE_URL}/parties/${encodeURIComponent(slug)}?year=${year}`
    : `${BASE_URL}/parties/${encodeURIComponent(slug)}`;
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) {
    const errorBody = await res.text().catch(() => "No error body");
    throw new Error(`Failed to fetch party details: ${res.status} ${res.statusText} - ${errorBody}`);
  }
  return res.json();
}

export async function fetchPartyCandidates(slug: string, year: number): Promise<any[]> {
  if (isServer && USE_V2_API) {
    const { PartyService } = await import("@/lib/services/party.service");
    const service = new PartyService();
    const party = await service.getPartyBySlug(slug);
    if (!party) throw new Error("Party not found");
    return service.getPartyCandidatesForYear(party.PK, year);
  }
  const res = await fetch(`${BASE_URL}/parties/${encodeURIComponent(slug)}/candidates?year=${year}`, { next: { revalidate: 0 } });
  if (!res.ok) {
    const errorBody = await res.text().catch(() => "No error body");
    throw new Error(`Failed to fetch party candidates: ${res.status} ${res.statusText} - ${errorBody}`);
  }
  return res.json();
}
