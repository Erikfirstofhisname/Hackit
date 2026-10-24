# Repository Kiro configuration design

## Overview

The implementation uses Kiro's repository-scoped `.kiro` convention. It deliberately creates project configuration from reviewed repository facts instead of copying the Kiro Web host's internal `/projects/.kiro` state.

## Structure

```text
.kiro/
├── .gitignore
├── README.md
├── steering/
│   ├── product.md
│   ├── structure.md
│   └── tech.md
└── specs/
    └── repository-kiro-configuration/
        ├── design.md
        ├── requirements.md
        └── tasks.md
```

## Decisions

- Steering files use `inclusion: always` because their guidance applies repository-wide.
- Guidance describes existing commands and behavior observed in source files and package manifests.
- A local `.gitignore` blocks common caches, logs, sessions, databases, and local settings while leaving intentional steering and specs trackable.
- No settings, MCP credentials, hooks, agents, or skills are added merely for appearance; future additions should solve a concrete project need and be reviewed like code.

## Security boundary

The project directory must never be populated by copying the Kiro Web service-level `/projects/.kiro` directory. That location can contain sessions, indexes, cloud state, and other machine-specific data unrelated to this repository.
