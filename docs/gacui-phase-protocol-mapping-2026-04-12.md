# GacUI 阶段式协作协议映射草案

> 日期：2026-04-12
> 背景：参考 GacUI 仓库中以阶段文档驱动的 Agent 协作方式，讨论如何把“一个会话退出后，下个会话怎么继续干”映射到 ext-saladict 当前仓库

---

## 1. 这份文档解决的具体问题

这份文档只解决一个很具体的问题：

> 一个会话退出后，下个会话如何继续工作，而不是从头重新理解任务

这里不讨论：

- 多 Agent runtime 是否要自己实现
- Claude Code / Codex / LangGraph / CrewAI 的全面比较
- 完整的通用 `Protocol Plane` 规范

这里要讨论的是：

- GacUI 是如何解决 continue-work 的
- 这套做法哪些部分可以映射到 ext-saladict
- 当前仓库已经具备哪些 artifact
- 当前仓库还缺哪些 artifact

---

## 2. GacUI 这套方法真正解决了什么

从仓库里的 `AGENTS.md`、`.github/copilot-instructions.md` 和一组
`*.prompt.md` 来看，GacUI 的核心不是“先做多 Agent runtime”，而是：

> 先把工作拆成明确阶段，并为每个阶段准备一个固定的持久化文档

它解决 continue-work 的方法非常朴素，但非常有效：

1. 先决定现在处于哪个阶段
2. 读取该阶段对应的文档
3. 只按该阶段文档允许的方式继续
4. 阶段推进时，把信息转移到下一个阶段文档

也就是说：

- continue-work 不是靠聊天历史
- 也不是靠 session 永远不死
- 而是靠阶段文档持续保存“当前该看什么、该做什么、做到哪了”

---

## 3. GacUI 的核心机制

从当前看到的材料里，GacUI 的 continue-work 机制主要由 6 个部件组成。

### 3.1 阶段分流

它通过请求首词把工作分到不同阶段：

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

这意味着：

- 当前不是在做“任意事情”
- 当前一定处于某一个阶段

### 3.2 每个阶段有专属文档

例如：

- `Copilot_Scrum.md`
- `Copilot_Task.md`
- `Copilot_Planning.md`
- `Copilot_Execution.md`
- `Copilot_Investigate.md`
- `Copilot_KB.md`
- `Copilot_Review*.md`

每个阶段都有唯一主文档。

### 3.3 每个阶段文档有固定结构

这些文档都不是自由格式，而是固定 schema：

- problem / request
- updates
- plan / affected projects
- fixing attempts
- report / review / verification marks

这样下一个会话不需要猜：

- 哪部分是问题定义
- 哪部分是更新
- 哪部分是执行计划
- 哪部分是失败修复记录

### 3.4 阶段切换是显式的

例如：

- `scrum` 产出任务拆解
- `design` 产出设计说明
- `plan` 产出执行计划
- `summarize` 产出可执行执行文档
- `execute` 改代码
- `verify` 负责编译和测试通过
- `investigate` 负责排障

也就是说，阶段之间不是模糊跳转，而是有明确的“谁给谁喂输入”。

### 3.5 允许被打断，也允许继续

多个 prompt 都明确写了：

- 如果没有新输入，说明是“意外中断”，要继续当前阶段的工作
- 继续时要重新读对应阶段文档

这正是 continue-work 的关键。

### 3.6 学习和修正也是流水线的一部分

它还有：

- `review`
- `refine`
- `learning`

说明这不是一次性流水线，而是把：

- 用户修正
- review 反馈
- learnings

都变成持久化 artifact。

---

## 4. GacUI 方法的本质

如果压缩成一句话，GacUI 的本质是：

> phase-driven + artifact-driven continuation

也就是：

- 先定义阶段
- 再定义阶段 artifact
- 会话退出后，通过当前阶段 artifact 恢复工作

它并不依赖复杂的 agent 通信协议，就已经能很大程度解决“下个会话怎么继续干”。

这点对当前项目特别重要，因为我们眼下面临的痛点正是：

- session 换了
- 浏览器/MCP 现场易失
- 人不想重复做低价值恢复动作
- 新会话也不应该重新读完整聊天记录

---

## 5. 映射到 ext-saladict：我们已经有什么

