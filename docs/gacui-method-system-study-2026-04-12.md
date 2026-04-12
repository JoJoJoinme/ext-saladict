# GacUI 方法系统性研究

> 日期：2026-04-12
> 目的：把 GacUI 仓库中的 Agent 工作方式当作一个完整系统来理解，而不是只抽取若干 prompt 名称或局部技巧

---

## 1. 研究范围

本次研究基于以下材料：

- `AGENTS.md`
- `CLAUDE.md`
- `.cursorrules`
- `.github/copilot-instructions.md`
- `.github/prompts/*.prompt.md`
- `.github/Scripts/copilotPrepare.ps1`
- `Project.md`

重点不是研究它的 C++ 工程本身，而是研究：

> 它如何把一个长任务组织成可跨会话继续的 Agent 协作流程

---

## 2. GacUI 方法的系统边界

GacUI 这套方法并不是一个“多 Agent runtime”。

它更像是一个 repo-local workflow system，由以下层次组成：

1. `dispatcher`
2. `stage artifacts`
3. `execution constraints`
4. `repair / review / learning loops`

也就是说，它的核心不是“通信协议”，而是：

> 用一组固定文档和固定阶段，把长任务压缩成可中断、可恢复、可纠偏的流水线

---

## 3. Dispatcher：先决定现在处于哪个阶段

### 3.1 首词分流

`AGENTS.md` / `CLAUDE.md` 里的第一件事不是描述风格，而是：

- 读取请求首词
- 把请求映射到特定 prompt

典型入口词包括：

- `scrum`
- `design`
- `plan`
- `summarize`
- `execute`
- `verify`
- `investigate`
- `review`
- `kb`
- `refine`

这意味着系统的第一个判断永远不是：

- “用户想让我自由发挥做什么”

而是：

- “用户要把当前工作送进哪一个阶段”

### 3.2 这一步的意义

这一步很关键，因为它解决了 continue-work 中最容易丢失的那个信息：

> 我现在到底在做哪类工作

如果没有这个判断，会话恢复后通常会发生两件事：

1. 需要重读大量历史才能猜当前上下文
2. 同一个问题在不同会话中被用不同工作模式处理

GacUI 通过显式阶段切断了这种漂移。

---

## 4. Stage Artifacts：每个阶段都有唯一主文档

GacUI 不是把所有信息写在一个 plan 里，而是给不同阶段分配不同 artifact。

主要 artifact 包括：

- `Copilot_Scrum.md`
- `Copilot_Task.md`
- `Copilot_Planning.md`
- `Copilot_Execution.md`
- `Copilot_Investigate.md`
- `Copilot_KB.md`
- `Copilot_Review*.md`

### 4.1 这不是简单拆文件

这里的关键不只是“文件更多”，而是：

- 每个阶段只有一个主 artifact
- 会话恢复时先读该 artifact
- 只有在 artifact 不够时才回看别的内容

这其实就是 continue-work 的主协议。

### 4.2 文档格式是固定的

这些 artifact 都有明显的固定 schema，例如：

- `PROBLEM DESCRIPTION`
- `UPDATES`
- `AFFECTED PROJECTS`
- `EXECUTION PLAN`
- `FIXING ATTEMPTS`
- `TEST`
- `PROPOSALS`
- `REPORT`
- `!!!FINISHED!!!`
- `!!!VERIFIED!!!`

这个固定结构的意义在于：

- 新会话不需要重新理解文档组织方式
- agent 不需要猜“哪段是问题定义，哪段是下一步，哪段是失败记录”

换句话说：

> artifact 不是普通笔记，而是带有行为约束的工作对象

---

## 5. Pipeline：阶段之间不是平铺，而是流水线

从 prompt 设计看，GacUI 的阶段不是并列工具箱，而是一条带方向的流水线。

一个典型 feature/task 任务大致会经过：

1. `scrum`
   - 形成任务拆解和 task list
2. `design`
   - 形成高层设计与影响面
3. `plan`
   - 形成更细的执行和测试计划
4. `summarize`
   - 把 plan 变成可执行执行文档
5. `execute`
   - 真正修改源码
6. `verify`
   - 编译与测试通过
7. `review`
   - 评审文档或结果
8. `refine`
   - 把 learnings 写回系统

另有支线：

- `investigate`
  - 用于排障、根因分析、proposal 试验
- `kb`
  - 用于知识库维护

### 5.1 这里最重要的不是顺序本身

真正重要的是：

- 每个阶段都定义了自己的输入
- 每个阶段都定义了自己的输出
- 当前会话停掉后，下个会话从当前阶段的输入输出继续

所以 continue-work 靠的是：

- 阶段工艺稳定
- artifact 稳定

而不是 session 一直活着。

---

## 6. Continuation：它是如何支持“会话中断后继续”的

这一点是 GacUI 最值得借鉴的地方。

### 6.1 Prompt 本身承认“中断是常态”

多个 prompt 都写了类似逻辑：

- 如果没有新的 `# Problem` / `# Update`
- 说明很可能是被意外打断
- 应继续当前文档的工作

这说明它不是把中断当异常，而是当默认情况来设计。

### 6.2 恢复入口不是聊天历史

恢复时的入口是：

