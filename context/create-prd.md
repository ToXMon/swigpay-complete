# PRD Creation Prompt

## How to Use

In Windsurf Cascade, say:
```
Use @create-prd.md
Here's what I want to build: [describe your feature in detail]
Reference these existing files: [optional: @file1.ts @file2.ts]
Save the PRD as docs/prd-[feature-name].md
```

---

## The Prompt (copy this into Cascade)

```
You are a product manager helping me build a software feature. Create a clear, structured PRD based on the feature description I provide below.

## PRD Template to Follow

---
# PRD: [Feature Name]

## Overview
[2-3 sentence summary of what this is and why it matters]

## Problem Statement
[What problem does this solve? Who has this problem?]

## Goals
- [Goal 1 — measurable outcome]
- [Goal 2]
- [Goal 3]

## Non-Goals (Out of Scope)
- [What this explicitly does NOT include]

## User Stories
As a [user type], I want to [action] so that [benefit].
- US-001: [story]
- US-002: [story]
- US-003: [story]

## Functional Requirements
### Core Requirements (Must Have)
1. [Requirement]
2. [Requirement]

### Secondary Requirements (Should Have)
1. [Requirement]

### Future Considerations (Could Have)
1. [Requirement]

## Technical Constraints
- [Constraint 1, e.g. "Must use existing Supabase database"]
- [Constraint 2, e.g. "Must deploy to Solana devnet"]
- [Constraint 3, e.g. "Must complete in <4 hours of build time"]

## Acceptance Criteria
For the feature to be considered complete:
1. [Criterion — specific, testable]
2. [Criterion]
3. [Criterion]

## UI/UX Notes
[Key screens or interactions to build, if applicable]

## Dependencies
- [External APIs, libraries, or services required]

## Success Metrics
- [How will we know this worked?]
---

Feature I want to build:
[USER INPUT HERE]

Existing code to reference:
[REFERENCE FILES HERE]
```

---

## Tips for Better PRDs

- **Be specific about constraints** — "must work on Solana devnet" is better than "blockchain-based"
- **Include acceptance criteria** — these become the task's `passes` conditions in Ralph mode
- **List non-goals explicitly** — prevents scope creep during autonomous execution
- **User stories map to PRD JSON stories** — structure them so each one is implementable in 1 session
- **Technical constraints = guardrails** — the agent will respect these when making architecture decisions
