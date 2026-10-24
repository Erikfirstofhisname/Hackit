/** Popup choices per model (metadata preferences — not scoring filters). */
export const MODEL_OPTIONS: Record<string, { label: string; value: string }[]> = {
  interest_rating: [
    { label: "Any interest level", value: "Predict interest rating 1–10 (any level)." },
    { label: "Prioritize high (7+)", value: "Prioritize students/events with high interest (7+)." },
    { label: "Prioritize mid (4–6)", value: "Focus on mid-range interest fits (4–6)." },
    { label: "Surface low (<4)", value: "Flag low-interest mismatches (below 4)." },
  ],
  high_interest: [
    { label: "Engage if rating ≥ 6", value: "Binary: engage when predicted rating ≥ 6." },
    { label: "Stricter (≥ 7)", value: "Binary: engage when predicted rating ≥ 7." },
    { label: "Looser (≥ 5)", value: "Binary: engage when predicted rating ≥ 5." },
  ],
  event_type: [
    { label: "Any event type", value: "Predict best-fit event type (all classes)." },
    { label: "Creative workshop", value: "Prefer creative_workshop." },
    { label: "Art showcase", value: "Prefer art_showcase." },
    { label: "Community service", value: "Prefer community_service." },
    { label: "Networking", value: "Prefer networking." },
    { label: "Coworking", value: "Prefer coworking." },
    { label: "Local market", value: "Prefer local_market." },
  ],
  preferred_time: [
    { label: "Any time slot", value: "Predict preferred time (all slots)." },
    { label: "Weekend afternoon", value: "Prefer weekend_afternoon." },
    { label: "Weekend evening", value: "Prefer weekend_evening." },
    { label: "Weekend morning", value: "Prefer weekend_morning." },
    { label: "Weekday afternoon", value: "Prefer weekday_afternoon." },
    { label: "Weekday evening", value: "Prefer weekday_evening." },
  ],
  neighborhood: [
    { label: "Any neighborhood", value: "Predict neighborhood preference (all areas)." },
    { label: "Back Bay", value: "Prefer Back Bay." },
    { label: "Downtown", value: "Prefer Downtown." },
    { label: "Fenway", value: "Prefer Fenway." },
    { label: "Cambridge", value: "Prefer Cambridge." },
    { label: "Roxbury", value: "Prefer Roxbury." },
    { label: "Dorchester", value: "Prefer Dorchester." },
    { label: "Jamaica Plain", value: "Prefer Jamaica Plain." },
  ],
  cost_band: [
    { label: "Any cost band", value: "Predict cost-band tolerance (free/low/mid/high)." },
    { label: "Free only", value: "Prefer free events." },
    { label: "Low (≤ $10)", value: "Prefer low cost band." },
    { label: "Mid ($11–20)", value: "Prefer mid cost band." },
    { label: "High ($20+)", value: "Prefer high cost band." },
  ],
  cross_campus: [
    { label: "Either", value: "Predict cross-campus affinity (yes/no)." },
    { label: "Prefer cross-campus", value: "Prefer cross-campus events." },
    { label: "Same-campus only", value: "Prefer same-campus events." },
  ],
  civic_affinity: [
    { label: "Any civic fit", value: "Predict civic / community-service affinity." },
    { label: "Strong civic fit", value: "Prioritize strong civic_fit scores." },
    { label: "Community service focus", value: "Prioritize community_service civic match." },
    { label: "Moderate only", value: "Focus on moderate civic affinity." },
  ],
};

export function optionLabel(modelId: string, promptValue: string): string {
  const opts = MODEL_OPTIONS[modelId] ?? [];
  return opts.find((o) => o.value === promptValue)?.label ?? "Choose option";
}
