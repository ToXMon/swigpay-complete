---
description: Run the full test suite, auto-fix failures where possible, and report results. Run /run-tests before any commit or PR.
---

# Run Tests Workflow

1. Detect the project's test setup:
   ```bash
   cat package.json | grep -E '"test"|"jest"|"vitest"|"playwright"'
   ```

2. Run the full test suite:
   ```bash
   npm test -- --coverage 2>&1 | tail -50
   ```

3. Run TypeScript type check:
   ```bash
   npx tsc --noEmit 2>&1
   ```

4. Run linter:
   ```bash
   npx eslint . --format compact 2>&1 | head -50
   ```

5. For each failure:
   - Print: "FAILURE: [file]:[line] — [error message]"
   - Attempt auto-fix if the error is:
     - A type error with a clear fix (wrong type, missing property)
     - A lint error with an `--fix` flag solution
     - A test failure caused by an outdated snapshot
   - Do NOT auto-fix: logic errors, architectural issues, breaking changes

6. After attempting fixes, re-run checks once.

7. Report summary:
   ```
   ✅ TypeCheck: PASS
   ✅ Lint: PASS (0 warnings)
   ⚠️  Tests: 47/50 passing
      FAIL: [test name] — [reason] — needs human review
   ```

8. If all green: "All checks pass. Ready to commit — run /commit"
   If failures remain: List each remaining failure with the file and reason. Do not commit.
