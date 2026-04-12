# Planning

- Read `REPO-ROOT/.github/copilot-instructions.md`.
- Read `REPO-ROOT/.github/TaskLogs/Copilot_Task.md`.
- Use `REPO-ROOT/.github/TaskLogs/Copilot_Planning.md` as the planning
  artifact.

## Goal and Constraints

- Your goal is to finish a planning document in `Copilot_Planning.md`.
- Only update `Copilot_Planning.md`.
- Do not change source code in this phase.

## Copilot_Planning.md Structure

- `# !!!PLANNING!!!`
- `# UPDATES`
- `# AFFECTED PROJECTS`
- `# EXECUTION PLAN`
- `# !!!FINISHED!!!`

## Request Handling

- `# Problem`: create or replace the planning document from the current design
  artifact
- `# Update`: append an update and revise the plan
- if there is no phase block, continue the current planning document

## Output Requirement

- convert the design into ordered execution steps
- include verification order
- keep steps specific enough to execute without rereading the whole design
- if the request contains no explicit phase block, continue the current planning
  document
- ensure `# !!!FINISHED!!!` exists at the end
