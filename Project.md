# Project

## Repository Scope

This repository targets:

- Chrome / Edge Manifest V3
- WXT + Vite
- `npm` as the package manager

Current runtime status:

- Chrome / Edge MV3 runtime is already migrated
- ongoing work is mainly product-behavior alignment and workflow hardening

## Task Logs

The GacUI-shaped workflow artifacts for this repository live in:

- `REPO-ROOT/.github/TaskLogs/Copilot_Scrum.md`
- `REPO-ROOT/.github/TaskLogs/Copilot_Task.md`
- `REPO-ROOT/.github/TaskLogs/Copilot_Planning.md`
- `REPO-ROOT/.github/TaskLogs/Copilot_Execution.md`
- `REPO-ROOT/.github/TaskLogs/Copilot_KB.md`
- `REPO-ROOT/.github/TaskLogs/Copilot_Investigate.md`
- `REPO-ROOT/.github/TaskLogs/Copilot_Review.md`

The current cross-session entry is:

- `REPO-ROOT/.github/TaskLogs/Copilot_Scrum.md`

## Knowledge Base

The repository knowledge base entry is:

- `REPO-ROOT/.github/KnowledgeBase/Index.md`

Read that file to find:

- architecture and runtime boundary docs
- product baseline docs
- verification and collaboration docs
- current work registry

## Build and Verification

Primary commands:

```bash
npm run dev
npm run build
npm test
npm run test:acceptance
npm run test:e2e
npm run test:e2e:playwright
npm run test:required
```

Focused runtime-boundary checks:

```bash
npm test -- --runInBand test/specs/background/offscreen-helper.spec.ts
npm test -- --runInBand test/specs/background/dict-runtime.spec.ts
```

## Browser Automation Context

Default order:

1. Playwright
2. MCP

Proxy convention:

- `http://127.0.0.1:7890`

## Current Workflow Note

This repository now uses a GacUI-shaped phase protocol:

- phase-prefixed requests dispatch to prompt files
- each phase persists into a fixed artifact under `.github/TaskLogs`
- repo docs under `docs/` remain the source material and evidence base
