# General Instruction

- Read `REPO-ROOT/.github/copilot-instructions.md` before performing any work.
- Read `REPO-ROOT/Project.md` before performing any work.

## Request Dispatch

Interpret the latest user request by its first word:

- `scrum` -> `.github/prompts/0-scrum.prompt.md`
- `design` -> `.github/prompts/1-design.prompt.md`
- `plan` -> `.github/prompts/2-planning.prompt.md`
- `summarize` -> `.github/prompts/3-summarizing.prompt.md`
- `execute` -> `.github/prompts/4-execution.prompt.md`
- `verify` -> `.github/prompts/5-verifying.prompt.md`
- `ask` -> `.github/prompts/ask.prompt.md`
- `investigate` -> `.github/prompts/investigate.prompt.md`
- `code` -> `.github/prompts/code.prompt.md`
- `kb` -> `.github/prompts/kb.prompt.md`
- `refine` -> `.github/prompts/refine.prompt.md`
- `review` -> `.github/prompts/review.prompt.md`

If the first word does not match, follow `.github/prompts/code.prompt.md`.

## Current Repository Focus

- Chrome / Edge MV3 runtime on WXT + Vite.
- Browser verification order is `Playwright -> MCP`.
- Product and runtime baseline live in the knowledge base index and linked docs.
- Phase persistence lives in `.github/TaskLogs/`.
