---
description: Stage, validate, and commit all changes with a conventional commit message. Run /commit when ready to save progress.
---

# Commit Workflow

1. Show me all changed files:
   ```bash
   git status
   git diff --stat
   ```

2. Run quality checks. Stop and report any failures before proceeding:
   ```bash
   npx tsc --noEmit
   npx eslint . --max-warnings 0
   npm test --passWithNoTests
   ```

3. If all checks pass, determine the commit type based on changes:
   - `feat` — new functionality added
   - `fix` — bug fixed
   - `refactor` — code restructured without behavior change
   - `docs` — documentation only
   - `test` — tests added or fixed
   - `chore` — build scripts, config, tooling

4. Generate a commit message following this format:
   `type: [TASK-ID if available] - short description (max 72 chars)`

5. Show me the proposed commit message and ask: "Commit with this message? (yes/edit/cancel)"

6. On confirmation, stage and commit:
   ```bash
   git add -A
   git commit -m "[approved message]"
   ```

7. Ask: "Push to remote? (yes/no)"
   If yes: `git push origin [current-branch]`

8. Report: "Committed [hash] — [message]. Branch is [X commits ahead of] origin."
