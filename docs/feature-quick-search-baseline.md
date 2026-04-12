# Feature Baseline: Quick Search

> 日期：2026-04-12
> 目的：把 `Quick Search` 从“MV2 明确具备、MV3 当前有 evidence 但缺 BDD”的能力块，正式提升为可承接的 `Feature -> User Story -> BDD` 基线

---

## 1. 这份文档在链路中的位置

当前仓库采用的迁移需求承接链路是：

> `Epic --(探索定义迁移基线)--> Feature --> User Story --(定义BDD场景/验收约束)--> Tech Story`

这份文档只做到：

- `Feature`
- `User Story`
- `BDD 场景 / 验收约束`

不进入：

- `Tech Story`

---

## 2. Feature 定义

### Feature 名称

- `Quick Search`

### Feature 描述

系统提供一个独立的 Quick Search 窗口，用于在不依赖网页内嵌 panel 的情况下完成查词。

它是一个正式的产品能力块，不只是一个内部调试窗口。

### 为什么它属于一级能力块

`Quick Search` 在 MV2 中具备以下一级特征：

- 有独立页面：`quick-search.html`
- 有独立命令入口：`open-quick-search`
- 有独立窗口管理逻辑：`QsPanelManager`
- 有独立配置入口：options 中的 `QuickSearch`
- 可与页面选词、剪贴板、快捷键、sidebar 布局等功能协同

因此，它不应被降格为“查词主闭环的一个小实现细节”。

---

## 3. 主要证据来源

### 3.1 MV2 实现基线来源

- [`mv2-capability-inventory.md`](./mv2-capability-inventory.md)
- MV2:
  - `src/manifest/common.manifest.js`
  - `src/background/initialization.ts`
  - `src/background/server.ts`
  - `src/background/windows-manager.ts`
  - `src/options/components/Entries/QuickSearch/index.tsx`
  - `src/content/redux/init.ts`

### 3.2 当前 MV3 evidence 来源

- [`migration-baseline-discovery.md`](./migration-baseline-discovery.md)
- `test/e2e/extension-e2e.mjs`
  - `quick-search.html` 页面存在与渲染
- `test/e2e/playwright-e2e.mjs`
  - `Quick Search` 页面渲染
  - `windows.create popup`

### 3.3 当前结论

当前已经能证明：

- `Quick Search` 页面在 MV3 build 中存在
- 扩展可以创建 popup window

当前还不能正式证明：

- 用户级 Quick Search 主流程已经被完整承接

所以它当前是：

- `有 evidence，缺正式 BDD`

---

## 4. User Story（第一版）

以下 `User Story` 是基于 MV2 实现和当前产品基线提炼出的第一版。

### QS-US1

作为扩展用户，我希望能主动打开一个独立的 Quick Search 窗口，以便在不依赖当前页面面板的情况下执行查词。

### QS-US2

作为扩展用户，当 Quick Search 已经打开时，我希望再次触发该入口时复用或聚焦已有窗口，而不是无限创建重复窗口。

### QS-US3

作为扩展用户，当 Quick Search 配置为 `selection preload` 时，我希望它能够从当前页面预载已选择内容。

### QS-US4

作为扩展用户，当 Quick Search 配置为 `clipboard preload` 时，我希望它能够预载剪贴板内容。

### QS-US5

作为扩展用户，当预载文本存在且 `auto search` 开启时，我希望 Quick Search 在打开后自动进入查询，并最终得到一个明确终态。

### QS-US6

作为扩展用户，当预载文本存在但 `auto search` 未开启时，我希望 Quick Search 只初始化查询文本，而不是自动发起搜索。

### QS-US7

作为扩展用户，当 Quick Search 被配置为 sidebar 模式时，我希望窗口位置和主窗口布局能够按照配置调整，而不是随机遮挡或失控。

---

## 5. 当前建议纳入第一轮的 User Story

不是所有 story 都应该在第一轮就冻结成正式基线。

### 第一轮建议纳入