当前仓库其实已经有一些非常接近 GacUI artifact 的东西了。

### 5.1 `scrum` 对应物

GacUI:

- `Copilot_Scrum.md`

ext-saladict:

- [`docs/workboard.md`](./workboard.md)

它已经承担了：

- 当前任务列表
- 当前状态
- 最新发现
- 下一步
- 验证记录
- 决策记录

这已经非常像一个轻量 `scrum + task board`。

### 5.2 `verify` 对应物

GacUI:

- `Copilot_Execution.md` 的 verified mark
- `verify.prompt.md`

ext-saladict:

- [`docs/verification-report-2026-04-12.md`](./verification-report-2026-04-12.md)

它已经承担了：

- 验证范围
- 验证方法
- 自动化结果
- MCP 结果
- 结论边界

### 5.3 `runbook` / 执行约束 对应物

GacUI:

- `.github/copilot-instructions.md`
- `Project.md`
- knowledge base

ext-saladict:

- [`AGENTS.md`](../AGENTS.md)
- [`CLAUDE.md`](../CLAUDE.md)
- [`docs/collaboration-runbook.md`](./collaboration-runbook.md)
- [`docs/architecture.md`](./architecture.md)
- [`docs/mv3-runtime-boundaries.md`](./mv3-runtime-boundaries.md)

这些已经承担了：

- 运行时边界
- 工具顺序
- 哪些文件重要
- 最低验证门槛

### 5.4 `investigate` 对应物

GacUI:

- `Copilot_Investigate.md`

ext-saladict:

- 目前只有零散记录：
  - `workboard` 里的最新发现
  - `verification report` 里的备注
  - 若干 retrospective / discussion 文档

这一块当前没有一个专门的 investigate artifact。

### 5.5 `design / plan / summarize` 对应物

GacUI:

- `Copilot_Task.md`
- `Copilot_Planning.md`
- `Copilot_Execution.md`

ext-saladict:

- 部分散落在：
  - `workboard`
  - `verification report`
  - `discussion / methodology` 文档
  - task-specific notes

也就是说：

- 当前仓库有 task board
- 有 verification report
- 有 runbook
- 但还没有稳定分离出：
  - design artifact
  - planning artifact
  - execution artifact

---

## 6. 映射到 ext-saladict：当前缺什么

如果目标只是解决：

> 一个会话退出后，下个会话怎么继续干

那么当前仓库最缺的不是“多 Agent 消息系统”，而是下面三件事。

### 6.1 缺显式阶段

当前我们知道有这些活动：

- 任务收口
- 架构分析
- 代码实现
- 自动化验证
- MCP/浏览器复核
- 排障调查

但没有一个统一的“当前阶段”表示。

结果就是：

- 新会话要靠读很多文档推断自己现在处于哪个阶段

这正是 continue-work 成本高的原因之一。

### 6.2 缺 investigate 专用 artifact

像这轮 MCP session 问题，其实非常适合落到一个 investigate artifact：

- 问题定义
- 当前复现路径
- 尝试过什么
- 哪些是假设
- 哪些已证实
- 下一步实验是什么

但现在它被分散在：

- 聊天记录
- workboard
- verification report

这会导致下个会话接手排障时仍然要重构上下文。

### 6.3 缺 execution-runtime 的阶段登记

GacUI 主要解决的是阶段继续。

而 ext-saladict 当前多出的难点是：

- 浏览器
- MCP
- shared runtime
- Playwright gate

也就是说，即便阶段文档有了，我们还缺一个最小的 runtime attachment 记录。

这不需要成为复杂 schema，但至少要回答：

- 当前有哪些活资源
- 哪些是 ephemeral
- 哪些是 persistent
- 当前 persistent 资源可不可 attach
- attach 失败时该重建什么

---

## 7. 最小映射版本：不照搬全部 GacUI

当前仓库没必要照搬 GacUI 的所有阶段。

最小可用映射更像是：

### 7.1 `scrum`

用途：

- 当前任务入口
- 状态板
- 下一步

当前 artifact：

- [`docs/workboard.md`](./workboard.md)

建议：

- 保持单入口地位，不拆

### 7.2 `design`

用途：

- 当任务不是直接改代码，而是需要先收口设计/范围/边界时使用

