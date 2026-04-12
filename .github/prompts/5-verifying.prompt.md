# Verifying

- Read `REPO-ROOT/.github/copilot-instructions.md`.
- Read `REPO-ROOT/Project.md`.
- Read `REPO-ROOT/.github/TaskLogs/Copilot_Execution.md`.

## Goal and Constraints

- Your goal is to verify the current execution result and update
  `Copilot_Execution.md`.
- You may run builds, tests, and browser verification.
- Only make code changes if verification uncovers a concrete issue that must be
  fixed immediately.

## Verification Order

1. run the smallest focused checks needed for the touched area
2. run repository gate(s)
3. use `Playwright -> MCP` for browser confirmation when applicable

## Required Repository Context

- minimum user-visible gate: `npm run test:required`
- runtime-boundary sensitive changes should also consider:
  - `npm test -- --runInBand test/specs/background/offscreen-helper.spec.ts`
  - `npm test -- --runInBand test/specs/background/dict-runtime.spec.ts`
  - `npm run test:e2e:playwright`

## Completion

- record command results and boundaries in `Copilot_Execution.md`
- add `# !!!VERIFIED!!!` when the task has been fully verified
