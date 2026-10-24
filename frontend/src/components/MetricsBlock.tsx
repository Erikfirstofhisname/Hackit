import type { PerModel } from "@/lib/ranking-types";
import { metricHint, metricLabel } from "@/lib/format";

export function MetricsBlock({ model }: { model: PerModel }) {
  return (
    <div className="space-y-3 rounded-[var(--radius)] border border-line bg-fog/40 px-4 py-4">
      <div>
        <p className="font-[family-name:var(--font-display)] text-lg text-ink">
          {model.name}
        </p>
        {model.prompt ? (
          <p className="mt-1 text-sm text-ink/60">
            <span className="font-medium text-ink/75">Preference note: </span>
            {model.prompt}
          </p>
        ) : null}
      </div>
      <ul className="grid gap-2 sm:grid-cols-2">
        {Object.entries(model.metrics).map(([k, v]) => {
          const hint = metricHint(k);
          return (
            <li
              key={k}
              className="rounded-[var(--radius)] border border-line bg-sand/80 px-3 py-2"
            >
              <p className="text-xs uppercase tracking-wide text-ink/50">
                {metricLabel(k)}
              </p>
              <p className="mt-0.5 tabular-nums text-base font-semibold text-ink">
                {Number(v).toFixed(3)}
              </p>
              {hint ? (
                <p className="mt-1 text-xs leading-relaxed text-ink/55">{hint}</p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
