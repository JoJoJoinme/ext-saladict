# IPD-Lite Agent Rules

> 日期：2026-04-12
> 目的：将公开可获取的 IBM / Huawei IPD 与 requirements management 思路，抽象为适合本仓库的轻量开发侧规则

---

## 1. 适用范围

这不是完整的企业 IPD 流程移植。

本文件只保留对当前仓库最有价值的开发侧部分：

- 需求拆解
- 产品基线
- 技术承接
- 变更控制
- 追踪与验证

不包含：

- 全套立项 / 投资决策 / 经营管理流程
- 完整角色矩阵
- 公司级评审机制
- 大而全模板体系

当前仓库是个人试验项目，因此这里采用的是：

> `IPD-Lite`

即：

- 保留基线思想
- 保留分层拆解
- 保留变更控制
- 保留追踪与验证
- 去掉过重的组织流程

---

## 2. 规则来源

这套规则主要来自两类公开来源。

### 2.1 IBM 侧

从 IBM 对 requirements management / DOORS / ELM 的公开描述中，抽出以下核心原则：

- 需求要被 `elicitation -> analysis -> definition -> prioritization -> approval`
- 需求要有 `traceability`
- 需求变更要做 `impact analysis`
- 变更后要更新正式文档 / requirement artifact
- baseline 是可冻结、可复用、可追踪的需求状态

### 2.2 Huawei 侧

从 Huawei 公开的 Baseline / IPD 描述中，抽出以下核心原则：

- baseline 必须嵌入产品开发流程，而不是随机执行
- baseline 应来自法规、客户需求、最佳实践、历史问题等输入
- baseline 要求必须可执行、可验证、可持续优化
- baseline 更新后，相关模板、规范、指南和流程要保持一致

---

## 3. 面向 Agent 的核心原则

### 3.1 先分层，再实现

对用户可见功能或兼容性任务，Agent 不得直接进入实现。

默认分层顺序：

1. `Epic`
2. `Feature / User Story`
3. `BDD Scenario / 测试案例`
4. `Tech Story`
5. `Implementation`

如果任务本身只涉及纯内部重构，且不改变用户行为，可以从 `Tech Story` 直接开始；但必须明确说明“不触碰产品基线”。

### 3.2 先判断基线是否足够，再决定是否实现

对以下类型的任务，必须先做基线判断：

- 迁移
- 兼容性保持
- 行为一致性保持
- 用户可见的跨层重构
- 旧系统行为对齐

Agent 在开始实现前，必须给出以下三种状态之一：

- `baseline_sufficient`
  - 现有 `User Story + BDD Scenario` 足够覆盖本次任务
- `baseline_gap`
  - 现有基线不足，必须先补 story / scenario
- `exploratory_spike`
  - 当前只是探索，不宣称已经开始正式承接基线

禁止在没有给出以上状态的情况下直接声称“开始正式实现”。

### 3.2.1 迁移类任务的 baseline discovery 不能只看当前实现

对迁移、兼容、行为保持、旧系统对齐类任务：

- baseline discovery 不得只依赖当前迁移实现
- 也不得只依赖当前 acceptance kernel

必须同时检查两类输入：

- `显式产品基线`
  - 例如现有 `User Story`、`BDD Scenario`、acceptance spec、产品文档
- `历史实现基线`
  - 例如旧系统 manifest、README、入口点、options 配置面、后台能力、同步服务等可识别的一级能力块

原因：

- 当前迁移实现本身可能已经丢失旧能力
- acceptance kernel 往往只覆盖主闭环，不覆盖全部正式能力块
- 如果不显式检查历史实现基线，迁移任务容易在“当前实现 + 当前测试”闭环中静默漏功能

因此，对迁移类任务，Agent 必须先回答：

1. 当前 `显式产品基线` 覆盖了什么？
2. 当前 `历史实现基线` 明确具备哪些一级能力块？
3. 两者之间有哪些缺口？

