---
inclusion: always
---

# Repository structure and conventions

## Layout

- `frontend/src/app/`: Next.js routes, pages, layouts, and route handlers.
- `frontend/src/components/`: reusable presentation components.
- `frontend/src/lib/`: shared TypeScript types, formatting, options, and browser persistence helpers.
- `frontend/public/`: static assets.
- `backend/main.py`: FastAPI application and HTTP contracts.
- `backend/ml.py`: model catalog, training, scoring, ranking, and tiering pipeline.
- `scripts/`: development orchestration.
- Root Python scripts: offline feature engineering and model training.

## Conventions

- Keep frontend API types synchronized with backend response contracts and model IDs.
- Prefer existing `@/components` and `@/lib` helpers over duplicating logic in route pages.
- Client-only App Router modules must declare `"use client"`.
- Preserve semantic HTML, labels, focus behavior, `aria-live` error feedback, and disabled/loading states.
- Keep feature and target columns explicit in the ML pipeline, and preserve target-leakage protections when introducing new targets.
- Normalize pandas and NumPy values before returning JSON.
- Keep repository-relative paths based on `pathlib.Path`; avoid machine-specific absolute paths.
