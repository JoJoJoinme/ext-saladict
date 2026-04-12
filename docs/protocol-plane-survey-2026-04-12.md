# Protocol Plane Survey

Date: 2026-04-12

Scope: survey existing implementations that could inform a reusable
`Protocol Plane` for agent collaboration, with the immediate target being
Codex-first and the broader target being Codex + Claude Code interoperability.

This document is intentionally a survey, not a final specification.

---

## 1. Goal

We do **not** want to design an agent protocol from scratch before checking what
already exists.

The immediate question is:

> Do existing tools already satisfy our collaboration needs, and if not, what
> exactly is still missing?

The broader question is:

> If we define a `Protocol Plane`, can it be a thin compatibility layer on top
> of Codex / Claude Code / existing orchestration tools, rather than a brand-new
> agent runtime?

---

## 2. Evaluation Criteria

To compare implementations, this survey uses nine dimensions.

1. `Identity / Resume`
   - Can an agent/session be resumed, forked, or reattached reliably?
2. `Shared Project Context`
   - Are repo-level instructions, MCP config, skills, or rules shared in a
     first-class way?
3. `Task Model`
   - Is there a shared task list, claim/complete semantics, or delegation model?
4. `Runtime Registry`
   - Is there an explicit place to record active runtime state such as
     worktrees, panes, browser endpoints, or session IDs?
5. `Lifecycle Hooks / Events`
   - Are there lifecycle events for startup, task creation, completion, stop,
     worktree creation, and so on?
6. `Isolation`
   - Can multiple workers operate safely via worktrees, sandboxes, or isolated
     contexts?
7. `Inter-Agent Communication`
   - Can workers message each other directly, or only through a lead?
8. `Evidence / Gate Integration`
   - Is there a structured way to run validations and capture their outputs?
9. `Cross-Tool Portability`
   - Can the same collaboration structure plausibly span Codex and Claude Code?

---

## 3. Claude Code Official

Primary references:

- Claude Code agent teams:
  https://code.claude.com/docs/en/agent-teams
- Claude Code subagents:
  https://code.claude.com/docs/en/sub-agents
- Claude Code hooks:
  https://code.claude.com/docs/en/hooks
- `.claude` directory:
  https://code.claude.com/docs/en/claude-directory

### 3.1 Strengths

- Claude Code has the clearest **official** answer to the protocol problem.
- It already exposes project-scoped shared state through:
  - `CLAUDE.md`
  - `.claude/settings.json`
  - `.mcp.json`
  - skills
  - subagents
  - project memory
- Official docs explicitly distinguish:
  - `subagents` for delegation within one session
  - `agent teams` for coordination across separate sessions
- Agent teams introduce protocol-like primitives that are directly relevant to
  our problem:
  - lead / teammate roles
  - shared task list
  - direct inter-agent messaging
  - local team config and task state
- Hooks provide a strong lifecycle surface:
  - `SessionStart`
  - `SessionEnd`
  - `SubagentStart`
  - `SubagentStop`
  - `TaskCreated`
  - `TaskCompleted`
  - `WorktreeCreate`
  - `WorktreeRemove`
  - `TeammateIdle`
- `.claude` is effectively a built-in project protocol directory.

### 3.2 Weaknesses

- Agent teams are still marked experimental, and the docs explicitly mention
  limitations around:
  - session resumption
  - task coordination
  - shutdown behavior
- The official structure is Claude-native, not cross-tool neutral.
- The task model is stronger than Codex CLI's public model, but still not a
  general standard others automatically implement.
- Evidence capture is hook-friendly, but there is no official cross-tool
  `evidence package` schema.

### 3.3 Assessment

If the goal were **Claude-only** collaboration, the official stack is already
close to sufficient. It is the best existing reference model for our
`Protocol Plane`.

---

## 4. Codex Official

Primary references:

- Codex app:
  https://openai.com/index/introducing-the-codex-app/
- Codex launch post:
  https://openai.com/index/introducing-codex/
- ChatGPT plan overview for Codex:
  https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan

Additional local observations from this environment on 2026-04-12:

- `codex resume --help`
- `codex fork --help`
- `codex mcp list`
- local state under `~/.codex/`

### 4.1 Strengths

- Codex officially supports:
  - multiple agents in parallel in the app
  - built-in worktrees
  - cloud environments
  - skills
  - automations
