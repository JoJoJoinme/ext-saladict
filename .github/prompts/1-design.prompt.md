# Design

- Read `REPO-ROOT/.github/copilot-instructions.md`.
- Read `REPO-ROOT/Project.md`.
- Read `REPO-ROOT/.github/TaskLogs/Copilot_Scrum.md` and
  `REPO-ROOT/.github/TaskLogs/Copilot_Task.md`.

## Goal and Constraints

- Your goal is to finish a design document in `Copilot_Task.md`.
- Only update `Copilot_Task.md`.
- Do not change source code in this phase.

## Copilot_Task.md Structure

- `# !!!TASK!!!`
- `# PROBLEM DESCRIPTION`
- `# UPDATES`
- `# INSIGHTS AND REASONING`
- `# AFFECTED PROJECTS`
- `# !!!FINISHED!!!`

## Request Handling

- `# Problem`: create or replace the design document from the selected scrum
  task or from the direct problem statement.
- `# Update`: append an update and revise the design.
- If no phase block exists, continue the current design document.

## Output Requirement

- provide architecture-level reasoning
- identify affected files / modules / test layers
- cite relevant baseline and runtime-boundary docs
- keep the design high-level
- ensure `# !!!FINISHED!!!` exists at the end
