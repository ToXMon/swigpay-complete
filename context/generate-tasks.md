# Task Generation Prompt

## How to Use

In Windsurf Cascade, after creating a PRD:
```
Take @docs/prd-[feature-name].md and generate a task list using @generate-tasks.md
Save it as tasks/tasks-[feature-name].md
```

---

## The Prompt (copy this into Cascade)

```
You are a senior software engineer breaking down a PRD into a structured implementation plan.

Using the PRD provided, generate a detailed task list following these rules:

## Task List Rules

1. **Organize by implementation phase** — backend before frontend, DB before API, API before UI
2. **One task = one logical unit** — completable in a single Cascade context window (~300 lines of code change)
3. **Subtasks are atomic** — each subtask changes only one file or one concern
4. **Acceptance criteria on every subtask** — not just "it works" but specific, testable conditions
5. **Frontend tasks end with browser verification** — always include "Verify in browser" as final step
6. **Type-check on every task** — add `typecheck passes` to every TypeScript task's acceptance criteria
7. **Keep the order** — tasks must be ordered so each one builds on the previous

## Task List Format

```markdown
# Task List: [Feature Name]
Generated from: docs/prd-[feature-name].md
Branch: feature/[feature-name]

## Phase 1: [Data Layer / Setup]

- [ ] 1.1 [Task Title]
  - Description: [what needs to happen]
  - Files: `path/to/file.ts`
  - Acceptance criteria:
    - [ ] [Specific outcome 1]
    - [ ] [Specific outcome 2]
    - [ ] Typecheck passes

- [ ] 1.2 [Task Title]
  - Description: [what needs to happen]
  - Files: `path/to/other-file.ts`
  - Acceptance criteria:
    - [ ] [Specific outcome]
    - [ ] Typecheck passes

## Phase 2: [API / Backend Logic]

- [ ] 2.1 [Task Title]
  ...

## Phase 3: [Frontend / UI]

- [ ] 3.1 [Task Title]
  - Description: [what needs to happen]
  - Files: `components/MyComponent.tsx`
  - Acceptance criteria:
    - [ ] [UI outcome]
    - [ ] Typecheck passes
    - [ ] Verify in browser: navigate to [URL], confirm [behavior]

## Phase 4: [Testing / Cleanup]

- [ ] 4.1 Write tests for [feature]
  - Description: Integration test covering the full [feature] pipeline
  - Files: `tests/[feature].test.ts`
  - Acceptance criteria:
    - [ ] All tests pass
    - [ ] Covers happy path + 2 error cases
```

## Instructions to Agent

When working through tasks:
- Complete ONLY the current subtask, then STOP
- Mark the subtask `[x]` complete when done
- Run quality checks (typecheck, lint, tests)
- Commit with: `feat: [task-id] - [task title]`
- Wait for user approval before moving to the next task

PRD to convert:
[PASTE PRD CONTENT OR REFERENCE @docs/prd-feature.md]
```

---

## Task Sizing Guide

| Task Size | Lines of Code | Context Window | Examples |
|-----------|--------------|----------------|---------|
| Good | 10-100 lines | Fits easily | Add one DB column, create one API endpoint |
| Acceptable | 100-200 lines | Fits with care | Create one React component with logic |
| Too large | 200+ lines | Split it | "Build the entire auth system" |

**Rule of thumb:** If you can't describe the task in one sentence, split it.
