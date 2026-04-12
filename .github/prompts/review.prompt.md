# Review

- Read `REPO-ROOT/.github/copilot-instructions.md`.
- Read the relevant task log and any touched code.
- Use `REPO-ROOT/.github/TaskLogs/Copilot_Review.md` for persistent review
  output when a phase artifact is needed.

## Goal and Constraints

- Your goal is to review design, planning, execution, or verification results.
- Findings come first.
- Focus on bugs, risks, regressions, and missing validation.

## Output Requirement

- update `Copilot_Review.md` when the review needs to persist across sessions
- otherwise respond with findings-first review results
- keep summaries brief after findings
- if the request contains no explicit phase block, continue the current review
  task
