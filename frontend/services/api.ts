import {
  DistrictResponse,
  ConstituencyResponse,
  ConstituencyWinnerHistoryResponse,
  MLAProfileResponse,
  MLAListResponse,
  DistrictDetailResponse
} from "@/types/models";

const USE_V2_API = process.env.NEXT_PUBLIC_USE_V2_API === "true";
const PYTHON_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
const isServer = typeof window === "undefined";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

const BASE_URL = USE_V2_API 
  ? (isServer ? `${SITE_URL}/api/v2` : "/api/v2")
  : PYTHON_API_URL;

export async function fetchDistricts(): Promise<DistrictResponse[]> {
  const res = await fetch(`${BASE_URL}/districts`, { next: { revalidate: 3600 } });
  if (!res.ok) {
    const errorBody = await res.text().catch(() => "No error body");
    throw new Error("Failed to fetch districts");
  }
  return res.json();
}

export async function fetchDistrictDetails(districtId: string): Promise<DistrictDetailResponse> {
  const res = await fetch(`${BASE_URL}/districts/${encodeURIComponent(districtId)}`, { next: { revalidate: 3600 } });
  if (!res.ok) {
    const errorBody = await res.text().catch(() => "No error body");
    throw new Error("Failed to fetch district details");
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
    throw new Error("Failed to fetch constituencies");
  }
  return res.json();
}

export async function fetchConstituencyWinners(constituencyId: string): Promise<ConstituencyWinnerHistoryResponse> {
  const res = await fetch(`${BASE_URL}/constituencies/${encodeURIComponent(constituencyId)}/winners`, { next: { revalidate: 3600 } });
  if (!res.ok) {
    const errorBody = await res.text().catch(() => "No error body");
    throw new Error("Failed to fetch constituency winners");
  }
  return res.json();
}

export async function fetchMLAProfile(identifier: string): Promise<MLAProfileResponse> {
  const res = await fetch(`${BASE_URL}/mlas/${encodeURIComponent(identifier)}/profile`, { next: { revalidate: 3600 } });
  if (!res.ok) {
    const errorBody = await res.text().catch(() => "No error body");
    throw new Error("Failed to fetch MLA profile");
  }
  return res.json();
}
export async function fetchMLAs(year: number = 2021): Promise<MLAListResponse> {
  const res = await fetch(`${BASE_URL}/mlas?year=${year}`, { next: { revalidate: 3600 } });
  if (!res.ok) {
    const errorBody = await res.text().catch(() => "No error body");
    throw new Error("Failed to fetch MLAs");
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
    throw new Error("Failed to submit feedback");
  }
  return res.json();
}
