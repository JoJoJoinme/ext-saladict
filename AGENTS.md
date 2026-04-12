# General Instruction

- Read `REPO-ROOT/.github/copilot-instructions.md` before performing any work.
  - `copilot-instructions.md` is the workflow contract for this repository.
  - Read `Accessing Task Documents`, `Phase Dispatch`, `Product Baseline`, and
    `Verification Gates` before making decisions.
- Read `REPO-ROOT/Project.md` before performing any work.

## Step 1

Read the first word of the latest user request, and read an additional
instruction file when it is:

- `scrum`: `REPO-ROOT/.github/prompts/0-scrum.prompt.md`
- `design`: `REPO-ROOT/.github/prompts/1-design.prompt.md`
- `plan`: `REPO-ROOT/.github/prompts/2-planning.prompt.md`
- `summarize`: `REPO-ROOT/.github/prompts/3-summarizing.prompt.md`
- `execute`: `REPO-ROOT/.github/prompts/4-execution.prompt.md`
- `verify`: `REPO-ROOT/.github/prompts/5-verifying.prompt.md`
- `ask`: `REPO-ROOT/.github/prompts/ask.prompt.md`
- `investigate`: `REPO-ROOT/.github/prompts/investigate.prompt.md`
- `code`: `REPO-ROOT/.github/prompts/code.prompt.md`
- `kb`: `REPO-ROOT/.github/prompts/kb.prompt.md`
- `refine`: `REPO-ROOT/.github/prompts/refine.prompt.md`
- `review`: `REPO-ROOT/.github/prompts/review.prompt.md`

### Exceptions

- If the latest request is exactly `execute and verify`, perform `execute`
  first and `verify` second.
- If the first word is not in the list:
  - Follow `REPO-ROOT/.github/prompts/code.prompt.md`.
  - Skip `Step 2`.

## Step 2

Only applies when the first word is:

- `scrum`
- `design`
- `plan`
- `summarize`
- `execute`
- `investigate`
- `review`
- `kb`

If there is a second word, convert it to a title `# THE-WORD`.

## Step 3

Keep the remaining content as-is.
Treat the processed content as "the latest request" in the additional
instruction file.
Follow that instruction file and start working immediately.