如果历史实现中存在当前显式基线未覆盖的一级能力块，应将其标记为：

- `baseline candidate`
- `baseline gap`
- 或 `needs product decision`

而不能直接忽略。

### 3.3 基线不足时，先补基线，不先补代码

当状态为 `baseline_gap` 时，Agent 的默认动作不是继续写代码，而是：

- 先盘点现有 story / scenario
- 标出缺失的主流程 / 关键异常路径
- 产出候选补全项
- 再进入技术承接

这里补的是：

- 最小足够的产品基线

不是：

- 全量穷举所有边角行为

### 3.4 默认保护主流程，不默认保护全部历史偶然行为

在迁移类任务中，Agent 默认优先保护：

- 已有 `User Story`
- 已有 `BDD Scenario`
- 已有 acceptance / E2E 覆盖的主流程
- PM 显式指出的重要用户路径

Agent 不应把“旧代码里曾经存在过”直接等同于“必须保留的正式产品行为”。

对未冻结的历史边角行为，应标记为：

- `candidate baseline`
- `possible legacy behavior`
- `needs product decision`

而不是直接纳入正式承诺。

### 3.5 用户可见改动必须具备可追踪关系

每个用户可见改动，都必须能追溯到至少一个上游基线项：

- `Feature`
- `User Story`
- `BDD Scenario`

每个 `Tech Story` 也必须说明它承接的是哪一个或哪一组上游基线项。

如果当前任务属于探索，不存在正式上游基线，则必须明确标记：

- `exploratory`

并禁止把探索结果包装成正式承诺。

### 3.5.1 用户可见 Feature / User Story 必须有正式 BDD 承接

对用户可见的 `Feature / User Story`：

- 必须存在正式的 `BDD` 承接
- 文档中的场景讨论只算提案层，不算正式承接

当前仓库中，正式 BDD 承接的唯一载体是：

- `test/acceptance/spec.json`

因此：

- 如果某个用户可见 `Feature / User Story` 已进入正式承接状态，则必须能映射到 `spec.json` 中的一个或多个正式场景
- 如果当前还没有正式场景承接，则必须显式标记为：
  - `bdd_gap`
  - 或 `exploratory_spike`

不允许出现下面这种状态：

- 已经开始正式实现
- 但既没有正式 BDD 场景
- 也没有显式 `bdd_gap`

也就是说：

> 用户可见 Feature / User Story 不得在“无正式 BDD 承接、也无显式缺口声明”的状态下进入正式实现。

### 3.6 基线变更不是实现细节，而是受控变更

如果实现过程中发现：

- 现有 `Tech Story` 无法承接基线
- 旧行为在新平台无法等价保留
- 已有 scenario 明显不成立
- 当前实现会修改已冻结 story / scenario 的语义

则默认动作不是“自行改需求”，而是：

1. 标出受影响基线项
2. 做最小影响分析
3. 给出建议选项
4. 请求人拍板或明确记录为基线变更

也就是说：

> 触碰基线的事，不能伪装成普通实现细节。

### 3.7 探索是允许的，但必须显式标记

探索性任务可以先于完整基线存在。

但探索任务必须满足：

- 明确标记为 `exploratory_spike`
- 输出以“学习结果 / 发现结果”为主
- 不默认产出正式承诺
- 不默认宣称“已满足迁移要求”

探索的目标是：

- 帮助补全 baseline
- 帮助判断技术可行性

而不是绕过基线流程。

### 3.8 验证必须承接基线，而不是只证明代码能跑

用户可见改动完成前，Agent 必须回答：

1. 这次改动承接了哪个 `User Story / BDD Scenario`？
2. 哪些测试或验证证明它成立？
3. 哪些部分仍未覆盖？

如果已有 acceptance / E2E 场景足够覆盖，可以直接复用。

如果没有，就需要补最小足够的验证。

---

## 4. 本仓库中的最小执行门禁

结合当前项目现状，执行以下最小门禁。

### 4.1 对迁移 / 兼容 / 行为保持类任务