- 当前阶段文档

而不是：

- 历史对话全文

这恰恰就是 continue-work 的本质区别：

- 不是恢复 conversation
- 而是恢复 work artifact

### 6.3 局部状态嵌在 artifact 里

GacUI 不显式定义一个统一状态机，但会在不同 artifact 里嵌入局部状态：

- `[ ] / [x]`
- `[DONE]`
- `[CONFIRMED] / [DENIED]`
- `!!!FINISHED!!!`
- `!!!VERIFIED!!!`

这让“继续时从哪儿开始”可以通过 artifact 自己回答。

---

## 7. Human-Edit Absorption：它如何吸收用户介入

这部分很强，而且很容易被忽略。

GacUI 不是假设 agent 一直独占代码库，反而明确承认：

- 用户会直接改代码
- 用户会直接改文档
- 用户会否决 proposal

系统为此设计了显式吸收机制。

### 7.1 Update Sections

几乎所有 artifact 都有 `UPDATES` 段，用来吸收新的用户输入。

### 7.2 User Edit Detection

在 `verify` / `learning` 相关 prompt 里，系统要求：

- 检查文档与源码差异
- 把用户手工修改视为有意图的信号
- 不要盲目把代码改回文档描述

### 7.3 Learnings

`refine.prompt.md` 和 `copilotPrepare.ps1 -Backup` 联合形成了一个闭环：

- 旧 task 文档备份
- 从 `UPDATE` 和用户编辑中提炼 learnings
- 写回学习文件

这意味着 continue-work 不只是“接着干”，还包括：

> 系统记住过去人是如何纠正 agent 的

---

## 8. Review：它如何做多视角纠偏

GacUI 的 review 设计也很系统。

它不是简单让一个 agent “再看一遍”，而是：

- review board
- 每个模型独立写 review 文件
- 再合并意见
- 再 apply 回目标文档

也就是说，review 不是会话内评论，而是持久化 artifact 流程的一部分。

这对 continue-work 的意义在于：

- review 结果是可持久化的
- review 不是只存在于某个临时聊天分支里

---

## 9. Build/Test 不是主 Agent 直接做

这部分也很值得注意。

在 `execute` 和 `verify` prompt 里，GacUI 明确要求：

- build-fix process 用 sub agent
- test-fix process 用 sub agent
- main agent 不直接拿 build/test 执行

这说明它在协作上已经区分了：

- orchestration agent
- execution worker

即使它不是复杂 team runtime，也已经体现出职责分层。

---

## 10. Knowledge Base 是系统的一部分

GacUI 里 `KnowledgeBase` 不是旁支，而是主系统的一部分。

prompt 里多次要求：

- 先读 knowledge base
- 按项目知识选择 API
- 从 learnings 中吸收用户偏好

这让 continue-work 不只是“恢复任务”，还包括：

- 恢复项目知识
- 恢复偏好
- 恢复历史纠偏结果

也就是说，它让 repo-local memory 变成一等对象。

---

## 11. GacUI 方法的系统性价值

如果把上面压缩成一句话，GacUI 的方法系统性体现在：

> 它把“长任务如何跨会话持续推进”这个问题，拆成了 dispatcher +
> staged artifacts + repair/review/learning loops，而不是寄希望于单个
> 超强 agent 或单条超长对话

这是一个真正的 workflow system。

它的系统性不在于：

- 有多少 agent 同时跑

而在于：

- 任何时刻都知道当前在哪个阶段
- 每个阶段都有唯一 artifact
- 中断恢复从 artifact 开始
- 用户修正、review、learning 都进入持久化循环

---

## 12. 对 ext-saladict 的直接启发

如果从 continue-work 角度看，GacUI 最值得映射过来的不是：

- 全套 prompt dispatch
- 全套文档矩阵
- review board 全流程

而是这几个结构性原则：

1. 先定义当前阶段
2. 每个阶段有唯一主 artifact
3. 中断恢复先看阶段 artifact，而不是先看聊天历史
4. investigate / verify / review 应被视为独立阶段
5. 用户修正和新 learnings 必须能进入系统

---

## 13. 当前映射判断

基于这轮更系统的研究，我现在对 ext-saladict 的判断是：

### 已有

- `workboard` 已经非常接近 `scrum`
- `verification-report` 已经非常接近 `verify`
- `collaboration-runbook` 已经非常接近执行约束手册
- 新增的 `investigate-mcp-runtime-2026-04-12.md` 已经开始承担
  `investigate` 的角色

### 还缺

- 一个更明确的阶段表达
- `design / plan / execute` 是否需要单独 artifact 的边界
- investigate artifact 的通用模板
- 用户修正 / learnings 的持续沉淀机制

### 还不需要

- 复杂 team runtime
- 全套 review board 文档矩阵
- 大一统全局状态机

---

## 14. 阶段性结论

如果只回答：

> GacUI 是否值得系统性研究，再映射到 ext-saladict？

答案是：

- 值得，而且已经证明不只是“似乎讨论过”
- 这轮研究已经足够说明：
  - GacUI 方法的核心是阶段化 continuation
  - ext-saladict 完全可以先映射这一层
  - 没必要先讨论更重的多 Agent runtime
