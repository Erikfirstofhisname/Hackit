#!/usr/bin/env python3
"""Convert the backend's precomputed rankings into a static events.json the
LOKA frontend can load instantly (no FastAPI round-trip, no training wait).

Reads  : rankings_top10.csv   (produced by train_interest_model.py)
Writes : frontend/public/data/events.json

Run from the repo root:  python3 scripts/build_events_json.py
"""
import csv
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "rankings_top10.csv")
OUT = os.path.join(ROOT, "frontend", "public", "data", "events.json")

# map backend event_type codes -> friendly titles for cards
TITLE = {
    "local_market": "Local Market",
    "art_showcase": "Art Showcase",
    "creative_workshop": "Creative Workshop",
    "community_service": "Community Service Day",
    "networking": "Networking Night",
    "coworking": "Coworking Session",
}


def cost_label(row):
    if str(row.get("is_free", "")).strip() in ("1", "1.0", "true", "True"):
        return "Free"
    usd = row.get("event_cost_usd", "").strip()
    try:
        return f"${int(float(usd))}" if usd else "Paid"
    except ValueError:
        return "Paid"


def main():
    with open(SRC, newline="") as f:
        rows = list(csv.DictReader(f))

    events = []
    for r in rows:
        etype = (r.get("event_type") or "").strip()
        pred = r.get("predicted_interest", "")
        try:
            score = round(float(pred) * 10, 1)  # 0-10 predicted -> 0-100 scale
        except ValueError:
            score = 0.0
        events.append({
            "id": r.get("record_id", "").strip() or f"ev{len(events)}",
            "title": TITLE.get(etype, etype.replace("_", " ").title() or "Event"),
            "host": (r.get("campus_group") or "Boston").strip(),
            "type": (r.get("primary_interest") or etype).strip(),
            "interest": (r.get("primary_interest") or "").strip(),
            "neighborhood": (r.get("event_neighborhood") or "").strip(),
            "date": "Upcoming",
            "cost": cost_label(r),
            "opportunity_score": score,
            "rank": int(r.get("rank", 0) or 0),
            "source": "ml_ranking",
        })

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w") as f:
        json.dump({"generated_from": "rankings_top10.csv", "events": events}, f, indent=2)
    print(f"wrote {len(events)} events -> {OUT}")


if __name__ == "__main__":
    main()
