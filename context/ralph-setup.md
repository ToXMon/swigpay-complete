# Ralph — Autonomous Coding Loop Setup

Ralph is an autonomous AI agent loop that runs a coding agent (Cascade, Claude Code, or Amp) repeatedly until all PRD stories are complete. Each run is a fresh context window — memory persists via git history, `progress.txt`, and `prd.json`.

Source: https://github.com/snarktank/ralph (Ryan Carson / snarktank — 13k+ stars)

---

## How Ralph Works

```
┌─────────────────────────────────────────────────────────────────┐
│                        RALPH LOOP                                │
│                                                                  │
│  [prd.json] ──► Pick story where passes:false (highest priority) │
│       │                                                          │
│       ▼                                                          │
│  Implement story (fresh agent context)                           │
│       │                                                          │
│       ▼                                                          │
│  Run quality checks (typecheck, lint, test)                      │
│       │                    │                                     │
│    PASS                  FAIL                                    │
│       │                    │                                     │
│       ▼                    ▼                                     │
│  git commit           Fix & retry                                │
│  prd.json passes:true                                            │
│  append progress.txt                                             │
│       │                                                          │
│       ▼                                                          │
│  All stories done? ──► YES ──► COMPLETE                         │
│       │                                                          │
│      NO                                                          │
│       │                                                          │
│  Next iteration (new fresh context)                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Installation (Copy into Your Project)

```bash
# Clone Ralph
git clone https://github.com/snarktank/ralph.git /tmp/ralph

# Copy scripts into your project
mkdir -p scripts/ralph
cp /tmp/ralph/ralph.sh scripts/ralph/
cp /tmp/ralph/prompt.md scripts/ralph/
chmod +x scripts/ralph/ralph.sh
```

Or install globally for Amp:
```bash
cp -r /tmp/ralph/skills/prd ~/.config/amp/skills/
cp -r /tmp/ralph/skills/ralph ~/.config/amp/skills/
```

---

## Key Files

| File | Purpose |
|------|---------|
| `scripts/ralph/ralph.sh` | The bash loop that spawns fresh agent instances |
| `scripts/ralph/prompt.md` | Instructions given to each agent iteration |
| `prd.json` | Active PRD with user stories + `passes` status |
| `progress.txt` | Append-only learnings log (Codebase Patterns section is critical) |
| `AGENTS.md` | Living context — updated by agent after each session |

---

## `prd.json` Format

```json
{
  "project": "MyApp",
  "branchName": "ralph/feature-name",
  "description": "Brief description of what this feature does",
  "userStories": [
    {
      "id": "US-001",
      "title": "Add X to database",
      "description": "As a developer, I need Y so that Z.",
      "acceptanceCriteria": [
        "Specific, testable criterion 1",
        "Typecheck passes",
        "Tests pass"
      ],
      "priority": 1,
      "passes": false,
      "notes": ""
    },
    {
      "id": "US-002",
      "title": "Display X in UI",
      "description": "As a user, I want to see X so that I can do Y.",
      "acceptanceCriteria": [
        "Component renders X correctly",
        "Typecheck passes",
        "Verify in browser using dev-browser skill"
      ],
      "priority": 2,
      "passes": false,
      "notes": ""
    }
  ]
}
```

**Priority ordering:** Lower number = implement first. Always sequence: DB → API → UI → Tests.

**Story sizing rule:** Each story must be implementable in one context window (approx 100-200 lines of change).

---

## Converting a Task List to `prd.json`

In Cascade or Claude Code:
```
Load the ralph skill and convert tasks/tasks-[feature-name].md to prd.json
Place the output at prd.json in the project root.
Branch name should be: ralph/[feature-name]
```

Or manually convert your `tasks-[feature].md` to the JSON format above.

---

## Running Ralph

```bash
# Default: 10 iterations with Amp
./scripts/ralph/ralph.sh

# Custom iterations
./scripts/ralph/ralph.sh 20

# Use Claude Code instead of Amp
./scripts/ralph/ralph.sh --tool claude 15

# Check progress mid-run
cat prd.json | jq '.userStories[] | {id, title, passes}'
cat progress.txt
git log --oneline -10
```

---

## `progress.txt` Structure

Ralph appends to this file automatically. The `## Codebase Patterns` section is the most valuable:

```markdown
## Codebase Patterns
[Agent fills this in — most important reusable discoveries]
- Use `sql<number>` template for aggregations
- Always use `IF NOT EXISTS` for migrations
- Export types from actions.ts for UI components

---

## 2026-03-23T14:00:00 - US-001
- What was implemented: Added priority column to tasks table
- Files changed: lib/db/schema.ts, migrations/001_add_priority.sql
- Learnings:
  - Migration must run before seeding — update seed script order
  - Priority enum: 'high' | 'medium' | 'low', default 'medium'
---
```

---

## Rules for Story Design (Critical for Success)

1. **One concern per story** — "Add DB column" is one story. "Add DB column AND display in UI" is two.
2. **Acceptance criteria = test conditions** — Write them so a fresh agent can verify them without context.
3. **Frontend stories must include browser verification** — `"Verify in browser using dev-browser skill"`
4. **Type checking on every story** — `"Typecheck passes"` in every acceptance criteria.
5. **Size limit** — If implementing a story requires changing more than 3 files, split it.

---

## Antfarm (Multi-Agent Ralph)

For complex features needing parallel agent teams:

```bash
# Install antfarm (built on Ralph — Ryan Carson + OpenClaw)
curl -fsSL https://raw.githubusercontent.com/snarktank/antfarm/v0.5.1/scripts/install.sh | bash
```

Antfarm workflows:
- `feature-dev` — plan → setup → implement → verify → test → PR → review (7 agents)
- `bug-fix` — triage → investigate → setup → fix → verify → PR (6 agents)
- `security-audit` — scan → prioritize → fix → verify → test → PR (7 agents)

Each agent gets fresh context, verifiers check each other's work. Nothing ships without a code review.
