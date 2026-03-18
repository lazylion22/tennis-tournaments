import { ExternalLink, MapPin, Trophy, Users } from "lucide-react";

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

interface TournamentCardProps {
  tournament: Tournament;
  tour: "ATP" | "WTA";
}

const SURFACE_COLORS: Record<string, string> = {
  Hard: "bg-surface-hard text-surface-hard-fg",
  Clay: "bg-surface-clay text-surface-clay-fg",
  Grass: "bg-surface-grass text-surface-grass-fg",
  Carpet: "bg-surface-carpet text-surface-carpet-fg",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatPrize(amount: number | null, currency: string | null): string | null {
  if (!amount) return null;
  const sym = currency === "USD" || currency === "$" ? "$" : (currency ?? "");
  if (amount >= 1_000_000)
    return `${sym}${(amount / 1_000_000).toFixed(2).replace(/\.?0+$/, "")}M`;
  if (amount >= 1_000)
    return `${sym}${(amount / 1_000).toFixed(0)}K`;
  return `${sym}${amount}`;
}

export function TournamentCard({ tournament, tour }: TournamentCardProps) {
  const surface = tournament.surface ?? null;
  const surfaceClass =
    surface && SURFACE_COLORS[surface]
      ? SURFACE_COLORS[surface]
      : "bg-muted text-muted-foreground";

  const query = encodeURIComponent(
    `${tour === "ATP" ? "Men" : "Women"} ${tournament.name} tennis`
  );
  const googleUrl = `https://www.google.com/search?q=${query}`;

  const prize = formatPrize(tournament.prize_money, tournament.prize_currency);

  return (
    <a
      href={googleUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group block rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-lg transition-all duration-200 overflow-hidden"
    >
      {/* Tour badge strip */}
      <div
        className={`h-1 w-full ${tour === "ATP" ? "bg-atp" : "bg-wta"}`}
      />

      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-foreground text-base leading-snug text-balance group-hover:text-primary transition-colors">
            {tournament.name}
          </h3>
          <ExternalLink className="shrink-0 size-4 text-muted-foreground group-hover:text-primary transition-colors mt-0.5" />
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          {surface && (
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-medium ${surfaceClass}`}>
              {surface}
            </span>
          )}
          {tournament.category && (
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 font-medium bg-secondary text-secondary-foreground">
              {tournament.category}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <MapPin className="size-3.5 shrink-0" />
            <span className="truncate">{tournament.location}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-mono">
              {formatDate(tournament.start_date)} – {formatDate(tournament.end_date)}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {prize && (
              <div className="flex items-center gap-1.5">
                <Trophy className="size-3.5 shrink-0" />
                <span>{prize}</span>
              </div>
            )}
            {tournament.draw_size && (
              <div className="flex items-center gap-1.5">
                <Users className="size-3.5 shrink-0" />
                <span>{tournament.draw_size} players</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </a>
  );
}
