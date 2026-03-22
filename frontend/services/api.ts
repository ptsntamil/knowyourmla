import {
  DistrictResponse,
  ConstituencyResponse,
  ConstituencyWinnerHistoryResponse,
  MLAProfileResponse,
  MLAListResponse,
  DistrictDetailResponse
} from "@/types/models";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export async function fetchDistricts(): Promise<DistrictResponse[]> {
  const res = await fetch(`${BASE_URL}/districts`, { cache: "no-store" });
  if (!res.ok) {
    const errorBody = await res.text().catch(() => "No error body");
    throw new Error("Failed to fetch districts");
  }
  return res.json();
}

export async function fetchDistrictDetails(districtId: string): Promise<DistrictDetailResponse> {
  const res = await fetch(`${BASE_URL}/districts/${encodeURIComponent(districtId)}`, { cache: "no-store" });
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
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const errorBody = await res.text().catch(() => "No error body");
    throw new Error("Failed to fetch constituencies");
  }
  return res.json();
}

export async function fetchConstituencyWinners(constituencyId: string): Promise<ConstituencyWinnerHistoryResponse> {
  const res = await fetch(`${BASE_URL}/constituencies/${encodeURIComponent(constituencyId)}/winners`, { cache: "no-store" });
  if (!res.ok) {
    const errorBody = await res.text().catch(() => "No error body");
    throw new Error("Failed to fetch constituency winners");
  }
  return res.json();
}

export async function fetchMLAProfile(identifier: string): Promise<MLAProfileResponse> {
  const res = await fetch(`${BASE_URL}/mlas/${encodeURIComponent(identifier)}/profile`, { cache: "no-store" });
  if (!res.ok) {
    const errorBody = await res.text().catch(() => "No error body");
    throw new Error("Failed to fetch MLA profile");
  }
  return res.json();
}
export async function fetchMLAs(year: number = 2021): Promise<MLAListResponse> {
  const res = await fetch(`${BASE_URL}/mlas?year=${year}`, { cache: "no-store" });
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
