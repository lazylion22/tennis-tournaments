"use client";

import { useEffect, useState, useCallback } from "react";
import { TournamentCard } from "@/components/tournament-card";
import { RefreshCw } from "lucide-react";

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

interface TournamentsData {
  atp: Tournament[];
  wta: Tournament[];
  fetchedAt: number;
  fromCache: boolean;
}

export default function TournamentsPage() {
  const [data, setData] = useState<TournamentsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const url = force ? "/api/tournaments?cache=pls" : "/api/tournaments";
      const res = await fetch(url);
      if (!res.ok) throw new Error(await res.text());
      const json: TournamentsData = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tournaments");
    } finally {
      setLoading(false);
    }
  }, []);

  // Check for ?cache=pls in the URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const force = params.get("cache") === "pls";
    fetchData(force);
  }, [fetchData]);

  const cacheTime = data?.fetchedAt
    ? new Date(data.fetchedAt).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const totalRunning = (data?.atp.length ?? 0) + (data?.wta.length ?? 0);

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex flex-col gap-0.5">
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                Tennis Tournaments
              </h1>
              {!loading && data && (
                <p className="text-xs text-muted-foreground">
                  {totalRunning > 0
                    ? `${totalRunning} tournament${totalRunning !== 1 ? "s" : ""} in progress`
                    : "No tournaments currently running"}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={() => fetchData(true)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 px-3 py-1.5 rounded-lg border border-border hover:border-primary/40 bg-background"
            title="Force refresh cache"
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8 flex flex-col gap-10">
        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <RefreshCw className="size-6 animate-spin" />
              <span className="text-sm">Loading tournaments...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
            <p className="text-sm text-destructive font-medium">{error}</p>
          </div>
        )}

        {!loading && data && (
          <>
            {/* ATP Section */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-6 w-1 rounded-full bg-atp" />
                <h2 className="text-lg font-semibold text-foreground">ATP</h2>
                <span className="text-sm text-muted-foreground">
                  {data.atp.length > 0
                    ? `${data.atp.length} tournament${data.atp.length !== 1 ? "s" : ""}`
                    : "No tournaments running"}
                </span>
              </div>
              {data.atp.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.atp.map((t) => (
                    <TournamentCard key={t.id} tournament={t} tour="ATP" />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-border bg-muted/40 py-10 text-center text-sm text-muted-foreground">
                  No ATP tournaments are currently running.
                </div>
              )}
            </section>

            {/* WTA Section */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-6 w-1 rounded-full bg-wta" />
                <h2 className="text-lg font-semibold text-foreground">WTA</h2>
                <span className="text-sm text-muted-foreground">
                  {data.wta.length > 0
                    ? `${data.wta.length} tournament${data.wta.length !== 1 ? "s" : ""}`
                    : "No tournaments running"}
                </span>
              </div>
              {data.wta.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.wta.map((t) => (
                    <TournamentCard key={t.id} tournament={t} tour="WTA" />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-border bg-muted/40 py-10 text-center text-sm text-muted-foreground">
                  No WTA tournaments are currently running.
                </div>
              )}
            </section>

            {/* Cache info */}
            {cacheTime && (
              <p className="text-center text-xs text-muted-foreground pb-2">
                Data last fetched: {cacheTime}
                {data.fromCache ? " (cached)" : " (live)"}
              </p>
            )}
          </>
        )}
      </div>
    </main>
  );
}