- Official materials clearly position Codex around:
  - long-running tasks
  - asynchronous delegation
  - multi-agent workflows
- In local CLI usage, we already have protocol-relevant primitives:
  - `resume`
  - `fork`
  - shared local session storage under `~/.codex/sessions`
  - shared MCP configuration
- `AGENTS.md` gives repo-level behavioral instructions.
- Codex app, CLI, and IDE extension are described as sharing history and
  configuration, which is useful for continuity across surfaces.

### 4.2 Weaknesses

- Compared with Claude Code, Codex's **publicly documented** protocol surface is
  still less explicit.
- We do not currently have a public official Codex document equivalent to
  Claude's `agent teams` page that defines:
  - a shared task list
  - direct inter-agent messaging
  - team-local runtime config schema
  - lifecycle hook events
- Much of Codex's parallel-work story is currently app/cloud-centric rather than
  local CLI protocol-centric.
- `AGENTS.md` is useful, but it is not yet a full project protocol directory in
  the same sense as `.claude/`.
- In practice, for local orchestration work, we still end up inspecting CLI
  behavior and local state directly.

### 4.3 Assessment

Codex already has many of the right **primitives**, but not yet the same degree
of explicit, official protocol design that Claude Code exposes. For a
Codex-first `Protocol Plane`, we should build on these primitives, not replace
them.

---

## 5. Community Orchestrators

These are not standards, but they are useful because they show what users keep
building on top of official tools.

### 5.1 Claude Squad

Reference:

- https://github.com/smtg-ai/claude-squad

What it provides:

- manages multiple local terminal agents in one interface
- supports Claude Code, Codex, Gemini, Aider, and others
- isolates each task in its own git workspace
- uses `tmux` and session management
- allows pause/resume/checkout-like flows

Strength:

- strong execution-plane tooling
- cross-agent-program support
- practical proof that people want one supervisor over multiple agent CLIs

Weakness:

- mainly a session/workspace manager, not a full protocol standard
- task semantics and evidence semantics are still app-defined
- relies on its own state and UI rather than a neutral repo-local contract

### 5.2 xlaude

Reference:

- https://github.com/Xuanwo/xlaude

What it provides:

- worktree-native workflow
- reads both Claude and Codex session archives
- can auto-resume Codex sessions for matching worktrees
- keeps its own JSON state file

Strength:

- directly relevant to Codex + Claude interoperability
- demonstrates that a shared layer can map multiple tool-specific session
  stores

Weakness:

- mostly solves worktree/session management
- does not define a shared task model, evidence model, or inter-agent messaging

### 5.3 SwarmSDK / Claude Swarm

Reference:

- https://github.com/parruda/swarm

What it provides:

- explicit agent orchestration
- hooks
- persistent memory
- structured collaboration model
- multiple model providers

Strength:

- strong protocol and orchestration thinking
- shows what users add when the native CLI model is not enough

Weakness:

- this is effectively its own runtime/framework
- it is not a thin layer on top of Codex CLI or Claude Code
- useful for ideas, but less suitable as a drop-in compatibility baseline

---

## 6. MCP Official

Primary references:

- https://modelcontextprotocol.io/docs/sdk
- https://modelcontextprotocol.io/docs/python/servers

### 6.1 What MCP Solves

MCP standardizes how tools, prompts, resources, and transports are exposed to
AI applications.

This is valuable for:

- tool interoperability
- remote/local transport consistency
- UI-capable tool extensions
- server discovery and reuse

### 6.2 What MCP Does Not Solve For Us

MCP is **not** a full agent collaboration protocol.

It does not, by itself, define:

- task ownership
- handoff semantics
- shared workboard format
- runtime registry schema
- inter-agent messaging
- evidence package structure

### 6.3 Assessment

MCP should be treated as an important building block for the `Execution Plane`,
not as a complete `Protocol Plane`.

---

## 7. Systematic Multi-Agent Frameworks

These frameworks matter because they address the concern:

> Maybe the collaboration problem has already been solved systematically
> elsewhere, and we are rediscovering it from scratch.

The answer is:

- yes, parts of it have been solved systematically
- but often inside a framework-owned runtime, not across existing native coding
  CLIs like Codex CLI and Claude Code

### 7.1 OpenAI Agents SDK

Primary references:

