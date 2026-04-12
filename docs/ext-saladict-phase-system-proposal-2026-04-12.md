# ext-saladict 第一版阶段体系提案

> 日期：2026-04-12
> 背景：基于对 GacUI 方法的系统性研究，提出 ext-saladict 在当前阶段可先冻结的 full phase set，以及各 phase 在当前仓库中的成熟度与承载方式

相关背景研究：

- [`./gacui-method-system-study-2026-04-12.md`](./gacui-method-system-study-2026-04-12.md)

---

## 1. 目标

这份提案的目标不是立即把所有 phase 都做重，而是：

> 先固化一套完整 phase vocabulary，再逐步优化哪些 phase 需要强
> artifact，哪些 phase 先保持轻量

因此，这份文档优先解决：

1. ext-saladict 当前应该采用哪些 phase
2. 每个 phase 最小语义是什么
3. 每个 phase 在当前仓库的成熟度如何
4. 当前已有哪个 artifact 在承载它
5. 当前缺的最小补强是什么

---

## 2. 提案原则

从 GacUI 映射过来，当前版本先冻结 5 条原则：

1. 当前工作必须能落到一个 phase
2. phase 名称应先完整冻结，再讨论轻重
3. 会话恢复时先看 phase 对应 artifact，而不是先看聊天历史
4. phase 是工作模式，不直接等于任务生命周期状态
5. artifact 成熟度可以不同，但 vocabulary 先保持稳定

---

## 3. Full Phase Set v1

建议 ext-saladict 第一版直接冻结完整 phase 集合：

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

这里“冻结”的意思是：

- 这些 phase 名称以后可以作为统一语言使用
- 不代表它们现在都必须有成熟 artifact

---

## 4. 每个 Phase 的最小语义

### 4.1 `scrum`

用途：

- 任务入口
- 当前状态板
- 下一步
- 决策记录

一句话理解：

- `scrum` 负责说清“现在在推进哪件事”

### 4.2 `design`

用途：

- 收口方案
- 收口边界
- 列出受影响区域
- 当问题还不能直接进入实现时，先收口设计

一句话理解：

- `design` 负责说清“准备怎么做”

### 4.3 `plan`

用途：

- 细化执行顺序
- 细化验证顺序
- 明确先做什么后做什么

一句话理解：

- `plan` 负责说清“按什么顺序做”

### 4.4 `summarize`

用途：

- 把前面的设计与计划压缩成更接近可执行的交接稿
- 让后续执行者不必再重读长篇设计文档

一句话理解：

- `summarize` 负责说清“给执行者看的精简版本是什么”

### 4.5 `execute`

用途：

- 真正落代码、配置、文档和脚本

一句话理解：

- `execute` 负责“把方案变成改动”

### 4.6 `verify`

用途：

- 跑门禁
- 汇总自动化结果
- 汇总人工验证
- 写结论边界

一句话理解：

- `verify` 负责说清“现在到底证明了什么”

### 4.7 `investigate`

用途：

- 排障
- 根因分析
- 假设与实验
- runtime/tooling/browser 类问题的持续接力

一句话理解：

- `investigate` 负责说清“问题为什么这样，下一步实验是什么”

### 4.8 `review`

用途：

- 评审设计
- 评审计划
- 评审执行结果
- 评审风险与遗漏

一句话理解：

- `review` 负责说清“这份工作还缺什么、有什么问题”

### 4.9 `kb`

用途：

- 更新知识库
- 把这轮任务产出的长期稳定知识写回 repo

一句话理解：

- `kb` 负责说清“什么值得记住”

### 4.10 `refine`

用途：

- 从完成任务和用户修正中提炼 learnings
- 调整以后做类似任务时的工作方法

一句话理解：

- `refine` 负责说清“以后怎么做得更好”

---

## 5. 当前仓库的成熟度分层

为了避免“先固化就等于全量重实现”，这里把每个 phase 的成熟度分成：

- `strong`
  - 已有稳定主 artifact
- `medium`
  - 已有部分 artifact 或已有明确承担物
- `weak`
  - 目前只有语义，尚无稳定 artifact

---

## 6. 当前 Phase 成熟度与承载物

### 6.1 `scrum`

- maturity: `strong`
- current artifact:
  - [`./workboard.md`](./workboard.md)
- current role:
  - 单入口任务板
  - 当前状态
  - 最新发现
  - 下一步
  - 决策日志

### 6.2 `design`

