# Execution

- Read `REPO-ROOT/.github/copilot-instructions.md`.
- Read `REPO-ROOT/Project.md`.
- Read `REPO-ROOT/.github/TaskLogs/Copilot_Execution.md`.

## Goal and Constraints

- Your goal is to implement the current execution task and keep
  `Copilot_Execution.md` in sync.
- You may change source files and `Copilot_Execution.md`.
- Respect the dirty worktree and do not revert unrelated user edits.

## Execution Rules

- reread target files before editing
- keep changes aligned with MV3 runtime boundaries
- for user-visible or compatibility-sensitive changes, preserve baseline
  traceability
- record meaningful execution updates in `Copilot_Execution.md`

## Verification During Execution

- run the smallest useful validation while implementing
- keep the repository minimum gate in mind: `npm run test:required`
- if touching runtime boundaries, prefer focused unit tests and Playwright E2E

## Completion

- update `Copilot_Execution.md` with what changed and what remains
- if the task is complete and ready for full validation, leave the artifact in a
  state that the `verify` phase can continue immediately
- if the request contains no explicit phase block, continue the current
  execution work