- https://developers.openai.com/api/docs/guides/agents-sdk
- https://openai.github.io/openai-agents-js/guides/agents/
- https://openai.github.io/openai-agents-js/guides/handoffs/
- https://openai.github.io/openai-agents-js/guides/sessions/
- https://openai.github.io/openai-agents-js/guides/tracing/
- https://openai.github.io/openai-agents-js/guides/tools/

What it solves well:

- manager/specialist composition
- handoffs between agents
- sessions for conversation state
- tracing of generations, tools, guardrails, and handoffs
- local MCP server integration
- serializable `RunState`

Assessment:

- This is a real, systematic solution for multi-agent orchestration.
- But it is aimed at applications built *inside* the Agents SDK runtime.
- It does not directly solve repo-local cross-session collaboration between
  native coding CLIs.

### 7.2 LangGraph / LangSmith / Deep Agents

Primary references:

- https://docs.langchain.com/oss/python/langgraph
- https://docs.langchain.com/oss/javascript/langchain/multi-agent/handoffs
- https://docs.langchain.com/langsmith/core-capabilities
- https://docs.langchain.com/langsmith/server-a2a
- https://docs.langchain.com/oss/python/deepagents/deploy

What it solves well:

- long-running, stateful agent orchestration
- explicit workflow graphs
- multi-agent handoffs
- persistence and checkpointing
- distributed tracing and debugging
- A2A endpoints
- MCP endpoints
- deployment/runtime infrastructure

Assessment:

- This is one of the strongest existing systematic solutions.
- It is especially strong for production agent systems.
- But it expects the workflow to live inside the LangGraph/LangSmith runtime.
- It is not a thin compatibility layer over existing coding-agent CLIs.

### 7.3 AutoGen Teams

Primary reference:

- https://microsoft.github.io/autogen/stable/user-guide/agentchat-user-guide/tutorial/teams.html

What it solves well:

- explicit team abstractions
- multiple team topologies
- speaker selection / turn control
- handoff-style transitions
- runtime observability for team behavior

Assessment:

- This is a systematic collaboration model.
- It is strong conceptually for multi-agent coordination.
- But it is again a framework-native runtime, not a compatibility layer for
  existing coding tools.

### 7.4 CrewAI

Primary references:

- https://docs.crewai.com/
- https://docs.crewai.com/en/concepts/flows
- https://docs.crewai.com/en/observability

What it solves well:

- crews and flows as first-class concepts
- persisted flow state across restarts
- guardrails and HITL hooks
- integrated observability
- task/process modeling

Assessment:

- CrewAI clearly treats collaboration as a systematic runtime problem.
- It solves persistence and observability better than ad hoc shell workflows.
- But it is designed as its own application framework, not as a protocol layer
  over Codex/Claude CLIs.

### 7.5 Summary Of This Category

Systematic solutions already exist for:

- multi-agent orchestration
- handoffs
- persisted workflow state
- observability
- runtime lifecycle

What they generally do **not** provide is:

- a neutral, repo-local collaboration layer that sits on top of native coding
  agents such as Codex CLI and Claude Code
- stable handoff of local browser/runtime state between those existing coding
  tools without moving the whole workflow into a framework-owned runtime

---

## 8. Comparison Summary

| Dimension | Claude Code Official | Codex Official | Claude Squad / xlaude | SwarmSDK |
|---|---|---|---|---|
| Identity / Resume | Strong | Medium-Strong | Medium | Framework-defined |
| Shared Project Context | Strong | Medium | Weak-Medium | Framework-defined |
| Task Model | Strong | Weak-Medium | Weak | Strong |
| Runtime Registry | Medium-Strong | Medium | Medium-Strong | Strong |
| Lifecycle Hooks | Strong | Weak public surface | Weak | Strong |
| Isolation | Strong | Strong | Strong | Medium |
| Inter-Agent Communication | Strong | Weak public surface | Weak | Strong |
| Evidence / Gate Integration | Medium | Medium | Weak | Medium-Strong |
| Cross-Tool Portability | Weak | Weak | Medium-Strong | Medium |

Interpretation:

- Claude Code official is currently the best reference for protocol design.
- Codex official has enough primitives to be a viable target, but less exposed
  protocol structure.
- Community tools are strongest in execution-plane ergonomics.
- Swarm-style frameworks are strongest in protocol thinking, but they tend to
  replace the native tools instead of integrating them.

---

