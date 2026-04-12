# GacUI 与 ext-saladict 状态表达对照

> 日期：2026-04-12
> 目的：澄清 GacUI 是否已经有“统一状态机”，以及如果 ext-saladict 补一个最小统一状态，我们到底只比 GacUI 多了什么

---

## 1. 结论先行

GacUI：

- 有状态表达
- 但不是统一双层状态机

更准确地说：

- `phase` 是显式的
- `progress / completion / confirmation` 是分散在各阶段 artifact 里的局部状态

ext-saladict 当前：

- 已经有一部分全局任务状态
- 也开始出现 `phase` 概念
- 但两者还没有形成明确规则

所以如果 ext-saladict 继续往前补，严格来说只是在 GacUI 的
`phase-driven + artifact-driven continuation` 骨架上，再补一层很薄的统一状态约束。

---

## 2. GacUI 当前已有的状态表达

### 2.1 显式 Phase

GacUI 的 phase 非常明确，直接由请求首词驱动：

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

这部分几乎就是一个 phase machine。

### 2.2 局部状态标记

GacUI 没有把生命周期状态抽成一个全局表，而是把状态散落在不同 artifact 里：

- `# !!!FINISHED!!!`
- `# !!!VERIFIED!!!`
- `[DONE]`
- `[CONFIRMED]`
- `[DENIED]`
- `[x] / [ ]`
- `# UPDATES`
- `# FIXING ATTEMPTS`

这些标记在不同阶段里承担不同角色。

例如：

- `scrum` 阶段用 task checkbox 表示任务是否被接手
- `execute` 阶段用 `[DONE]` 表示某一步是否做完
- `verify` 阶段用 `# !!!VERIFIED!!!` 表示最终验证完成
- `investigate` 阶段用 `[CONFIRMED] / [DENIED]` 表示 proposal 是否成立

### 2.3 本质

因此，GacUI 的状态表达更像：

- 全局有 `phase`
- 每个 phase artifact 再带自己的局部状态

而不是：

- 一个统一的全局 `lifecycle state`
- 一个统一的全局 `phase`
- 再加一张全局组合约束表

---

## 3. ext-saladict 当前已有的状态表达

### 3.1 全局任务状态

当前 [`workboard.md`](./workboard.md) 已经定义了固定任务状态：

- `todo`
- `in_progress`
- `blocked`
- `verify`
- `done`

这其实已经是一套显式 lifecycle state。

### 3.2 逐渐出现的 Phase

在当前讨论后，`workboard` 又开始出现：

- `Current Phase`

例如当前 `T1` 已经被标成：

- `Status = in_progress`
- `Current Phase = investigate`

这说明 ext-saladict 正在从“只有任务状态”走向“任务状态 + 当前阶段”。

### 3.3 局部 artifact 状态

当前仓库也已经有一些局部状态表达：

- `verification-report` 里的 verified conclusions
- `investigate` artifact 里的 confirmed facts / hypotheses / next experiments
- `workboard` 里的 `Latest Findings / Next Step / Verification / Decision Log`

所以 ext-saladict 其实已经具备：

- 一套全局 lifecycle state
- 一些局部 artifact state
- 一个刚出现的 phase 概念

只是这些还没有被形式化收口。

---

## 4. 如果继续补统一状态，我们到底只多了什么

如果 ext-saladict 要比 GacUI 多补一层最小统一状态，那其实只会多这 3 件事：

### 4.1 显式 `lifecycle state`

这一点当前仓库其实已经有了：

- `todo`
- `in_progress`
- `blocked`
- `verify`
- `done`

所以这不是新增负担。

### 4.2 显式 `current phase`

这一点刚开始出现，但还没有完全固定。

它的作用只是：

- 让下个会话知道“当前最主要的工作模式是什么”

例如：

- `in_progress + investigate`
- `in_progress + execute`
- `verify + verify`

### 4.3 `valid combinations`

这是 GacUI 没显式做、但 ext-saladict 如果愿意可以补的一层最小约束：

- 哪些 `status + phase` 组合是有意义的
- 哪些组合会造成语义冲突

例如：

- `in_progress + investigate` 合法
- `blocked + investigate` 合法
- `done + investigate` 一般不合法
- `todo + execute` 一般不合法

这层不是为了美观，而是为了防止状态打架。

---

## 5. 为什么 ext-saladict 比 GacUI 更需要这层

GacUI 的主问题是：

- 如何让单个开发流程跨会话继续

而 ext-saladict 当前多了一类非常显著的问题：

- 浏览器 / MCP / runtime / Playwright 这类跨阶段、跨会话的执行现场

这会带来两个额外复杂度：

1. 同一个任务会在 `execute / verify / investigate` 之间频繁切换
2. 某些问题跨越多个阶段，但又不能简单认为任务已经 `blocked` 或 `done`

因此：

- 如果完全不抽统一状态，后续 continue-work 仍然会容易乱
- 但如果抽得太重，又会变成过度设计

所以最合理的位置就是：

- 保留 GacUI 的 phase-driven artifact 思想
- 只补一层很薄的统一状态约束

---

## 6. 最小扩展版理解

所以更准确的表述应该是：

### GacUI

- `phase machine`
- `artifact-local state`

### ext-saladict 最小扩展

- `task lifecycle state`
- `current phase`
- `artifact-local state`
- optional `valid combinations`

这里真正新增的只有：

- 一套明确的全局 lifecycle state 解释
- 一张极小的组合约束表

它不是要推翻 GacUI，而是给当前仓库多加一点统一性。

---

## 7. 阶段性判断

因此，当前最合理的判断是：

1. GacUI 已经证明：
   - phase-driven continuation 是可行的
2. ext-saladict 不需要重新发明这一点
3. ext-saladict 若要继续补状态表达：
   - 不应该造复杂全局状态机
   - 只需要在 GacUI 思路上补一个最小统一状态层

如果后续不想走这一步，也完全可以先停在：

- `phase + artifact-local state`

也就是：

- 继续只靠 `workboard`
- `verification-report`
- `investigate` artifact

来维持 continue-work，而不急着冻结统一组合规则。