- maturity: `medium`
- current artifact:
  - task-specific discussion / design docs
  - baseline discovery docs
- current examples:
  - `migration-baseline-discovery.md`
  - `mv2-capability-inventory.md`
- gap:
  - 何时进入 `design` phase 还没有显式规则

### 6.3 `plan`

- maturity: `weak`
- current artifact:
  - 主要被 `workboard` 的 `Plan` 段隐式承载
- gap:
  - 还没有独立 plan artifact

### 6.4 `summarize`

- maturity: `weak`
- current artifact:
  - 没有稳定独立 artifact
- gap:
  - 还没有把“长设计/长计划压缩成交接稿”的固定阶段

### 6.5 `execute`

- maturity: `medium`
- current artifact:
  - 代码 diff
  - `workboard`
  - 局部文档更新
- gap:
  - 还没有独立 execution artifact

### 6.6 `verify`

- maturity: `strong`
- current artifact:
  - [`./verification-report-2026-04-12.md`](./verification-report-2026-04-12.md)
- current role:
  - 自动化门禁结果
  - MCP 结果
  - 结论边界

### 6.7 `investigate`

- maturity: `medium`
- current artifact:
  - [`./investigate-mcp-runtime-2026-04-12.md`](./investigate-mcp-runtime-2026-04-12.md)
  - [`./investigate-template.md`](./investigate-template.md)
- current role:
  - 承接当前 MCP/browser/runtime 排障
- gap:
  - 还没有经过多轮真实任务验证

### 6.8 `review`

- maturity: `weak`
- current artifact:
  - 主要发生在会话中
- gap:
  - 没有稳定 review artifact

### 6.9 `kb`

- maturity: `weak`
- current artifact:
  - 零散 discussion / methodology docs
- gap:
  - 没有把知识库更新当成稳定 phase

### 6.10 `refine`

- maturity: `weak`
- current artifact:
  - 零散 methodology / discussion docs
- gap:
  - 没有稳定 learnings 回灌流程

---

## 7. 当前仓库的 continue-work 入口规则

### 7.1 总入口

所有新会话先读：

1. [`../AGENTS.md`](../AGENTS.md)
2. [`../CLAUDE.md`](../CLAUDE.md)
3. [`./workboard.md`](./workboard.md)

### 7.2 再根据 `Current Phase` 跳转

如果当前 `Current Phase` 是：

- `verify`
  - 读 [`./verification-report-2026-04-12.md`](./verification-report-2026-04-12.md)
- `investigate`
  - 读当前 investigate artifact
- `design`
  - 读对应设计文档
- `execute`
  - 以代码和 `workboard` 为主继续
- 其他 phase
  - 先回到 `workboard` 的任务上下文，再决定是否需要补 phase-specific artifact

这条规则的核心不是“所有 phase 立刻都有重文档”，而是：

- phase vocabulary 先冻结
- artifact 深度逐步补齐

---

## 8. 当前最小补强建议

在 full phase set 已冻结的前提下，当前最值得补的不是新增更多 phase，而是：

### 8.1 固定 `Current Phase`

继续在 `workboard` 中明确记录：

- 当前 phase 是什么

这会让新会话先知道“我是在设计、执行、验证还是排障”。

### 8.2 优先把 `investigate` 跑通

这是当前最痛的 continue-work 场景：

- MCP/browser/runtime 问题
- 跨会话最容易丢
- 最适合先验证 phase-driven continuation 是否有价值

### 8.3 暂不急着把所有 weak phase 做重

`plan / summarize / review / kb / refine` 目前先冻结 vocabulary，
不强制立刻引入重 artifact。

---

## 9. 当前不建议做的事

当前不建议：

1. 直接把所有 phase 都扩成重文档体系
2. 立刻设计复杂全局状态机
3. 立刻做跨 Codex / Claude 的统一协议
4. 立刻引入复杂多 Agent runtime

原因：

- 当前最主要的收益，还可以通过 full phase set + 少量强 artifact 获得
- 现在继续加复杂度，容易先把体系做重

---

## 10. 阶段性结论

这份提案的核心不是：

- 先最小化 vocabulary

而是：

- 先固化 full phase set
- 再根据当前仓库成熟度逐步强化 artifact

所以当前最合理的推进顺序是：

1. 冻结 full phase set
2. 持续使用 `workboard` 记录 `Current Phase`
3. 先把 `verify` 和 `investigate` 做稳
4. 再决定是否把 `design / plan / summarize` 独立出来

这符合“先固化，再优化”的原则。
