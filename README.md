# Loka (Hackit)

React + Next.js + Tailwind frontend with a FastAPI backend that trains/tests student–event models, builds **GMM tiers**, and returns **top 10** rankings (overall + per model).

## Run on localhost:10001

```bash
# one-time
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cd frontend && npm install && cd ..

# terminal A — API
source .venv/bin/activate
uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload

# terminal B — Loka UI
cd frontend && npm run dev
```

Open **http://localhost:10001**

Or: `bash scripts/dev.sh`

## Stack

- **Frontend:** React, Next.js 15, Tailwind — prompt boxes for 8 models, tier summary, top 10, per-model rankings
- **Backend:** FastAPI + scikit-learn — 5-fold CV, then GaussianMixture tiers on model scores
- **Data:** `boston_student_creative_events_features.csv`

## Offline ML scripts

```bash
python engineer_features.py
python train_interest_model.py
```
