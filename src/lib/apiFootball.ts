const API_BASE = "https://v3.football.api-sports.io";
const WORLD_CUP_LEAGUE_ID = 1;
const SEASON = 2026;

interface ApiFixture {
  fixture: {
    id: number;
    date: string;
    status: {
      short: string;
      elapsed: number | null;
    };
  };
  teams: {
    home: { id: number; name: string };
    away: { id: number; name: string };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
}

interface ApiResponse<T> {
  response: T[];
  results: number;
  errors: Record<string, string>;
}

async function apiFetch<T>(endpoint: string): Promise<T[]> {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) return [];

  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: { "x-apisports-key": key },
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    console.error(`[apiFootball] ${endpoint} returned ${res.status}`);
    return [];
  }

  const data: ApiResponse<T> = await res.json();
  if (data.errors && Object.keys(data.errors).length > 0) {
    console.error(`[apiFootball] ${endpoint} errors:`, data.errors);
  }
  return data.response;
}

export async function fetchLiveFixtures(): Promise<ApiFixture[]> {
  return apiFetch<ApiFixture>(
    `/fixtures?league=${WORLD_CUP_LEAGUE_ID}&season=${SEASON}&live=all`,
  );
}

export async function fetchTodayFixtures(): Promise<ApiFixture[]> {
  const today = new Date().toISOString().split("T")[0];
  return apiFetch<ApiFixture>(
    `/fixtures?league=${WORLD_CUP_LEAGUE_ID}&season=${SEASON}&date=${today}`,
  );
}

export async function fetchAllFixtures(): Promise<ApiFixture[]> {
  return apiFetch<ApiFixture>(
    `/fixtures?league=${WORLD_CUP_LEAGUE_ID}&season=${SEASON}`,
  );
}

export type { ApiFixture };