## 9. Do Existing Tools Already Solve This?

### 9.1 Short Answer

They solve **different parts** of the problem.

If we are willing to move the whole workflow into a framework-owned runtime,
then yes: systematic solutions already exist.

If the goal is:

- keep using native coding agents like Codex CLI and Claude Code
- keep using repo-local docs and worktrees
- keep using local browser/MCP/Playwright execution lanes
- and still get stable cross-session collaboration

then the answer is: no, there is not yet a single existing solution that fully
covers that exact combination.

### 9.2 The Important Distinction

There are really two different ambitions:

1. `Adopt an existing multi-agent runtime`
2. `Define a thin collaboration protocol above existing native tools`

Existing frameworks do a strong job at (1).

Our current direction is closer to (2).

That means we should be careful not to compare our goal against the wrong
baseline. We are not trying to outbuild LangGraph, CrewAI, or AutoGen as
orchestration runtimes.

We are trying to decide whether native coding-agent workflows still need a thin
shared protocol layer.

### 9.3 Current Answer

Yes, that thin layer still appears necessary.

Not because the ecosystem lacks systematic agent frameworks, but because the
existing systematic frameworks solve a different layer of the stack.

---

## 10. Do We Need To Write Our Own?

### 10.1 Short Answer

We probably do **not** need to build our own full agent orchestration runtime.

We probably **do** need a thin, repo-local compatibility layer if the goal is:

- Codex-first operation now
- future Claude Code compatibility
- stable cross-session / cross-agent handoff
- shared browser/runtime coordination

### 10.2 What Existing Tools Already Cover

Existing tools already cover a lot:

- Codex:
  - resume/fork
  - MCP config
  - worktrees
  - multi-agent app/cloud execution
- Claude Code:
  - project protocol directory
  - subagents / agent teams
  - hooks / lifecycle events
- Community tools:
  - tmux supervision
  - multi-worktree session management
  - cross-tool launching

### 10.3 What Is Still Missing

No single current tool gives us a cross-Codex-Claude, repo-local, stable
protocol for:

1. task records
2. runtime registry
3. evidence package
4. handoff package
5. ownership / lock semantics
6. stop / block / verify state definitions

That gap is exactly where a thin `Protocol Plane` can help.

### 10.4 Recommendation

Do **not** build:

- a new agent runtime
- a new CLI supervisor
- a new browser automation framework

Do build:

- a small protocol layer that existing tools can project into

That means:

- keep Codex / Claude / tmux / Playwright / MCP as execution engines
- define a shared contract for:
  - task state
  - runtime state
  - evidence state
  - handoff state

This should be thought of as an adapter/spec layer, not a replacement stack.

---

## 11. Requirement Coverage For A Thin Task Protocol

The concern behind this section is:

> Before defining any thin protocol ourselves, have others already solved the
> exact pieces we care about?

The pieces currently under consideration are:

1. truth source
2. state expression
3. runtime registry
4. evidence semantics
5. handoff minimum
6. escalation rules

### 11.1 Truth Source

What we want:

- a clear place that answers:
  - what the task is
  - what counts as success
  - what constraints apply

Existing implementations:

- Claude Code:
  - `CLAUDE.md`
  - `.claude/CLAUDE.md`
  - project memory
- CrewAI:
  - task/process definitions
  - crew/flow configuration
- LangGraph:
  - graph definition as application truth

Assessment:

- Many systems have a project truth source.
- But this truth source is usually framework-native or tool-native.
- We have not found a neutral, repo-local convention that both Codex and Claude
  already honor as a full task truth source beyond basic instruction files.

Conclusion:

- This is only partially solved today.

### 11.2 State Expression

What we want:

- a durable representation of current progress
- enough structure to let a replacement agent understand:
  - current status
  - next step
  - blocked reason
  - verification state

Existing implementations:

- LangGraph:
  - checkpointed graph state
  - resumable interrupts
- OpenAI Agents SDK:
  - sessions
  - run state
- CrewAI:
  - checkpointing
  - flow state persistence
- Claude Code agent teams:
  - team config and task records

Assessment:

- Framework-owned runtimes do this well.
- Native coding-agent tools do this only partially and not in a shared
  cross-tool schema.

Conclusion:

- Solved in frameworks, not solved in a native-tool-neutral way.

### 11.3 Runtime Registry

What we want:

