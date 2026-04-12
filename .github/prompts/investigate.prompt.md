# Investigate

- Read `REPO-ROOT/.github/copilot-instructions.md`.
- Read `REPO-ROOT/Project.md`.
- Use `REPO-ROOT/.github/TaskLogs/Copilot_Investigate.md` as the fixed
  investigation artifact.

## Goal and Constraints

- Your goal is to finish an investigation document in `Copilot_Investigate.md`
  and use tests / runtime tools to confirm or deny hypotheses.
- Investigation may touch source code, tests, browser automation, and logs when
  necessary.

## Copilot_Investigate.md Structure

- `# !!!INVESTIGATE!!!`
- `# PROBLEM DESCRIPTION`
- `# UPDATES`
- `# TEST`
- `# PROPOSALS`
- optional `# REPORT`
- `# !!!FINISHED!!!`

## Request Handling

- `# Repro`: start a fresh investigation
- `# Continue`: continue and append updates
- `# Report`: produce the final report from confirmed / denied proposals
- if nothing is specified, treat it as `# Continue`

## Output Requirement

- separate confirmed facts from hypotheses
- record concrete repro / validation methods
- mark proposals as `[CONFIRMED]` or `[DENIED]`
- keep the document useful for the next interrupted session
