"use client";

import { useEffect, useState } from "react";
import type { RankRow } from "@/lib/ranking-types";
import { humanize, tierTone } from "@/lib/format";

const PAGE_SIZE = 10;

function TierBadge({ tier, tierRank }: { tier?: string; tierRank?: number }) {
  if (!tier) return <span className="text-ink/45">—</span>;
  const tone = tierTone(tierRank);
  const cls =
    tone === "a"
      ? "tier-badge-a"
      : tone === "b"
        ? "tier-badge-b"
        : tone === "c"
          ? "tier-badge-c"
          : "border border-line bg-fog text-ink/70";
  const short =
    tone === "a" ? "A" : tone === "b" ? "B" : tone === "c" ? "C" : tier;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${cls}`}
      title={tier}
    >
      <span aria-hidden>Tier {short}</span>
      <span className="sr-only">{tier}</span>
    </span>
  );
}

export function RankTable({
  title,
  rows,
  showTier,
  scoreKey,
}: {
  title: string;
  rows: RankRow[];
  showTier?: boolean;
  scoreKey?: string;
}) {
  const [visible, setVisible] = useState(PAGE_SIZE);

  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [rows]);

  const shown = rows.slice(0, visible);
  const remaining = Math.max(0, rows.length - visible);
  const nextBatch = Math.min(PAGE_SIZE, remaining);

  const scoreOf = (r: RankRow): number | null => {
    if (showTier && r.ensemble_score != null) return Number(r.ensemble_score);
    if (scoreKey && r[scoreKey] != null) return Number(r[scoreKey]);
    return null;
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <h3 className="font-[family-name:var(--font-display)] text-xl text-ink">
          {title}
        </h3>
        <p
          className="max-w-sm text-xs leading-relaxed text-ink/55"
          title="Higher scores mean a stronger fit under the models you ran."
        >
          Higher scores mean a stronger fit for this configuration.
        </p>
      </div>

      {/* Desktop / tablet table */}
      <div className="hidden overflow-hidden rounded-[var(--radius)] border border-line md:block">
        <div className="max-h-[70vh] overflow-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="sticky top-0 z-10 bg-leaf-deep text-sand">
              <tr>
                <th className="px-3 py-3 font-medium">Rank</th>
                <th className="px-3 py-3 font-medium">ID</th>
                <th className="px-3 py-3 font-medium">Campus</th>
                <th className="px-3 py-3 font-medium">Event</th>
                <th className="px-3 py-3 font-medium">Free</th>
                {showTier && <th className="px-3 py-3 font-medium">Tier</th>}
                <th className="px-3 py-3 font-medium">
                  <span title="Higher is a stronger ranking fit">Score</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => {
                const score = scoreOf(r);
                return (
                  <tr
                    key={`${r.rank}-${r.record_id}`}
                    className="odd:bg-fog/35 even:bg-sand/40"
                  >
                    <td className="px-3 py-3">
                      <span className="inline-flex min-h-8 min-w-8 items-center justify-center rounded-full bg-fog text-xs font-semibold text-ink">
                        {r.rank}
                      </span>
                    </td>
                    <td className="px-3 py-3 font-mono text-xs">{r.record_id}</td>
                    <td className="px-3 py-3">{humanize(r.campus_group)}</td>
                    <td className="px-3 py-3">
                      {humanize(r.event_type)}
                      <span className="block text-xs text-ink/45">
                        {humanize(r.event_neighborhood)}
                      </span>
                    </td>
                    <td className="px-3 py-3">{r.is_free ? "Yes" : "No"}</td>
                    {showTier && (
                      <td className="px-3 py-3">
                        <TierBadge
                          tier={r.tier}
                          tierRank={
                            typeof r.tier_rank === "number" ? r.tier_rank : undefined
                          }
                        />
                      </td>
                    )}
                    <td className="px-3 py-3 tabular-nums font-medium">
                      {score != null ? score.toFixed(3) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile stacked cards */}
      <ul className="space-y-3 md:hidden">
        {shown.map((r) => {
          const score = scoreOf(r);
          return (
            <li
              key={`${r.rank}-${r.record_id}`}
              className="rounded-[var(--radius)] border border-line bg-sand/80 p-4"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-full bg-fog text-sm font-semibold">
                  #{r.rank}
                </span>
                <span className="tabular-nums text-base font-semibold text-ink">
                  {score != null ? score.toFixed(3) : "—"}
                </span>
              </div>
              <p className="font-medium text-ink">{humanize(r.event_type)}</p>
              <p className="text-sm text-ink/60">
                {humanize(r.campus_group)} · {humanize(r.event_neighborhood)}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-ink/65">
                <span className="font-mono">{r.record_id}</span>
                <span>{r.is_free ? "Free" : "Paid"}</span>
                {showTier && (
                  <TierBadge
                    tier={r.tier}
                    tierRank={
                      typeof r.tier_rank === "number" ? r.tier_rank : undefined
                    }
                  />
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-ink/50">
          Showing {shown.length} of {rows.length}
        </p>
        {remaining > 0 ? (
          <button
            type="button"
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
            className="min-h-11 rounded-[var(--radius)] border border-ink/20 px-4 text-sm font-medium text-ink hover:border-leaf hover:text-leaf"
          >
            Show next {nextBatch} row{nextBatch === 1 ? "" : "s"}
          </button>
        ) : rows.length > PAGE_SIZE ? (
          <button
            type="button"
            onClick={() => setVisible(PAGE_SIZE)}
            className="min-h-11 rounded-[var(--radius)] border border-ink/20 px-4 text-sm font-medium text-ink hover:border-leaf hover:text-leaf"
          >
            Show first 10
          </button>
        ) : null}
      </div>
    </div>
  );
}
