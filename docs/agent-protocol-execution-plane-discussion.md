# Agent 可替换性与执行面讨论记录

> 日期：2026-04-12
> 背景：从 ext-saladict 的 MV3 迁移任务出发，讨论在 Agent 开发中如何区分“Agent 如何交互/接手”的协议问题，与“某个具体任务如何组织浏览器、MCP、测试与现场”的执行问题

---

## 1. 这份文档要讨论什么

这份记录不再讨论高层软件工程方法论本身，而聚焦一个更具体的问题：

> 当任务需要跨会话、跨 Agent、跨浏览器验证链路持续推进时，怎样让 Agent 可替换，同时又不丢执行现场

因此，这里讨论的不是：

- `Epic / Feature / User Story / BDD Scenario` 的高层结构
- PM、Human、Agent 在方法论上的职责分配

而是：

- Agent 可替换性的协议条件
- 浏览器、MCP、Playwright、tmux 这类执行资源应如何组织

相关 survey 见：

- [`./protocol-plane-survey-2026-04-12.md`](./protocol-plane-survey-2026-04-12.md)
- [`./gacui-method-system-study-2026-04-12.md`](./gacui-method-system-study-2026-04-12.md)
- [`./gacui-phase-protocol-mapping-2026-04-12.md`](./gacui-phase-protocol-mapping-2026-04-12.md)
- [`./gacui-vs-ext-saladict-state-comparison-2026-04-12.md`](./gacui-vs-ext-saladict-state-comparison-2026-04-12.md)
- [`./ext-saladict-phase-system-proposal-2026-04-12.md`](./ext-saladict-phase-system-proposal-2026-04-12.md)
- [`./investigate-template.md`](./investigate-template.md)

---

## 2. 一个关键修正

这轮讨论里，一个重要修正是：

- 真正要解决的问题，不只是“当前会话怎么继续”
- 而是“当前 Agent 如何被另一个 Agent 替换，并尽量不损失工作状态”

如果只从“聊天会话”角度理解这个问题，会很容易把：

- Prompt
- 会话历史
- 浏览器现场
- 测试结果
- 后台进程

混成一个东西。

但实际上，至少存在两类不同问题：

1. `Agent 如何交互、如何接手、如何替换`
2. `某个具体任务如何组织执行现场`

因此，这里把结构改成两个 plane：

- `Protocol Plane`
- `Execution Plane`

它们不是简单的技术分层，而是两类问题空间。

---

## 3. Protocol Plane

`Protocol Plane` 解决的是：

> Agent 如何交互，Agent 如何接手，Agent 如何被替换

它关心的不是某个浏览器或某个进程，而是协作协议本身。

这一层至少要定义：

1. 当前任务的唯一真相在哪
2. 当前状态如何表示
3. 交接包长什么样
4. 活资源如何登记
5. 谁拥有哪些写权限
6. 什么叫完成、阻塞、待验证
7. 哪些情况必须升级给人决策

因此，这一层真正产出的应该是：

- `task contract`
- `status schema`
- `handoff schema`
- `runtime registry schema`
- `ownership / lock rules`
- `verification contract`

对当前仓库来说，比较贴近 `Protocol Plane` 的对象包括：

- `docs/workboard.md`
- handoff 文档
- 状态 JSON
- 证据索引
- 下一步与阻塞原因的结构化记录

这层的目标不是“把事情做完”，而是：

> 让新的 Agent 不依赖当前会话本身，也能接着做

也就是说，真正应该被设计出来的不是“保住 live session”，而是：

> 把当前 Agent 的关键工作状态，投影成一个可传递、可读取、可继续执行的协议面

---

## 4. Execution Plane

`Execution Plane` 解决的是：

> 在某个具体任务里，Agent 如何基于协议层去组织实际执行

它关心的才是任务现场。

在当前项目里，它包括但不限于：

- 浏览器实例
- 扩展 profile
- MCP server
- Playwright browser context
- fixture / dev server
- tmux 托管的后台进程
- build / test / verify 流水线

这层不是通用协议，而是 task-specific orchestration。

因此，它更像：

- runtime lanes
- resource lifecycle
- concrete orchestration

---

## 5. Execution Plane 内部的两类 Lane