- `QS-US1`
- `QS-US2`
- `QS-US3`
- `QS-US5`

原因：

- 这些构成了 Quick Search 的最小主流程
- 它们最接近“用户真正感知 Quick Search 是否可用”
- 当前已有 evidence，适合先补最小 BDD

### 第二轮再考虑

- `QS-US4`
- `QS-US6`
- `QS-US7`

原因：

- 仍然重要，但不是第一轮最小闭环必须项
- 它们更依赖配置组合、窗口布局或权限条件

---

## 6. BDD 场景 / 验收约束（第一版）

下面的场景不是测试代码，而是冻结行为边界的候选 `BDD`。

### QS-BDD-1 打开独立窗口

Given 扩展已安装并运行  
When 用户触发 `open-quick-search` 能力  
Then 扩展应打开一个独立的 Quick Search 窗口  
And 该窗口加载 `quick-search.html`  
And 页面渲染成功

承接：

- `QS-US1`

当前 evidence：

- 页面存在与渲染
- `windows.create popup` 成功

当前缺口：

- 还没有把“通过正式入口触发”冻结为用户场景

### QS-BDD-2 已有窗口时复用/聚焦

Given Quick Search 窗口已经存在  
When 用户再次触发 Quick Search  
Then 系统应复用或聚焦已有窗口  
And 不应创建第二个失控重复窗口

承接：

- `QS-US2`

当前 evidence：

- `QsPanelManager.hasCreated/focus` 逻辑存在

当前缺口：

- 当前没有 acceptance / e2e 场景正式冻结这一行为

### QS-BDD-3 选区预载

Given Quick Search 配置为 `selection preload`  
And 当前页面存在有效选区  
When 用户打开 Quick Search  
Then Quick Search 应预载该选区文本

承接：

- `QS-US3`

当前 evidence：

- MV2 / MV3 都存在 `lastTab` + `PRELOAD_SELECTION` 路径

当前缺口：

- 当前没有正式场景证明用户级预载行为成立

### QS-BDD-4 预载 + 自动搜索

Given Quick Search 已成功预载文本  
And `auto search` 已开启  
When Quick Search 窗口完成初始化  
Then 系统应自动发起查询  
And 在可见时间内到达明确终态  
And 终态只能是 `success / empty / error`

承接：

- `QS-US5`

当前 evidence：

- 初始化逻辑存在
- 当前 lookup kernel 已定义“明确终态”契约

当前缺口：

- Quick Search 还没有与 lookup terminal contract 正式挂接

---

## 7. 当前验收层建议

对 `Quick Search`，当前更建议先挂到：

- `Playwright E2E`

原因：

- 该 feature 本质上跨越：
  - service worker
  - popup window
  - extension page
  - page selection preload
- 当前 acceptance harness 更偏向“内容页划词主闭环”
- `Quick Search` 的主语义包含窗口创建与复用，这更接近 E2E 责任边界

当前建议：

- 第一轮先把 `QS-BDD-1 ~ QS-BDD-4` 作为 E2E 目标场景
- 后续如果 acceptance harness 支持 extension page driver，再考虑部分场景下沉

---

## 8. 当前 Feature 的最小正式基线

如果只冻结最小可执行基线，建议当前把 `Quick Search` 的正式承接边界定义为：

### 必须成立

- 可以打开独立窗口
- 已有窗口时可以复用或聚焦
- 支持从当前页面预载 selection
- 预载文本 + auto search 时，能到达明确终态

### 可以暂缓

- clipboard preload
- 非 auto search 初始化语义
- sidebar 布局与主窗口联动细节

---

## 9. 当前结论

`Quick Search` 不应继续停留在“MV3 中页面能打开、窗口能创建”的 evidence 层。

它已经具备足够条件进入：

- `Feature`
- `User Story`
- `BDD 场景 / 验收约束`

的正式基线承接。

因此，`Quick Search` 适合作为：

> 当前仓库第一个完整走通 `Feature -> User Story -> BDD` 的 `P1` 迁移切片。