开始实现前必须先输出：

- `baseline_sufficient`
- 或 `baseline_gap`
- 或 `exploratory_spike`

### 4.2 如果是 `baseline_sufficient`

必须明确引用已有基线来源，例如：

- `docs/user-intent-acceptance.md`
- `test/acceptance/spec.json`
- `docs/workboard.md`
- 现有 issue / task note / 明确 story 文档

### 4.3 如果是 `baseline_gap`

必须至少产出：

- 当前已有基线项
- 缺失的主流程 / 场景候选
- 推荐先补哪些

### 4.4 如果是 `exploratory_spike`

必须明确：

- 当前不宣称已经满足正式基线
- 输出仅用于学习、探路、补全基线或验证可行性

### 4.5 CI 中的 BDD gate

当前仓库 CI 已执行：

```bash
npm run test:bdd-gate
```

它负责检查：

- 是否存在结构化 gate 文件
- 是否声明了 `bdd_status`
- 是否声明了基线输入
- 是否显式引用了正式 BDD 载体
- `bdd_covered` / `bdd_gap` / `exploratory_spike` 与实现许可状态是否一致

因此：

- markdown 规则是弱约束
- CI gate 是确定性约束

---

## 5. 当前仓库中的推荐 artifact

当前仓库不要求引入整套企业 IPD 模板，但建议沿用以下轻量 artifact：

- `Intent`
  - 任务目标 / 范围 / 非目标
- `Baseline`
  - 现有 story / scenario / acceptance kernel
- `Tech Story`
  - 技术承接拆解
- `Evidence`
  - acceptance / e2e / unit / manual verification
- `Decision`
  - 需要人拍板的基线变更或范围冲突

这些 artifact 不要求每次都新建大文档。

允许的轻量承载方式包括：

- `docs/workboard.md`
- 专门的 gap-analysis 文档
- 任务说明文档
- 代码评审说明

关键不在于形式，而在于：

- 是否可冻结
- 是否可追溯
- 是否能说明当前实现承接了哪条基线

---

## 6. 本仓库中的默认实践建议

结合当前项目，优先使用以下已有资产作为产品基线的核心：

- [`docs/user-intent-acceptance.md`](./user-intent-acceptance.md)
- [`test/acceptance/spec.json`](../test/acceptance/spec.json)
- [`docs/workboard.md`](./workboard.md)

当前 acceptance spec 可以视为本仓库的重要 `baseline kernel`。

因此，对用户可见迁移任务，默认先问：

- 当前 acceptance kernel 是否已经覆盖该任务？
- 如果没有，缺的是哪个主流程或终态？

---

## 7. 对 Agent 的强制要求

以下规则视为必须遵守：

- 不得把“直接开始写代码”作为迁移类任务的默认第一步
- 不得在 `baseline_gap` 状态下跳过 story / scenario 缺口分析
- 不得在 `exploratory_spike` 状态下宣称“已经完成正式交付”
- 不得在触碰已冻结 story / scenario 时静默改语义
- 不得给出没有上游基线映射的用户可见改动结论

---

## 8. 这份规则的演化方式

这份规则不是一次性定死的。

它应当：

- 先作为轻量执行约束使用
- 再通过真实任务复盘持续更新

更新方式应遵循：

- 先跑实践
- 再沉淀规则
- 不提前把整个组织流程写死

也就是说：

> 规则应为实践服务，而不是让实践去迁就过早冻结的高层流程。

---

## 9. 参考来源

以下来源用于抽象上述规则：

- IBM requirements management 公开流程：需求收集、分析、定义、优先级、审批、追踪、变更管理、文档更新
- IBM DOORS / ELM 公开能力：baseline、structured specification、multi-level traceability、configuration management
- Huawei Product Security Baseline 白皮书：baseline 嵌入 IPD、baseline 可执行/可验证/持续优化、baseline 驱动模板和规范更新

这些来源提供的是原则，不是本仓库需要原样复制的企业流程。
