# Summarizing

- Read `REPO-ROOT/.github/copilot-instructions.md`.
- Read `REPO-ROOT/.github/TaskLogs/Copilot_Task.md`.
- Read `REPO-ROOT/.github/TaskLogs/Copilot_Planning.md`.
- Use `REPO-ROOT/.github/TaskLogs/Copilot_Execution.md` as the target
  artifact.

## Goal and Constraints

- Your goal is to prepare an execution-ready summary in `Copilot_Execution.md`.
- Only update `Copilot_Execution.md`.
- Do not change source code in this phase.

## Copilot_Execution.md Structure

- `# !!!EXECUTION!!!`
- `# PROBLEM DESCRIPTION`
- `# UPDATES`
- `# EXECUTION STEPS`
- `# AFFECTED PROJECTS`
- `# !!!FINISHED!!!`

## Request Handling

- `# Problem`: create or replace the execution-ready summary from the current
  design and planning artifacts
- if there is no phase block, continue the current summarizing artifact

## Output Requirement

- compress design + planning into an execution-ready handoff
- keep only the information needed by the next execution session
- make restart easy after interruption
- if the request contains no explicit phase block, continue the current
  summarizing artifact
- ensure `# !!!FINISHED!!!` exists at the end