- a way to register live execution resources such as:
  - browser endpoints
  - profile dirs
  - worktrees
  - tmux panes
  - active sessions

Existing implementations:

- Claude Code agent teams:
  - local config/state with session and runtime metadata
- Claude Squad / xlaude:
  - explicit state files and session/worktree bookkeeping
- LangGraph / framework runtimes:
  - runtime-managed orchestration context

Assessment:

- This is well addressed in orchestration layers and framework runtimes.
- It is not consistently exposed in repo-local, tool-agnostic artifacts for
  native coding CLIs.

Conclusion:

- Partially solved, but mostly outside the repo and outside a neutral format.

### 11.4 Evidence Semantics

What we want:

- not just raw logs, but a way to distinguish:
  - verified facts
  - inferred conclusions
  - failing evidence
  - stale evidence

Existing implementations:

- OpenAI Agents SDK:
  - tracing
  - guardrails
  - handoff spans
- LangSmith / LangGraph:
  - tracing
  - observability
  - evaluation/annotation workflows
- CrewAI:
  - observability
  - HITL
  - flow/task state
- Claude Code:
  - hooks for running validations and logging outputs

Assessment:

- Existing systems are strong at evidence capture.
- They are weaker at defining a simple shared repo-local evidence contract like:
  - `verified`
  - `inferred`
  - `superseded`

Conclusion:

- Capture is solved better than semantics.

### 11.5 Handoff Minimum

What we want:

- a replacement agent should be able to answer:
  - where are we
  - what is done
  - what is left
  - what not to repeat
  - what to read first

Existing implementations:

- OpenAI Agents SDK:
  - handoffs between agents inside a run
- AutoGen teams:
  - resumable team conversations
- Claude Code agent teams:
  - task list and team messaging
- community orchestrators:
  - session/worktree managers

Assessment:

- Agent-to-agent handoff inside a managed runtime is solved reasonably well.
- Repo-local, human-readable, cross-tool handoff minimums are still mostly left
  to each team.

Conclusion:

- This remains a live gap for native coding-agent workflows.

### 11.6 Escalation Rules

What we want:

- explicit rules for when to:
  - stop
  - ask a human
  - pause for review
  - branch to another specialist

Existing implementations:

- OpenAI Agents SDK:
  - input/output/tool guardrails
- LangGraph:
  - interrupts
  - human-in-the-loop resumes
- CrewAI:
  - HITL
  - flow-based human feedback
- AutoGen:
  - human-in-the-loop termination and resume patterns
- Claude Code:
  - hooks and task lifecycle events

Assessment:

- This area is strongly covered in framework runtimes.
- But project-specific escalation policy still usually has to be defined by the
  team.

Conclusion:

- Mechanisms exist; policy still needs local definition.

### 11.7 Overall Answer

We are **not** rediscovering the entire problem from scratch.

Existing systems already solve substantial parts of the thin protocol problem,
especially:

- state persistence
- handoffs inside a runtime
- runtime lifecycle
- observability
- escalation mechanisms

However, we have not yet found a single existing implementation that fully and
cleanly gives us all six requirements in this exact form:

- repo-local
- native-tool-compatible
- Codex-friendly
- Claude-compatible
- browser/runtime-aware
- human-readable

That means the remaining work, if any, should be:

- narrow
- compatibility-oriented
- artifact-first

It should **not** be an attempt to recreate LangGraph, CrewAI, AutoGen, or the
OpenAI Agents SDK.

---

## 12. Practical Conclusion For This Repository

For ext-saladict specifically:

1. We should not start by writing a universal multi-agent runtime.
2. We should first define the smallest repo-local `Protocol Plane`.
3. That protocol should be intentionally mappable to:
   - Codex CLI local sessions
   - Codex app/cloud tasks where useful
   - Claude Code `.claude` concepts later
4. Execution should remain delegated to:
   - Playwright for gates
   - MCP/shared browser for persistent inspection
   - tmux/worktrees for orchestration where helpful

The practical design target is therefore:

> a thin protocol that survives session replacement, while reusing existing
> execution tools rather than reinventing them

---

## 13. Next Step

The next useful step is **not** writing the full spec.

The next useful step is defining a **minimum Protocol Plane schema** for this
repo, likely covering only:

- `task`
- `runtime`
- `evidence`
- `handoff`

Anything beyond that should be justified by a concrete execution need.
