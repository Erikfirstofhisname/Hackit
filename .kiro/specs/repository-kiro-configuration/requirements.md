# Repository Kiro configuration requirements

## Purpose

Version project-specific Kiro context with the Loka source code so contributors and reviewers can understand how Kiro supports development without exposing private runtime data.

## Requirements

### 1. Discoverable Kiro configuration

**User story:** As a contributor, I want Kiro guidance stored in the repository so that project context is available consistently.

#### Acceptance criteria

1. The repository shall contain a root `.kiro` directory.
2. The directory shall explain which Kiro features are represented.
3. The configuration shall include product, technology, and repository-structure steering.

### 2. Accurate project guidance

**User story:** As a developer using Kiro, I want guidance grounded in the current codebase so that generated changes follow established behavior.

#### Acceptance criteria

1. Steering shall identify the frontend and backend technology stacks.
2. Steering shall document supported setup and verification commands without inventing unavailable test commands.
3. Steering shall capture key API, accessibility, and ML-pipeline constraints.

### 3. Safe source control

**User story:** As a repository owner, I want only shareable Kiro configuration committed so that private session and machine data remain excluded.

#### Acceptance criteria

1. The repository shall not contain copied Kiro Web session, cache, credential, or machine-state data.
2. Ignore rules shall guard common local Kiro runtime artifacts.
3. Documentation shall tell contributors not to commit secrets or personal state.
