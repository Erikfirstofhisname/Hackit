---
inclusion: always
---

# Technology and verification

## Stack

- Frontend: Next.js 15 App Router, React 19, TypeScript, Tailwind CSS 4, and ESLint.
- Backend: FastAPI, Pydantic, pandas, NumPy, and scikit-learn.
- Data: `boston_student_creative_events_features.csv` is the online pipeline dataset.

## Local setup

Run Python commands from the repository root so package imports and data paths resolve correctly.

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cd frontend && npm install
```

Start the API with `uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload` and the UI with `cd frontend && npm run dev`. The UI runs on port 10001. `bash scripts/dev.sh` is the combined development entry point.

## Validation

- Run `cd frontend && npm run lint` after frontend changes.
- Run `cd frontend && npm run build` for production-build verification.
- The repository does not currently define an automated test suite or Python lint command; do not claim those checks ran.
- The online backend pipeline uses deterministic random state 42 and three-fold cross-validation. Preserve those semantics unless a change explicitly requires otherwise.
