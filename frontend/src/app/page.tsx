"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CREATE_KEY, Community, LS_KEY, Opportunity, Person, Profile, SCHOOLS, Seed,
  icon, isForYou, linkForComm, linkForOpp, linkForPerson, loadData, pal, personalScore,
} from "./loka";

type Feed = "foryou" | "popular";
type Sec = "people" | "opportunities" | "communities";
type AnyItem = Person | Opportunity | Community;

const GOALS = [
  { v: "learn", label: "📚 Looking to learn" },
  { v: "mentors", label: "🧭 Find peer mentors" },
  { v: "people", label: "👋 Find people like me" },
  { v: "building", label: "🔨 Building something" },
  { v: "mentor", label: "⭐ Happy to mentor" },
];

export default function Home() {
  const [data, setData] = useState<Seed | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [feed, setFeed] = useState<Feed>("foryou");
  const [sec, setSec] = useState<Sec>("people");
  const [detail, setDetail] = useState<{ sec: Sec; id: string } | null>(null);
  const [creating, setCreating] = useState(false);

  // onboarding draft
  const [name, setName] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [campus, setCampus] = useState<string>("");
  const [goal, setGoal] = useState<string>("");

  useEffect(() => {
    loadData().then((d) => {
      // merge any user-created items saved on this device
      try {
        const saved = JSON.parse(localStorage.getItem(CREATE_KEY) || "null");
        if (saved) {
          (["people", "opportunities", "communities"] as Sec[]).forEach((k) => {
            (saved[k] || []).forEach((it: AnyItem) => {
              if (!(d[k] as AnyItem[]).some((x) => String((x as { id: string }).id) === String((it as { id: string }).id)))
                (d[k] as AnyItem[]).unshift(it);
            });
          });
        }
      } catch { /* ignore */ }
      setData(d);
    });
    const p = localStorage.getItem(LS_KEY);
    if (p) setProfile(JSON.parse(p));
  }, []);

  const allInterests = useMemo(() => {
    if (!data) return [];
    return [...new Set(data.people.map((p) => p.interest).concat(data.communities.map((c) => c.interest)))]
      .filter(Boolean).sort();
  }, [data]);

  const schoolNames = useMemo(() => {
    const names = SCHOOLS.map((s) => s[0]);
    const extra = data ? data.people.map((p) => p.campus) : [];
    return [...new Set(names.concat(extra))].filter(Boolean).sort();
  }, [data]);

  if (!data) return <div className="p-24 text-center text-xl font-extrabold">Loading LOKA…</div>;

  /* ---------------- ONBOARDING ---------------- */
  if (!profile) {
    const ready = name.trim() && interests.length > 0 && campus && goal;
    const toggle = (it: string) =>
      setInterests((cur) => (cur.includes(it) ? cur.filter((x) => x !== it) : [...cur, it]));
    const start = () => {
      const prof: Profile = { name: name.trim() || "friend", interests, campus: campus || null, goal: goal || null };
      localStorage.setItem(LS_KEY, JSON.stringify(prof));
      setProfile(prof);
    };
    return (
      <Shell>
        <div className="animate-rise mx-auto mt-2 max-w-[720px] rounded-[30px] border-[3px] border-ink bg-white p-9 shadow-[8px_10px_0_rgba(0,0,0,0.3)]">
          <h2 className="text-[40px] font-black leading-[1.02] tracking-tight">Select hobbies<br />& interests.</h2>
          <p className="mb-5 mt-1.5 font-semibold text-[#3a3150]">
            Pick what you&apos;re into. LOKA uses it to bridge you to the right people,
            communities, and opportunities across Boston&apos;s campuses.
          </p>

          <StepLabel>1 · Your name</StepLabel>
          <input
            value={name} onChange={(e) => setName(e.target.value)} maxLength={40}
            placeholder="First name — what should LOKA call you?"
            className="w-full rounded-2xl border-[2.5px] border-ink bg-[#f4f1fa] px-5 py-3.5 text-[17px] font-bold outline-none placeholder:font-semibold placeholder:text-[#8a7fa3]"
          />

          <StepLabel>2 · Your interests (pick a few)</StepLabel>
          <div className="grid grid-cols-3 gap-3.5">
            {allInterests.map((it) => {
              const on = interests.includes(it);
              return (
                <button key={it} onClick={() => toggle(it)}
                  className={`flex flex-col items-center gap-2 rounded-[18px] border-[2.5px] border-ink px-3 py-[18px] text-[15px] font-extrabold ${on ? "bg-pick shadow-[3px_4px_0_rgba(0,0,0,0.25)]" : "bg-[#f4f1fa]"}`}>
                  <span className="text-[26px] leading-none">{icon(it)}</span>{it}
                </button>
              );
            })}
          </div>

          <StepLabel>3 · Your school</StepLabel>
          <div className="relative">
            <select value={campus} onChange={(e) => setCampus(e.target.value)}
              className="w-full appearance-none rounded-2xl border-[2.5px] border-ink bg-[#f4f1fa] px-5 py-3.5 pr-11 text-[17px] font-bold outline-none">
              <option value="">Pick your Boston-area school…</option>
              {schoolNames.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
            <span className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2">▾</span>
          </div>

          <StepLabel>4 · What brings you to LOKA?</StepLabel>
          <div className="flex flex-wrap gap-2.5">
            {GOALS.map((g) => (
              <button key={g.v} onClick={() => setGoal(g.v)}
                className={`rounded-full border-[2.5px] border-ink px-[18px] py-2.5 font-bold ${goal === g.v ? "bg-pick shadow-[3px_4px_0_rgba(0,0,0,0.22)]" : "bg-[#f4f1fa]"}`}>
                {g.label}
              </button>
            ))}
          </div>

          <div className="mt-[30px] flex justify-center">
            <button disabled={!ready} onClick={start}
              className="inline-flex items-center gap-3 rounded-full border-[3px] border-ink bg-ink px-[34px] py-4 text-[18px] font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-40">
              Start <span>→</span>
            </button>
          </div>
          <p className="mt-3 text-center text-[13px] font-semibold text-[#6a5e86]">No account. Saved on this device only.</p>
        </div>
      </Shell>
    );
  }

  /* ---------------- HOME ---------------- */
  const resetProfile = () => { localStorage.removeItem(LS_KEY); setProfile(null); };

  const items: AnyItem[] = (() => {
    let arr = [...(data[sec] as AnyItem[])];
    if (feed === "foryou") arr = arr.filter((i) => isForYou(i as { interest?: string; type?: string }, profile));
    arr.sort((a, b) =>
      feed === "foryou"
        ? personalScore(b as { opportunity_score: number }, profile) - personalScore(a as { opportunity_score: number }, profile)
        : (b as { opportunity_score: number }).opportunity_score - (a as { opportunity_score: number }).opportunity_score);
    return arr;
  })();

  const SEC_TITLE: Record<Sec, string> = {
    people: "People to meet", opportunities: "Opportunities & events", communities: "Communities forming",
  };

  const addCreated = (keyList: Sec, item: AnyItem) => {
    (data[keyList] as AnyItem[]).unshift(item);
    const saved = JSON.parse(localStorage.getItem(CREATE_KEY) || '{"people":[],"opportunities":[],"communities":[]}');
    saved[keyList].unshift(item);
    localStorage.setItem(CREATE_KEY, JSON.stringify(saved));
    setData({ ...data });
    setSec(keyList); setFeed("popular"); setCreating(false);
  };

  return (
    <Shell nav={
      <nav className="flex items-center gap-3">
        <button onClick={resetProfile} className="pill">Edit interests</button>
        <a href="/models" className="pill">For creators</a>
        <button onClick={() => setCreating(true)} className="pill solid">+ Create</button>
      </nav>
    }>
      <div className="mb-5 mt-1 flex items-center gap-4">
        <div className="flex size-[58px] items-center justify-center rounded-full border-[3px] border-ink bg-[linear-gradient(135deg,#9b5df0,#2f6df0)] text-2xl font-black text-white">
          {(profile.name || "L").trim()[0].toUpperCase()}
        </div>
        <div>
          <small className="font-bold text-[#4a3f63]">Welcome back,</small>
          <h1 className="text-[30px] font-black leading-none tracking-tight">{profile.name}</h1>
        </div>
      </div>

      <div className="mb-2.5 mt-1.5 flex flex-wrap gap-2.5">
        {(["foryou", "popular"] as Feed[]).map((f) => (
          <button key={f} onClick={() => setFeed(f)}
            className={`rounded-full border-[2.5px] border-ink px-[22px] py-2.5 font-extrabold ${feed === f ? "bg-ink text-white" : "bg-cream"}`}>
            {f === "foryou" ? "For you" : "Most popular"}
          </button>
        ))}
      </div>

      <div className="mb-1.5 mt-[18px] flex flex-wrap gap-2.5">
        {(["people", "opportunities", "communities"] as Sec[]).map((s) => (
          <button key={s} onClick={() => setSec(s)}
            className={`rounded-full border-[2.5px] border-ink px-5 py-2.5 text-sm font-extrabold ${sec === s ? "bg-accent2 text-white" : "bg-transparent"}`}>
            {s[0].toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <section className="my-[30px]">
        <div className="mb-4 flex items-baseline justify-between">
          <h3 className="text-[30px] font-black tracking-tight">{SEC_TITLE[sec]}</h3>
          <div className="text-sm font-bold text-[#3a3150]">
            {items.length} · {feed === "foryou" ? "matched to your interests" : "by opportunity score"}
          </div>
        </div>
        {items.length ? (
          <div className="grid gap-[22px] [grid-template-columns:repeat(auto-fill,minmax(270px,1fr))]">
            {items.map((it, i) => (
              <Card key={(it as { id: string }).id} item={it} i={i} sec={sec} profile={profile}
                onClick={() => setDetail({ sec, id: (it as { id: string }).id })} />
            ))}
          </div>
        ) : (
          <div className="rounded-[18px] border-[3px] border-dashed border-ink bg-white/35 p-[30px] text-center font-bold">
            Nothing matches your interests here yet. Try “Most popular”, or add the first one.
          </div>
        )}
      </section>

      {detail && <DetailModal data={data} target={detail} onClose={() => setDetail(null)} />}
      {creating && <CreateModal data={data} allInterests={allInterests}
        schoolNames={schoolNames} onClose={() => setCreating(false)} onAdd={addCreated} />}
    </Shell>
  );
}

/* ================= small components ================= */
function Shell({ children, nav }: { children: React.ReactNode; nav?: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-[1180px] px-7 pb-24">
      <header className="flex items-center justify-between pb-[18px] pt-[26px]">
        <div className="text-[46px] font-black tracking-[-2px]">L<span className="text-[#8a7bd8]">O</span>KA</div>
        {nav}
      </header>
      <hr className="mb-[26px] mt-1 border-0 border-t-[3px] border-ink" />
      {children}
      <footer className="mt-16 text-center text-[13px] font-semibold text-[#3a3150]">
        LOKA · a bridge between Boston&apos;s campuses · synthetic demo data · events ranked by the LOKA ML model
      </footer>
    </div>
  );
}
function StepLabel({ children }: { children: React.ReactNode }) {
  return <div className="mb-3 mt-[22px] text-[14px] font-extrabold uppercase tracking-wide text-[#6a5e86]">{children}</div>;
}

function ScorePill({ item, profile }: { item: AnyItem; profile: Profile | null }) {
  const mine = isForYou(item as { interest?: string; type?: string }, profile);
  const v = Math.round(mine ? personalScore(item as { opportunity_score: number }, profile) : (item as { opportunity_score: number }).opportunity_score);
  return (
    <span className={`rounded-full border-2 border-ink px-3 py-1.5 text-[12.5px] font-bold text-white ${mine ? "bg-[#1dbf73]" : "bg-accent2"}`}>
      {mine ? "for you" : "fit"} {v}
    </span>
  );
}

function Card({ item, i, sec, profile, onClick }: { item: AnyItem; i: number; sec: Sec; profile: Profile | null; onClick: () => void }) {
  const [a, b] = pal(sec === "opportunities" ? i + 2 : sec === "communities" ? i + 4 : i);
  return (
    <div onClick={onClick}
      className="flex cursor-pointer flex-col overflow-hidden rounded-[22px] border-[3px] border-ink bg-card shadow-[6px_7px_0_rgba(0,0,0,0.35)] transition hover:-translate-y-0.5">
      <div className="flex h-[150px] items-start justify-between p-3.5" style={{ background: `linear-gradient(135deg,${a},${b})` }}>
        <span className="rounded-full border-2 border-ink bg-cream px-3 py-1.5 text-[12.5px] font-bold">
          {sec === "people" ? (item as Person).role : sec === "opportunities" ? (item as Opportunity).date : `${(item as Community).members} members`}
        </span>
        <ScorePill item={item} profile={profile} />
      </div>
      <div className="flex-1 bg-cream p-4 pb-5">
        {sec === "people" && <PersonBody p={item as Person} />}
        {sec === "opportunities" && <OppBody o={item as Opportunity} />}
        {sec === "communities" && <CommBody c={item as Community} />}
      </div>
    </div>
  );
}
function Tag({ children }: { children: React.ReactNode }) {
  return <span className="mr-1.5 mt-2.5 inline-block rounded-full border-2 border-ink bg-[#e4dcff] px-2.5 py-0.5 text-xs font-bold">{children}</span>;
}
function PersonBody({ p }: { p: Person }) {
  return (<>
    <div className="mb-2 text-[18px] font-extrabold leading-tight">{p.name} · {p.campus}</div>
    <div className="text-sm leading-relaxed text-[#2c2436]"><b className="font-extrabold">Wants:</b> {p.looking_for}<br />{p.tagline}</div>
    <Tag>{icon(p.interest)} {p.interest}</Tag><Tag>{p.neighborhood}</Tag>
    <div className="mt-2.5 text-[13px] italic text-[#4a3f63]">“{p.match_reason}”</div>
  </>);
}
function OppBody({ o }: { o: Opportunity }) {
  return (<>
    <div className="mb-2 text-[18px] font-extrabold leading-tight">{o.title}</div>
    <div className="text-sm leading-relaxed text-[#2c2436]"><b className="font-extrabold">by {o.host}</b><br />{o.neighborhood}, Boston<br />{o.cost}</div>
    <Tag>{icon(o.interest)} {o.type}</Tag>
  </>);
}
function CommBody({ c }: { c: Community }) {
  return (<>
    <div className="mb-2 text-[18px] font-extrabold leading-tight">{c.name}</div>
    <div className="text-sm leading-relaxed text-[#2c2436]"><b className="font-extrabold">Across:</b> {c.campuses.join(" · ")}<br />{c.neighborhood}</div>
    <Tag>{icon(c.interest)} {c.interest}</Tag>
  </>);
}

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div onClick={onClose} className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(10,6,20,0.55)] p-6">
      <div onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[460px] overflow-hidden rounded-[26px] border-[3px] border-ink bg-white shadow-[10px_12px_0_rgba(0,0,0,0.35)]">
        {children}
      </div>
    </div>
  );
}

function DetailModal({ data, target, onClose }: { data: Seed; target: { sec: Sec; id: string }; onClose: () => void }) {
  const it = (data[target.sec] as AnyItem[]).find((x) => String((x as { id: string }).id) === String(target.id));
  if (!it) return null;
  const [a, b] = pal(0);
  let title = "", meta: React.ReactNode = null, link = { href: "#", label: "" }, primary = "Open";
  if (target.sec === "people") {
    const p = it as Person; title = `${p.name} · ${p.campus}`; primary = "Connect"; link = linkForPerson(p);
    meta = <><b>Role:</b> {p.role}<br /><b>Looking for:</b> {p.looking_for}<br />{p.tagline}<br /><b>Interest:</b> {p.interest} · <b>Area:</b> {p.neighborhood}<br /><i>“{p.match_reason}”</i></>;
  } else if (target.sec === "opportunities") {
    const o = it as Opportunity; title = o.title; primary = "Join / RSVP"; link = linkForOpp(o);
    meta = <><b>Host:</b> {o.host}<br /><b>When:</b> {o.date}<br /><b>Where:</b> {o.neighborhood}, Boston<br /><b>Cost:</b> {o.cost}<br /><b>Type:</b> {o.type}</>;
  } else {
    const c = it as Community; title = c.name; primary = "Join now"; link = linkForComm(c);
    meta = <><b>Interest:</b> {c.interest}<br /><b>Members:</b> {c.members}<br /><b>Across:</b> {c.campuses.join(" · ")}<br /><b>Area:</b> {c.neighborhood}</>;
  }
  return (
    <Overlay onClose={onClose}>
      <div className="h-[120px]" style={{ background: `linear-gradient(135deg,${a},${b})` }} />
      <div className="p-6">
        <h3 className="mb-1.5 text-[26px] font-black tracking-tight">{title}</h3>
        <div className="mb-3.5 font-semibold leading-relaxed text-[#3a3150]">{meta}</div>
        <div className="mt-[18px] flex gap-3">
          <a href={link.href} target="_blank" rel="noopener noreferrer"
            className="flex-1 rounded-full border-[3px] border-ink bg-ink px-3 py-3.5 text-center text-[16px] font-extrabold text-white">{primary} →</a>
          <button onClick={onClose} className="flex-1 rounded-full border-[3px] border-ink bg-white px-3 py-3.5 text-[16px] font-extrabold">Close</button>
        </div>
        <div className="mt-2.5 text-xs font-semibold text-[#8a7fa3]">{link.label}. (Synthetic demo data — links open a real search until real profiles are added.)</div>
      </div>
    </Overlay>
  );
}

function CreateModal({ data, allInterests, schoolNames, onClose, onAdd }: {
  data: Seed; allInterests: string[]; schoolNames: string[];
  onClose: () => void; onAdd: (sec: Sec, item: AnyItem) => void;
}) {
  const [type, setType] = useState<"opportunity" | "person" | "community">("opportunity");
  const [f, setF] = useState<Record<string, string>>({});
  const set = (k: string, v: string) => setF((cur) => ({ ...cur, [k]: v }));
  const hoods = Object.keys(data.neighborhood_scores || {}).sort();
  const score = (h: string) => data.neighborhood_scores[h] || 60;

  const submit = () => {
    const nm = (f.name || "").trim();
    if (!nm) { alert("Give it a name/title first."); return; }
    const id = "u" + Date.now();
    if (type === "person") {
      onAdd("people", { id, name: nm, campus: f.campus || "", interest: f.interest || allInterests[0], role: "member",
        tagline: f.tagline || "", looking_for: f.looking || "to connect", neighborhood: f.hood || hoods[0],
        match_reason: "You just added this.", opportunity_score: score(f.hood), url: f.url || "" } as Person);
    } else if (type === "community") {
      onAdd("communities", { id, name: nm, interest: f.interest || allInterests[0],
        campuses: (f.campuses || "").split(",").map((s) => s.trim()).filter(Boolean), members: 1,
        neighborhood: f.hood || hoods[0], opportunity_score: score(f.hood), url: f.url || "" } as Community);
    } else {
      onAdd("opportunities", { id, title: nm, host: f.host || "You", interest: f.interest || allInterests[0],
        type: f.interest || allInterests[0], date: f.date || "TBA", cost: f.cost || "Free",
        neighborhood: f.hood || hoods[0], opportunity_score: score(f.hood), url: f.url || "" } as Opportunity);
    }
  };

  const Field = ({ label, k, ph }: { label: string; k: string; ph?: string }) => (
    <div className="mt-3"><label className="mb-1.5 block text-[13px] font-extrabold text-[#3a3150]">{label}</label>
      <input value={f[k] || ""} onChange={(e) => set(k, e.target.value)} placeholder={ph}
        className="w-full rounded-xl border-[2.5px] border-ink bg-[#f4f1fa] px-3.5 py-2.5 font-semibold outline-none" /></div>
  );
  const Pick = ({ label, k, opts }: { label: string; k: string; opts: string[] }) => (
    <div className="mt-3"><label className="mb-1.5 block text-[13px] font-extrabold text-[#3a3150]">{label}</label>
      <select value={f[k] || ""} onChange={(e) => set(k, e.target.value)}
        className="w-full rounded-xl border-[2.5px] border-ink bg-[#f4f1fa] px-3.5 py-2.5 font-semibold outline-none">
        <option value="">Choose…</option>{opts.map((o) => <option key={o} value={o}>{o}</option>)}
      </select></div>
  );

  return (
    <Overlay onClose={onClose}>
      <div className="p-6">
        <h3 className="mb-3 text-[26px] font-black tracking-tight">+ Create on LOKA</h3>
        <div className="grid grid-cols-3 gap-2.5">
          {([["opportunity", "📅", "Opportunity"], ["person", "🙋", "My profile"], ["community", "🌐", "Community"]] as const).map(([t, ic, lbl]) => (
            <button key={t} onClick={() => setType(t)}
              className={`rounded-2xl border-[2.5px] border-ink px-2 py-4 text-sm font-extrabold ${type === t ? "bg-pick shadow-[3px_4px_0_rgba(0,0,0,0.2)]" : "bg-[#f4f1fa]"}`}>
              <span className="mb-1.5 block text-2xl">{ic}</span>{lbl}
            </button>
          ))}
        </div>

        {type === "person" && <>
          <Field label="Your name" k="name" ph="e.g. Alex" />
          <Pick label="School" k="campus" opts={schoolNames} />
          <Pick label="Interest" k="interest" opts={allInterests} />
          <Field label="I'm looking for" k="looking" ph="e.g. a co-founder, a mentor" />
          <Field label="One line about you" k="tagline" ph="e.g. Building a campus art collective" />
          <Pick label="Neighborhood" k="hood" opts={hoods} />
          <Field label="Link (optional)" k="url" ph="https://…" />
        </>}
        {type === "community" && <>
          <Field label="Community name" k="name" ph="e.g. Boston Creatives Collective" />
          <Pick label="Interest" k="interest" opts={allInterests} />
          <Field label="Campuses (comma-separated)" k="campuses" ph="e.g. BU, Northeastern, Emerson" />
          <Pick label="Neighborhood" k="hood" opts={hoods} />
          <Field label="Link (optional)" k="url" ph="https://…" />
        </>}
        {type === "opportunity" && <>
          <Field label="Title" k="name" ph="e.g. Intro to Startups Workshop" />
          <Field label="Host (org / business)" k="host" ph="e.g. CIC Boston" />
          <Pick label="Interest / type" k="interest" opts={allInterests} />
          <Field label="Date" k="date" ph="e.g. Nov 12" />
          <Field label="Cost" k="cost" ph="e.g. Free" />
          <Pick label="Neighborhood" k="hood" opts={hoods} />
          <Field label="Link (optional)" k="url" ph="https://eventbrite…" />
        </>}

        <div className="mt-[18px] flex gap-3">
          <button onClick={submit} className="flex-1 rounded-full border-[3px] border-ink bg-ink px-3 py-3.5 text-[16px] font-extrabold text-white">Post it →</button>
          <button onClick={onClose} className="flex-1 rounded-full border-[3px] border-ink bg-white px-3 py-3.5 text-[16px] font-extrabold">Cancel</button>
        </div>
      </div>
    </Overlay>
  );
}
