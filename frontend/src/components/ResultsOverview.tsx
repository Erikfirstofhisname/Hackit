import type { RunResult } from "@/lib/ranking-types";
import { tierTone } from "@/lib/format";
import { RankTable } from "./RankTable";

const TIER_BLURBS: Record<number, string> = {
  1: "Strongest overall fits for this configuration.",
  2: "Solid mid-range matches worth considering.",
  3: "Weaker fits relative to the rest of this run.",
};

export function ResultsOverview({
  result,
  tableTitle = "Overall rankings",
  showTable = true,
}: {
  result: RunResult;
  tableTitle?: string;
  showTable?: boolean;
}) {
  return (
    <div className="space-y-8">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetaCard label="Rows evaluated" value={String(result.n_rows)} />
        <MetaCard label="Cross-validation folds" value={String(result.n_folds)} />
        <MetaCard label="Models used" value={String(result.models_run.length)} />
        <MetaCard label="Tiers" value={String(result.tier_summary.length)} />
      </div>

      <div>
        <h3 className="mb-3 font-[family-name:var(--font-display)] text-xl text-ink">
          Tier summary
        </h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {result.tier_summary.map((t) => {
            const tone = tierTone(t.tier_rank);
            const badge =
              tone === "a"
                ? "tier-badge-a"
                : tone === "b"
                  ? "tier-badge-b"
                  : "tier-badge-c";
            return (
              <div
                key={t.tier}
                className="rounded-[var(--radius)] border border-line bg-sand/70 px-4 py-4"
              >
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${badge}`}
                >
                  {t.tier}
                </span>
                <p className="mt-2 text-sm text-ink/65">
                  {TIER_BLURBS[t.tier_rank] ?? "Fit band for this run."}
                </p>
                <p className="mt-3 text-sm text-ink">
                  <span className="font-semibold">{t.count}</span> events · mean
                  score{" "}
                  <span className="tabular-nums font-semibold">
                    {t.mean_ensemble_score.toFixed(3)}
                  </span>
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {showTable ? (
        <RankTable title={tableTitle} rows={result.top10 ?? []} showTier />
      ) : null}
    </div>
  );
}

function MetaCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius)] border border-line bg-fog/50 px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-ink/50">{label}</p>
      <p className="mt-1 font-[family-name:var(--font-display)] text-2xl text-ink">
        {value}
      </p>
    </div>
  );
}
