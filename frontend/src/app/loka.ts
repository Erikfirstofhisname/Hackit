// LOKA shared logic — ported from the HTML prototype into typed modules.
// Data: People + Communities from our seed.json; Events from the backend's
// precomputed ML rankings (events.json, built by scripts/build_events_json.py).

export type Person = {
  id: string; name: string; campus: string; interest: string; role: string;
  tagline: string; looking_for: string; neighborhood: string;
  match_reason: string; opportunity_score: number; url?: string;
};
export type Opportunity = {
  id: string; title: string; host: string; interest: string; type: string;
  date: string; cost: string; neighborhood: string; opportunity_score: number;
  url?: string; rank?: number; source?: string;
};
export type Community = {
  id: string; name: string; interest: string; campuses: string[];
  members: number; neighborhood: string; opportunity_score: number; url?: string;
};
export type Seed = {
  people: Person[]; opportunities: Opportunity[]; communities: Community[];
  neighborhood_scores: Record<string, number>;
};
export type Profile = {
  name: string; interests: string[]; campus: string | null; goal: string | null;
};

export const LS_KEY = "loka_profile_v1";
export const CREATE_KEY = "loka_created_v1";

export const ICONS: Record<string, string> = {
  entrepreneurship: "🚀", music: "🎵", fashion: "👗", volunteering: "🤝",
  tech: "💻", art: "🎨", photography: "📷", writing: "✍️", design: "✏️",
  film: "🎬", food: "🍳", sports: "🏃", gaming: "🎮", science: "🔬", business: "💼",
};
export const icon = (k?: string) => ICONS[(k || "").toLowerCase()] || "✨";

export const PALETTES: [string, string][] = [
  ["#f05de8", "#2a0f3a"], ["#2f6df0", "#07204a"], ["#f0a63d", "#3a1f02"],
  ["#4df0a6", "#042a1b"], ["#f04d6b", "#3a0410"], ["#9b5df0", "#1b0540"],
  ["#5ad1f0", "#03283a"],
];
export const pal = (i: number) => PALETTES[i % PALETTES.length];

// Boston-area colleges & universities with official sites (for real links).
export const SCHOOLS: [string, string][] = [
  ["Babson College", "babson.edu"], ["Bentley University", "bentley.edu"],
  ["Berklee College of Music", "berklee.edu"], ["Boston College", "bc.edu"],
  ["Boston University", "bu.edu"], ["Brandeis University", "brandeis.edu"],
  ["Bunker Hill Community College", "bhcc.edu"], ["Emerson College", "emerson.edu"],
  ["Emmanuel College", "emmanuel.edu"], ["Fisher College", "fisher.edu"],
  ["Harvard University", "harvard.edu"], ["Lesley University", "lesley.edu"],
  ["Massachusetts College of Art and Design", "massart.edu"],
  ["Massachusetts Institute of Technology (MIT)", "mit.edu"],
  ["MGH Institute of Health Professions", "mghihp.edu"],
  ["Northeastern University", "northeastern.edu"], ["Roxbury Community College", "rcc.mass.edu"],
  ["Simmons University", "simmons.edu"], ["Suffolk University", "suffolk.edu"],
  ["Tufts University", "tufts.edu"], ["University of Massachusetts Boston", "umb.edu"],
  ["Wellesley College", "wellesley.edu"], ["Wentworth Institute of Technology", "wit.edu"],
];
export function schoolDomain(name?: string): string | null {
  const hit = SCHOOLS.find((s) => s[0] === name);
  if (hit) return hit[1];
  const first = (name || "").toLowerCase().split(" ")[0];
  const fuzzy = first ? SCHOOLS.find((s) => s[0].toLowerCase().includes(first)) : null;
  return fuzzy ? fuzzy[1] : null;
}

/* ---------- personalization ---------- */
export function isForYou(item: { interest?: string; type?: string }, profile: Profile | null) {
  if (!profile || !profile.interests.length) return true;
  const it = (item.interest || item.type || "").toLowerCase();
  return profile.interests.some((x) => x.toLowerCase() === it);
}
export function personalScore(item: { interest?: string; type?: string; opportunity_score: number }, profile: Profile | null) {
  let s = item.opportunity_score || 0;
  if (isForYou(item, profile) && profile && profile.interests.length) s += 40;
  return s;
}

/* ---------- real outbound links ---------- */
export function linkForPerson(p: Person) {
  if (p.url) return { href: p.url, label: "View profile" };
  const q = encodeURIComponent(`${p.name} ${p.campus} ${p.interest}`);
  return { href: `https://www.linkedin.com/search/results/people/?keywords=${q}`, label: "Find them on LinkedIn" };
}
export function linkForOpp(o: Opportunity) {
  if (o.url) return { href: o.url, label: "View event" };
  const type = encodeURIComponent(o.type || "events");
  return { href: `https://www.eventbrite.com/d/ma--boston/${type}/`, label: "Find events like this" };
}
export function linkForComm(c: Community) {
  if (c.url) return { href: c.url, label: "Visit community" };
  const dom = schoolDomain((c.campuses || [])[0]);
  return dom
    ? { href: `https://www.${dom}`, label: "Visit the campus site" }
    : { href: `https://www.google.com/search?q=${encodeURIComponent(c.name + " Boston")}`, label: "Search for it" };
}

/* ---------- data loading ---------- */
export async function loadData(): Promise<Seed> {
  const [seed, events] = await Promise.all([
    fetch("/data/seed.json").then((r) => r.json()),
    fetch("/data/events.json").then((r) => r.json()).catch(() => ({ events: [] })),
  ]);
  // Replace seed's invented opportunities with the backend's real ML-ranked events.
  const realOpps: Opportunity[] = (events.events || []).map((e: Opportunity) => ({ ...e }));
  return {
    people: seed.people || [],
    communities: seed.communities || [],
    opportunities: realOpps.length ? realOpps : seed.opportunities || [],
    neighborhood_scores: seed.neighborhood_scores || {},
  };
}