这层内部通常会同时存在两类 lane。

### 5.1 Ephemeral Lane

特点：

- 干净
- 可重建
- 跑完即销毁
- 适合作为自动化门禁

在这个仓库里，典型就是：

- `npm run test:required`
- Playwright fixture-driven verification

### 5.2 Persistent Lane

特点：

- 常驻
- 可重连
- 可观测
- 适合作为人工复核和 Agent 接力调试现场

在这个仓库里，典型就是：

- 已加载扩展的共享浏览器
- MCP 所连接的真实浏览器会话
- 留给人继续手测的浏览器实例

---

## 6. 两个 Plane 的边界

一个关键边界是：

- `Execution Plane` 提供运行现场
- `Protocol Plane` 提供可替换性

因此：

- 环境本身不属于协议层
- 但“环境的可发现描述”属于协议层

例如：

- 一个活着的 Chrome 进程，属于 `Execution Plane`
- 这个 Chrome 的 `debug port / ws endpoint / profile dir / extension id`，
  以及“当前谁在使用它”，属于 `Protocol Plane`

同样地：

- Playwright 运行中的 browser context，属于 `Execution Plane`
- 对应的 trace、截图、console、结果摘要，属于 `Protocol Plane`

所以，`Execution Plane` 不能直接成为真相源。

它必须把自己的状态持续投影回 `Protocol Plane`，否则：

- Agent 一换就断
- 现场虽然还活着，但没人知道怎么接
- 日志虽然存在，但没人知道该信哪份结论

---

## 7. 为什么“只重建环境”不够

讨论里一个重要分歧是：

- 下层 environment 是否做到“可重建”就够了

更准确的答案是：

- `可重建` 是底线
- `常驻 + 可重连 + 可观测` 是更适合高频 Agent 协作的上限

原因不是抽象偏好，而是执行成本：

1. 每次重建浏览器和扩展现场都有成本
2. 某些运行时状态并不容易完整重建
3. 调试类任务通常更需要连续现场，而不是纯净重启

因此，更合理的结构不是二选一，而是：

- `Ephemeral lane` 负责干净回归
- `Persistent lane` 负责持续调试与人工复核

然后通过 `Protocol Plane` 把两者接起来。

---

## 8. 对当前仓库的直接启发

如果把这套模型落到 ext-saladict 当前任务，可以得到一个更清晰的判断：

### 8.1 Protocol Plane 要解决的事

- workboard 是什么
- 当前状态字段是什么
- 下一步怎么写
- 浏览器资源怎么登记
- 证据怎么索引
- 交接最少要读哪些文件

### 8.2 Execution Plane 要解决的事

- shared Chrome 怎么启动
- MCP 怎么连接共享浏览器，而不是每次自己起新会话
- Playwright 怎么继续作为硬门禁
- fixture server / dev server 怎么纳入后台托管
- tmux 在其中扮演 supervisor 还是状态层

因此，真正的实现顺序不应该是：

- 先问“tmux 能不能生成新聊天会话”

而应该是：

1. 先定义 `Protocol Plane`
2. 再定义某个具体任务的 `Execution Plane`
3. 最后再决定 `tmux`、`fork`、`resume`、`codex exec`、`sub-agent`
   分别在哪一层发挥作用

---

## 9. 当前讨论的阶段性结论

围绕“如何降低 Agent 开发中的跨会话、跨验证链路协作成本”，当前可以先冻结以下阶段性结论：

1. 问题本质不是“如何保住当前聊天会话”，而是“如何让 Agent 可替换”
2. `Agent 可替换` 首先是协议问题，不是浏览器问题
3. 浏览器、MCP、Playwright、fixture server 都属于 `Execution Plane`
4. workboard、handoff、状态 JSON、证据索引、runtime registry 属于
   `Protocol Plane`
5. `tmux` 更适合作为 execution-plane 的 supervisor，而不是 protocol-plane
   本身
6. `fork / resume / 新 agent` 只有在 protocol-plane 足够明确时，才真正有
   价值
7. 后续如果要继续探索，应该先把 protocol-plane 的最小规范写出来，再去
   实现 shared browser / MCP 这类 execution-plane 能力
