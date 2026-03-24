# Rules Setup — .windsurfrules + AGENTS.md

## File Locations

| File | Location | Scope |
|------|----------|-------|
| `.windsurfrules` | Project root | All Cascade interactions in this workspace |
| `AGENTS.md` | Project root | Always-on global project context |
| `AGENTS.md` | Any subdirectory | Auto-scoped to that directory's files |
| `global_rules.md` | `~/.codeium/windsurf/memories/global_rules.md` | All workspaces on this machine |

---

## Root `.windsurfrules` Template

Create this at your project root. Customize the `[PROJECT-SPECIFIC]` sections.

```markdown
# Windsurf Cascade Rules

## Code Style
- Language: TypeScript (strict mode). No `any` types — use `unknown` or explicit types.
- File size: NEVER create files longer than 300 lines. Split into modules if needed.
- Directory size: No more than 20 files per directory. Create subdirectories.
- Formatting: Prettier + ESLint. Run before every commit.
- Imports: Absolute imports from `@/` alias. Never relative imports beyond one level.
- Functions: max 4 parameters, max 50 executable lines.

## Commit Discipline
- ALWAYS commit after completing each subtask.
- Commit format: `type: [TASK-ID] - description`
  - Types: feat, fix, refactor, docs, test, chore
- NEVER commit broken code. All quality checks must pass first.
- NEVER commit `.env` or secrets.

## Quality Gates (run before every commit)
- `npx tsc --noEmit` — zero type errors
- `npx eslint .` — zero lint errors
- `npm test` — all tests passing
- For Next.js: `npm run build` must succeed

## Agent Behavior
- Work on ONE task at a time.
- After each subtask: mark complete, commit, then STOP and wait for user go-ahead.
  (Exception: Ralph mode — continue autonomously)
- ALWAYS update AGENTS.md with newly discovered patterns.
- NEVER skip the quality gate — even if the change looks small.
- If you hit a blocker: document it in progress.txt, do NOT silently skip.

## Architecture
- [PROJECT-SPECIFIC: describe your layers, e.g. "API routes in /app/api, DB in /lib/db"]
- All config in ONE centralized config file. Everything else imports from it.
- Database: define a typed interface, implement JSON (dev) and real DB (prod).
  Switch via `DATABASE=json|supabase` env var.

## Environment
- Secrets in `.env` only. Always update `.env.example` with placeholder values.
- Node version: [PROJECT-SPECIFIC]
- Package manager: [npm | yarn | pnpm — pick one]

## Testing
- Unit tests for all business logic.
- Integration tests that run the full pipeline.
- Frontend stories: ALWAYS verify in browser before marking complete.
- Output each pipeline step to `/data/step-XX-[name].json` for debugging.

## Tech Stack
- [PROJECT-SPECIFIC: e.g. "Next.js 15, TypeScript, Tailwind, Supabase, Solana Web3.js"]
- [PROJECT-SPECIFIC: e.g. "Anchor programs in /programs, TypeScript client in /app"]

## Security
- NEVER hardcode API keys, private keys, or wallet keypairs.
- Validate all user inputs.
- Use parameterized queries — no string concatenation for SQL.
```

---

## Root `AGENTS.md` Template

This lives at the project root and loads on every Cascade session.

```markdown
# [Project Name] — Agent Context

## What This Project Does
[1-2 sentence description of what you're building]

## Tech Stack
- Frontend: [e.g. Next.js 15 + TypeScript + Tailwind]
- Backend: [e.g. Node.js API routes + Supabase]
- Chain: [e.g. Solana devnet, Anchor programs]
- Auth: [e.g. Clerk, NextAuth, wallet-based]

## Directory Map
- `/app` — Next.js app router pages and API routes
- `/components` — Shared UI components
- `/lib` — Business logic, DB clients, utilities
- `/programs` — Anchor Solana programs (Rust)
- `/docs` — PRDs and design documents
- `/tasks` — Generated task lists
- `/scripts` — Automation scripts (Ralph, deploy, etc.)

## Key Conventions
- Config: all config in `/lib/config.ts` — import from there, never duplicate
- DB interface: `/lib/db/interface.ts` — switch via `DATABASE` env var
- Types: centralized in `/lib/types.ts`
- API: REST at `/app/api/[resource]/route.ts`

## Active Development
- Current branch: [feature/xxx]
- Active PRD: [docs/prd-xxx.md]
- Active task list: [tasks/tasks-xxx.md]

## Codebase Patterns
[Updated by agent after each session — leave blank initially]

## Known Gotchas
[Updated by agent after each session — leave blank initially]
```

---

## Module-Level AGENTS.md Examples

### `/frontend/AGENTS.md`
```markdown
# Frontend Guidelines

## Component Rules
- Functional components with hooks only. No class components.
- File naming: `ComponentName.tsx`, `useHookName.ts`, `ComponentName.test.tsx`
- CSS: Tailwind utility classes. No inline styles. No CSS modules unless necessary.
- State: Zustand for global state. `useState` for local. React Query for server state.
- Exports: named exports only. No default exports except pages.

## File Structure (per component)
```
ComponentName/
├── ComponentName.tsx
├── ComponentName.test.tsx
└── index.ts          # re-export
```

## Solana Wallet
- Use `@solana/react-hooks` (not legacy wallet-adapter)
- Connection: always use the env-configured RPC URL
- Never hardcode devnet/mainnet — use `NEXT_PUBLIC_SOLANA_NETWORK`
```

### `/backend/AGENTS.md` (or `/api/AGENTS.md`)
```markdown
# Backend / API Guidelines

## Route Structure
- REST: GET /resource (list), GET /resource/:id, POST /resource, PUT/PATCH /resource/:id, DELETE /resource/:id
- Always return: `{ data, error, meta }` shape
- Always handle errors: wrap every handler in try/catch, return 500 on unexpected

## Database
- All queries via `/lib/db/` — never query directly in route handlers
- Use transactions for multi-step writes
- Validate schemas with Zod before writing

## Auth
- Check auth in middleware, not in individual handlers
- Never trust client-provided user IDs — always derive from session
```

---

## Global Rules (Machine-Wide)

Save to `~/.codeium/windsurf/memories/global_rules.md`:

```markdown
# Global Cascade Rules (All Projects)

## Always
- Use TypeScript. Never JavaScript unless the project is already JS.
- Use the project's established package manager (check package.json or .npmrc).
- Follow existing code patterns — read 2-3 existing files before creating new ones.
- Commit convention: `type: description` (feat/fix/refactor/docs/test/chore)

## Never
- Never commit .env files
- Never use `any` in TypeScript
- Never create files over 300 lines without splitting
- Never skip quality checks before committing

## Context
- Always read AGENTS.md and progress.txt at the start of a new session
- Always update AGENTS.md with patterns discovered during the session
```
