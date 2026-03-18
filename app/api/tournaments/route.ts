import { NextRequest, NextResponse } from "next/server";

const CACHE_DURATION_MS = 12 * 60 * 60 * 1000; // 12 hours
const CURRENT_YEAR = new Date().getFullYear();
const BASE_URL = "https://api.balldontlie.io/atp/v1/tournaments";

interface Tournament {
  id: number;
  name: string;
  location: string;
  surface: string | null;
  category: string;
  season: number;
  start_date: string;
  end_date: string;
  prize_money: number | null;
  prize_currency: string | null;
  draw_size: number | null;
}

interface ApiResponse {
  data: Tournament[];
  meta: { next_cursor: number | null; per_page: number };
}

async function fetchAllTournaments(tour: "atp" | "wta"): Promise<Tournament[]> {
  const key = process.env.BALLDONTLIE_KEY;
  if (!key) throw new Error("BALLDONTLIE_KEY is not set");

  const endpoint =
    tour === "atp"
      ? `${BASE_URL}?season=${CURRENT_YEAR}`
      : `https://api.balldontlie.io/wta/v1/tournaments?season=${CURRENT_YEAR}`;

  const all: Tournament[] = [];
  let cursor: number | null = null;

  do {
    const url = cursor ? `${endpoint}&cursor=${cursor}` : endpoint;
    const res = await fetch(url, {
      headers: { Authorization: key },
      next: { revalidate: 0 },
    });

    if (!res.ok) throw new Error(`Failed to fetch ${tour} tournaments: ${res.statusText}`);

    const json: ApiResponse = await res.json();
    all.push(...json.data);
    cursor = json.meta.next_cursor ?? null;
  } while (cursor !== null);

  return all;
}

function isCurrentlyRunning(tournament: Tournament): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(tournament.start_date + "T00:00:00");
  const end = new Date(tournament.end_date + "T23:59:59");
  return today >= start && today <= end;
}

// Simple in-memory server-side cache
let serverCache: {
  atp: Tournament[];
  wta: Tournament[];
  fetchedAt: number;
} | null = null;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const forceRefresh = searchParams.get("cache") === "pls";

  const now = Date.now();
  const cacheValid =
    serverCache !== null &&
    now - serverCache.fetchedAt < CACHE_DURATION_MS &&
    !forceRefresh;

  if (!cacheValid) {
    try {
      const [atpAll, wtaAll] = await Promise.all([
        fetchAllTournaments("atp"),
        fetchAllTournaments("wta"),
      ]);

      serverCache = {
        atp: atpAll,
        wta: wtaAll,
        fetchedAt: now,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  const cache = serverCache!;

  return NextResponse.json({
    atp: cache.atp.filter(isCurrentlyRunning),
    wta: cache.wta.filter(isCurrentlyRunning),
    fetchedAt: cache.fetchedAt,
    fromCache: cacheValid,
  });
}
