# !!!SCRUM!!!

# DESIGN REQUEST

按轮子哥仓库的工作方式，把 ext-saladict 的 phase protocol 固化成同构骨架，
先把入口、artifact、prompt、task log 名称和继续工作机制固定下来，再谈优化。

# UPDATES

## UPDATE

当前仓库已经有 `docs/workboard.md`、`verification-report`、`investigate`
artifact 和 phase 研究文档，但还没有 GacUI 那种首词分流 + 固定 task logs +
固定 prompt 文件。

## UPDATE

固定 artifact、prompt、继续工作机制已经落地：

- `.github/TaskLogs/` 已冻结固定 phase artifact 名称
- `.github/prompts/` 已覆盖首词分流与 continue 语义
- `AGENTS.md`、`CLAUDE.md`、`.github/copilot-instructions.md`、
  `Project.md`、`.github/KnowledgeBase/Index.md` 已连成同一套入口图
- `execute and verify` 复合分流与“无 phase block 时继续当前 artifact”的机制
  已显式写入协议
- phase 协议自检脚本已加入仓库，便于后续会话验证协议骨架没有漂移

# TASKS

- [x] TASK No.1: Introduce GacUI-shaped protocol entrypoints
- [x] TASK No.2: Freeze GacUI-shaped task-log artifacts
- [x] TASK No.3: Wire repository guidance to the new phase system

## TASK No.1: Introduce GacUI-shaped protocol entrypoints

Establish the same top-level workflow shape as GacUI: request dispatch by first
word, a shared copilot instruction entry, a repo project file, and a repo-local
knowledge base index.

### what to be done

- add `AGENTS.md` and `CLAUDE.md` dispatch rules in GacUI shape
- add `.github/copilot-instructions.md`
- add `Project.md`
- add `.github/KnowledgeBase/Index.md`

### rationale

Without a dispatcher and shared workflow entrypoint, the repository still
depends on chat-context recovery instead of phase recovery.

## TASK No.2: Freeze GacUI-shaped task-log artifacts

Create the fixed persistent artifact names used by the phase system so the next
session can resume from repo state instead of from the last conversation.

### what to be done

- add `.github/TaskLogs/Copilot_Scrum.md`
- add `.github/TaskLogs/Copilot_Task.md`
- add `.github/TaskLogs/Copilot_Planning.md`
- add `.github/TaskLogs/Copilot_Execution.md`
- add `.github/TaskLogs/Copilot_KB.md`
- add `.github/TaskLogs/Copilot_Investigate.md`
- add `.github/TaskLogs/Copilot_Review.md`

### rationale

The repository already has useful evidence and workboard docs, but not under a
single fixed artifact set that every session can rely on.

## TASK No.3: Wire repository guidance to the new phase system

Make the new protocol visible to future sessions without removing the existing
MV3 and product baseline docs that still carry the actual project knowledge.

### what to be done

- add GacUI-shaped prompt files under `.github/prompts/`
- point prompts to the new task logs and the existing repo baseline docs
- keep existing docs under `docs/` as source material instead of duplicating
  their content

### rationale

The protocol only becomes real when the prompts, task logs, and knowledge base
all point to the same artifact graph.

# Impact to the Knowledge Base

## ext-saladict

- add the phase-protocol entry files and task-log locations to the knowledge
  base index
- keep runtime, baseline, and verification documents as linked source material

# !!!FINISHED!!!
