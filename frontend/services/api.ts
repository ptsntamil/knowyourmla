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
  const res = await fetch(`${BASE_URL}/districts`, { next: { revalidate: 3600 } });
  if (!res.ok) {
    const errorBody = await res.text().catch(() => "No error body");
    throw new Error(`Failed to fetch districts: ${res.status} ${res.statusText} - ${errorBody}`);
  }
  return res.json();
}

export async function fetchDistrictDetails(districtId: string): Promise<DistrictDetailResponse> {
  const res = await fetch(`${BASE_URL}/districts/${encodeURIComponent(districtId)}`, { next: { revalidate: 3600 } });
  if (!res.ok) {
    const errorBody = await res.text().catch(() => "No error body");
    throw new Error(`Failed to fetch district details: ${res.status} ${res.statusText} - ${errorBody}`);
  }
  return res.json();
}

export async function fetchConstituencies(district_id?: string): Promise<ConstituencyResponse[]> {
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
  const res = await fetch(`${BASE_URL}/constituencies/${encodeURIComponent(constituencyId)}/winners`, { next: { revalidate: 3600 } });
  if (!res.ok) {
    const errorBody = await res.text().catch(() => "No error body");
    throw new Error(`Failed to fetch constituency winners: ${res.status} ${res.statusText} - ${errorBody}`);
  }
  return res.json();
}

export async function fetchMLAProfile(identifier: string): Promise<MLAProfileResponse> {
  const res = await fetch(`${BASE_URL}/mlas/${encodeURIComponent(identifier)}/profile`, { next: { revalidate: 0 } });
  if (!res.ok) {
    const errorBody = await res.text().catch(() => "No error body");
    throw new Error(`Failed to fetch MLA profile: ${res.status} ${res.statusText} - ${errorBody}`);
  }
  return res.json();
}
export async function fetchMLAs(year: number = 2021): Promise<MLAListResponse> {
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
  const res = await fetch(`${BASE_URL}/parties`, { next: { revalidate: 3600 } });
  if (!res.ok) {
    const errorBody = await res.text().catch(() => "No error body");
    throw new Error(`Failed to fetch parties: ${res.status} ${res.statusText} - ${errorBody}`);
  }
  return res.json();
}

export async function fetchPartyDetails(slug: string, year?: string): Promise<any> {
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
  const res = await fetch(`${BASE_URL}/parties/${encodeURIComponent(slug)}/candidates?year=${year}`, { next: { revalidate: 0 } });
  if (!res.ok) {
    const errorBody = await res.text().catch(() => "No error body");
    throw new Error(`Failed to fetch party candidates: ${res.status} ${res.statusText} - ${errorBody}`);
  }
  return res.json();
}
