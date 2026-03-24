---
description: Structured refactor workflow following the 2/3 cadence. Reduces code bloat, splits large files, removes duplication, and updates AGENTS.md with patterns. Run /refactor when feature work is complete and code needs cleanup.
---

# Refactor Workflow

## When to Use
After 2 days of feature work, spend 3 days refactoring. This is the "2/3 cadence" that keeps AI-generated code sustainable.

## Steps

1. Analyze the codebase for structural issues:
   ```bash
   # Files over 300 lines (must be split)
   find . -name "*.ts" -o -name "*.tsx" | xargs wc -l | sort -rn | head -20

   # Directories over 20 files
   for dir in $(find . -type d -not -path '*/node_modules/*' -not -path '*/.git/*'); do
     count=$(ls "$dir" | wc -l); [ "$count" -gt 20 ] && echo "$count $dir"
   done
   ```

2. Generate an ASCII state machine diagram of the current architecture:
   "Create a state machine diagram of this codebase's data flow and component relationships. Use ASCII art. Show all states, transitions, and the main data structures."

3. Identify and list:
   - Files over 300 lines → split plan
   - Duplicate code → consolidation targets
   - Unused exports → removal candidates
   - Any `any` types → strict typing plan
   - Hardcoded values that should be config → centralize

4. Present refactor plan before touching code:
   ```
   Refactor Plan:
   1. Split lib/utils.ts (450 lines) → lib/format.ts + lib/validate.ts + lib/transform.ts
   2. Extract duplicated auth logic (in 3 files) → lib/auth/session.ts
   3. Fix 4 remaining `any` types in api/routes.ts
   4. Move 3 hardcoded URLs to lib/config.ts
   ```
   Ask: "Approve this plan? (yes/modify)"

5. Execute refactor changes. After each file change:
   - Run `npx tsc --noEmit` — zero type errors before moving on
   - Do NOT change behavior — refactor only, no new features

6. After all changes, run full quality gate:
   ```bash
   npx tsc --noEmit && npx eslint . && npm test
   ```

7. Update AGENTS.md with patterns discovered:
   - New module structure that emerged
   - Conventions enforced by the refactor
   - Anything future agents should know about this codebase

8. Commit with: `refactor: structural cleanup — [brief description]`
