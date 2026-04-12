# General Instruction

- `REPO-ROOT` refers to the repository root.
- Before doing any work, read:
  - `REPO-ROOT/Project.md`
  - `REPO-ROOT/.github/KnowledgeBase/Index.md`
- Before changing source code, reread the target files and respect existing
  uncommitted edits in the worktree.
- This repository has a dirty worktree frequently. Do not revert unrelated user
  changes.

## Phase Dispatch

Interpret the latest user request by the first word:

- `scrum` -> `REPO-ROOT/.github/prompts/0-scrum.prompt.md`
- `design` -> `REPO-ROOT/.github/prompts/1-design.prompt.md`
- `plan` -> `REPO-ROOT/.github/prompts/2-planning.prompt.md`
- `summarize` -> `REPO-ROOT/.github/prompts/3-summarizing.prompt.md`
- `execute` -> `REPO-ROOT/.github/prompts/4-execution.prompt.md`
- `verify` -> `REPO-ROOT/.github/prompts/5-verifying.prompt.md`
- `ask` -> `REPO-ROOT/.github/prompts/ask.prompt.md`
- `investigate` -> `REPO-ROOT/.github/prompts/investigate.prompt.md`
- `code` -> `REPO-ROOT/.github/prompts/code.prompt.md`
- `kb` -> `REPO-ROOT/.github/prompts/kb.prompt.md`
- `refine` -> `REPO-ROOT/.github/prompts/refine.prompt.md`
- `review` -> `REPO-ROOT/.github/prompts/review.prompt.md`

If the first word is not in this list, use `code.prompt.md`.

## Accessing Task Documents

Phase artifacts are stored in `REPO-ROOT/.github/TaskLogs`:

- `Copilot_Scrum.md`
- `Copilot_Task.md`
- `Copilot_Planning.md`
- `Copilot_Execution.md`
- `Copilot_KB.md`
- `Copilot_Investigate.md`
- `Copilot_Review.md`

These are the persistent continue-work artifacts.

## Knowledge Base

The repository knowledge base index is:

- `REPO-ROOT/.github/KnowledgeBase/Index.md`

Use it to find:

- architecture and runtime boundaries
- product baseline
- validation gates
- current work registry

## Product Baseline

For migration, compatibility, behavior-preservation, and user-visible changes,
baseline discovery must use both:

- explicit product baseline
- historical / implementation baseline

The primary baseline carriers are:

- `REPO-ROOT/docs/user-intent-acceptance.md`
- `REPO-ROOT/test/acceptance/spec.json`
- `REPO-ROOT/docs/workboard.md`

Before implementation, classify the task as one of:

- `baseline_sufficient`
- `baseline_gap`
- `exploratory_spike`

## Runtime Boundaries

The main runtime boundary docs are:

- `REPO-ROOT/docs/architecture.md`
- `REPO-ROOT/MV3_MIGRATION.md`
- `REPO-ROOT/docs/mv3-runtime-boundaries.md`

Important runtime rules:

- background owns privileged extension APIs
- offscreen only owns DOM / audio / clipboard / HTML parsing
- dictionary engines must not reintroduce cookies / storage / DNR /
  `webRequest`

## Verification Gates

Default browser verification order:

1. Playwright
2. MCP

Proxy convention:

- `http://127.0.0.1:7890`

Minimum gate for user-visible changes:

```bash
npm run test:required
```

If touching runtime boundaries, also prefer:

```bash
npm test -- --runInBand test/specs/background/offscreen-helper.spec.ts
npm test -- --runInBand test/specs/background/dict-runtime.spec.ts
npm run test:e2e:playwright
```

## Working With This Repository

- Use `rg` / `rg --files` for searching.
- Prefer non-destructive changes.
- Keep protocol changes under `.github/` and task-log files unless the current
  phase explicitly calls for product code changes.
