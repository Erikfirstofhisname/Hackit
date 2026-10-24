# frontme — LOKA frontend port (notes for review)

This branch ports the **LOKA student-facing app** onto the React/Next.js frontend.
Erik's ML backend and model console are kept intact.

## What changed
- `frontend/src/app/page.tsx` — **new LOKA home**: onboarding (name, interests,
  Boston-school dropdown, goal) → personalized home (For you / Most popular tabs,
  People / Opportunities / Communities section nav) → clickable cards → detail
  modal → working **+ Create** form. Design = LOKA lavender/black (reference look).
- `frontend/src/app/models/page.tsx` — Erik's 8-model train/rank console, **moved
  here unchanged** (git rename). Reachable at `/models`, linked from the home nav
  as "For creators". Nothing of his was deleted.
- `frontend/src/app/loka.ts` — shared types, personalization scoring, Boston
  schools list, link builders, and data loading.
- `frontend/src/app/globals.css` — LOKA lavender/black tokens + `.pill` buttons.
- `frontend/src/app/layout.tsx` — title/description updated to LOKA.

## Data wiring (decided with the team)
- **Opportunities/events** → the backend's real ML output. `rankings_top10.csv`
  is converted to `frontend/public/data/events.json` by
  `scripts/build_events_json.py`. The page loads this instantly — **no FastAPI
  wait** (the live `/api/run` refresh can be added once the train button is fast).
- **People + Communities** → `frontend/public/data/seed.json` (carried from the
  HTML prototype; the backend has no person/community data).
- `opportunity_score` for events = `predicted_interest × 10`.

## Rebuild the data
```bash
python3 scripts/build_events_json.py   # rankings_top10.csv -> events.json
```

## Run (not yet done here — deferred for low memory)
```bash
cd frontend && npm install
npm run dev          # http://localhost:10000
```
The code is written and statically checked (brace/import balance), but
`npm install` + type-check + dev server were **not** run on the build host
(memory was critically low). **To verify before merge:** run `npm run dev`,
load `/`, walk onboarding → cards → Create, and check `/models` still trains.

## Open questions for the team
- Live `/api/run` refresh button on the user page — want it, or keep the page
  purely instant from `events.json`?
- Events are top-10 only (that's all `rankings_top10.csv` holds) — export more?