当前 artifact：

- 暂无稳定单一 artifact
- 当前常散落在 discussion 和 methodology 文档

建议：

- 仅在复杂任务上新增单独 design note
- 不要求每个小任务都走

### 7.3 `execute`

用途：

- 把当前计划转成实际改动

当前 artifact：

- 主要还是代码 diff + workboard 更新

建议：

- 目前可以暂时不单独造 `execution` 文档
- 因为当前仓库任务规模还没大到每次都需要独立 execution spec

### 7.4 `verify`

用途：

- 汇总自动化和人工验证

当前 artifact：

- [`docs/verification-report-2026-04-12.md`](./verification-report-2026-04-12.md)

建议：

- 继续保留
- 把它视为阶段 artifact，而不是一次性报告

### 7.5 `investigate`

用途：

- 排障、追 runtime 问题、验证假设

当前 artifact：

- 缺失

建议：

- 这是当前最值得新增的一个阶段 artifact

### 7.6 `review`

用途：

- review 文档、review 方案、review 改动

当前 artifact：

- 主要还是直接在会话里做

建议：

- 目前可以保留轻量，不急着结构化

---

## 8. 如果按 GacUI 思路回答 continue-work

如果用 GacUI 风格回答：

> 一个会话退出后，下个会话怎么继续干？

那么 ext-saladict 最合理的答案应当是：

1. 先读 [`AGENTS.md`](../AGENTS.md)
2. 再读 [`CLAUDE.md`](../CLAUDE.md)
3. 再读 [`docs/workboard.md`](./workboard.md)
4. 根据 `workboard` 判断当前处于哪个阶段：
   - 如果是正常推进任务，继续 `scrum/execute`
   - 如果是验证收口，继续 `verify`
   - 如果是 runtime/MCP 问题，进入 `investigate`
5. 读取该阶段 artifact：
   - `verify` -> [`docs/verification-report-2026-04-12.md`](./verification-report-2026-04-12.md)
   - `investigate` -> 未来的 investigate doc
6. 只有在阶段 artifact 不够时，才回看长聊天记录

这其实就是：

- 用阶段 artifact 继续
- 而不是用完整会话历史继续

---

## 9. 当前最值得采纳的 GacUI 思想

如果只提炼 GacUI 对当前仓库最有价值的思想，我会保留这 4 条：

1. `先定义阶段，再定义 continue-work`
2. `每个阶段必须有唯一主 artifact`
3. `会话中断后优先恢复阶段 artifact，而不是恢复聊天历史`
4. `review / investigate / verify 不是附属动作，而是独立阶段`

---

## 10. 当前最不需要照搬的部分

当前仓库暂时不需要直接照搬：

1. 全套多文档流水线
   - 当前仓库还没有大到必须每步都独立出文档
2. 复杂 prompt dispatch
   - 现在先靠 repo docs + task docs 就够
3. 全套 review board 文件
   - 当前没有必要引入这种重量

也就是说，我们现在更适合吸收：

- GacUI 的阶段化思想

而不是照抄：

- GacUI 的完整文档矩阵

---

## 11. 对当前仓库的最小落地建议

如果只为了改善 continue-work，而不做大规模流程重构，最小落地顺序应该是：

1. 保持 [`docs/workboard.md`](./workboard.md) 作为唯一入口
2. 明确 workboard 中记录“当前阶段”
3. 把 [`docs/verification-report-2026-04-12.md`](./verification-report-2026-04-12.md)
   视为可持续更新的 `verify` artifact
4. 新增一个专门的 `investigate` artifact，用于：
   - MCP session 问题
   - browser/runtime attach 问题
   - 其他需要跨会话延续的排障问题
5. 只有在 design 型任务越来越多时，再考虑单独的 design artifact

---

## 12. 阶段性结论

如果问题只限定为：

> 一个会话退出后，下个会话怎么继续干

那么 GacUI 给我们的最重要启发不是“多 Agent team”，而是：

> 用阶段 artifact 取代聊天历史，作为 continue-work 的主入口

对 ext-saladict 来说，当前最值得先补的也不是复杂通用协议，而是：

- 阶段标记
- `investigate` artifact
- 最小 runtime attachment 记录
