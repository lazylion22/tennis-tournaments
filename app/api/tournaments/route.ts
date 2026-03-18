import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

const CACHE_TTL_SECONDS = 12 * 60 * 60; // 12 hours
const CACHE_KEY = "tournaments:all";
const CURRENT_YEAR = new Date().getFullYear();

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

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

interface CachedPayload {
  atp: Tournament[];
  wta: Tournament[];
  fetchedAt: number;
}

async function fetchAllTournaments(tour: "atp" | "wta"): Promise<Tournament[]> {
  const key = process.env.BALLDONTLIE_KEY;
  if (!key) throw new Error("BALLDONTLIE_KEY is not set");

  const endpoint = `https://api.balldontlie.io/${tour}/v1/tournaments?season=${CURRENT_YEAR}`;
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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const forceRefresh = searchParams.get("cache") === "pls";

  // Attempt to load from Redis unless force-refreshing
  if (!forceRefresh) {
    const cached = await redis.get<CachedPayload>(CACHE_KEY);
    if (cached) {
      return NextResponse.json({
        atp: cached.atp.filter(isCurrentlyRunning),
        wta: cached.wta.filter(isCurrentlyRunning),
        fetchedAt: cached.fetchedAt,
        fromCache: true,
      });
    }
  }

  // Cache miss or forced refresh — fetch from the API
  try {
    const [atpAll, wtaAll] = await Promise.all([
      fetchAllTournaments("atp"),
      fetchAllTournaments("wta"),
    ]);

    const payload: CachedPayload = {
      atp: atpAll,
      wta: wtaAll,
      fetchedAt: Date.now(),
    };

    // Persist to Redis with a 12-hour TTL
    await redis.set(CACHE_KEY, payload, { ex: CACHE_TTL_SECONDS });

    return NextResponse.json({
      atp: payload.atp.filter(isCurrentlyRunning),
      wta: payload.wta.filter(isCurrentlyRunning),
      fetchedAt: payload.fetchedAt,
      fromCache: false,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
