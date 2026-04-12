# Spec Proposal: Quick Search

> 日期：2026-04-12
> 目的：定义 `Quick Search` 应如何进入统一的 `spec.json` 载体，使其成为正式 BDD 基线的一部分
> 状态：`frozen-v1`

---

## 1. 核心原则

当前仓库中：

- [`test/acceptance/spec.json`](../test/acceptance/spec.json)

就是正式的 BDD 场景载体。

因此，对 `Quick Search` 这类新 feature，正确方向不是另起一套平行 BDD 体系，而是：

> 扩展现有 `spec` 的表达能力，让 `Quick Search` 场景也能进入同一个结构化载体。

也就是说：

- `spec` 继续定义“从用户粒度看，要测什么”
- runner / helper / Playwright 代码继续定义“怎么测”

---

## 2. 设计目标

这次扩展应尽量满足以下目标：

### 2.1 保持现有 spec 风格

继续保留当前场景结构：

- `id`
- `intent`
- `runtime`
- `steps`

避免为了 `Quick Search` 引入完全不同的 DSL。

### 2.2 保持统一 BDD 基线

`Quick Search` 的正式 BDD 也应进入统一 spec，而不是游离在独立 markdown 文档或平行 JSON 文件里。

### 2.3 允许不同 runner 执行不同场景

`spec` 应继续保持统一，但执行层可以根据场景特征决定：

- 哪些场景由 acceptance runner 执行
- 哪些场景由 e2e runner 执行

### 2.4 尽量少泄漏技术细节

`spec` 中应该表达：

- 用户触发了什么
- 系统应呈现什么

而不应该表达：

- Playwright 怎样点击
- service worker 如何调用
- helper 如何实现

---

## 3. 建议的最小 schema 扩展

### 3.1 保留现有字段

场景仍然保留：

```json
{
  "id": "...",
  "intent": "...",
  "runtime": {},
  "steps": []
}
```

### 3.2 新增可选顶层字段

建议新增两个可选字段：

#### `feature`

用于把场景显式映射到 Feature。

例如：

```json
"feature": "quick-search"
```

#### `runner`

用于告诉执行层，这个场景更适合由哪个 runner 执行。

例如：

```json
"runner": "e2e"
```

当前建议值：

- `acceptance`
- `e2e`

说明：

- 这不会改变 BDD 载体本身
- 只是帮助统一 spec 下的多 runner 路由

---

## 4. Quick Search 需要的最小 action 扩展

当前 `spec` 支持的 action 主要围绕 lookup panel：

- `lookup`
- `search`
- `addToNotebook`
- `historyBack`
- `historyForward`
- `closePanel`

对 `Quick Search`，建议最小新增以下 action。

### 4.1 `openQuickSearch`

语义：

- 用户触发 Quick Search

它应同时承担：

- 打开 / 聚焦 Quick Search
- 在需要时带入 preload 上下文
- 在 step 上直接声明期望结果

这符合现有 `lookup` step 的风格：

- 一个动作
- 同时携带断言字段

### 4.2 `closeQuickSearch`

语义：

- 用户关闭 Quick Search 窗口

当前不是第一轮必需，但建议保留扩展位。

---

## 5. `openQuickSearch` step 的建议字段

下面字段不是一次都必须支持，而是建议的最小演化方向。

### 5.1 基础触发与窗口断言

- `action`
  - 固定为 `openQuickSearch`
- `expectedPage`
  - 例如 `quick-search.html`
- `expectedWindowCount`
  - 例如 `1`
- `expectedReuse`
  - 是否应复用已有窗口

### 5.2 预载相关字段

为了与现有 fixture 页协同，建议允许：

- `targetId`
- `word`
- `rangeStartWord`
- `rangeEndWord`
- `rangeStartInset`
- `rangeEndInset`
- `rangeEndFrom`
- `expectedSelection`

这样 `Quick Search` 可复用当前 lookup fixture 的文本选区机制，而不是新造一套 fixture 描述方式。

### 5.3 查询状态字段

为了与现有 lookup terminal contract 对齐，建议复用已有断言字段：

- `expectedQueryText`
- `expectedPanelState`
- `expectedItemState`
- `expectedDictId`

这样可以最大限度减少“Quick Search 专属断言语义”。

### 5.4 Fixture 字段

建议继续复用现有 fixture 路由字段：

- `bingFixture`
- `googleFixture`

---

## 6. Quick Search 场景建议写法

以下场景是建议进入统一 `spec` 的第一版结构。

### 6.1 打开独立窗口

```json
{
  "id": "quick-search-open-window",
  "feature": "quick-search",
  "runner": "e2e",
  "intent": "The user can open a standalone Quick Search window",
  "steps": [
    {
      "action": "openQuickSearch",
      "expectedPage": "quick-search.html",
      "expectedWindowCount": 1
    }
  ]
}
```

### 6.2 已有窗口时复用/聚焦

```json
{
  "id": "quick-search-reuse-window",
  "feature": "quick-search",
  "runner": "e2e",
  "intent": "Triggering Quick Search again reuses or focuses the existing window instead of opening duplicates",
  "steps": [
    {
      "action": "openQuickSearch",
      "expectedPage": "quick-search.html",
      "expectedWindowCount": 1
    },
    {
      "action": "openQuickSearch",
      "expectedPage": "quick-search.html",
      "expectedWindowCount": 1,
      "expectedReuse": true
    }
  ]
}
```

### 6.3 选区预载

```json
{
  "id": "quick-search-selection-preload",
  "feature": "quick-search",
  "runner": "e2e",
  "runtime": {
    "config": {
      "qsPreload": "selection",
      "qsAuto": false
    }
  },
  "intent": "Quick Search preloads the current selection when selection preload is enabled",
  "steps": [
    {
      "action": "openQuickSearch",
      "targetId": "word-success",
      "word": "Example",
      "expectedSelection": "Example",
      "expectedQueryText": "Example",
      "expectedPage": "quick-search.html",
      "expectedWindowCount": 1
    }
  ]
}
```

### 6.4 预载 + 自动搜索 -> 明确终态

```json
{
  "id": "quick-search-selection-auto-search",
  "feature": "quick-search",
  "runner": "e2e",
  "runtime": {
    "selectedDicts": ["bing"],
    "config": {
      "qsPreload": "selection",
      "qsAuto": true
    }
  },
  "intent": "Quick Search automatically searches preloaded selection and reaches a terminal state",
  "steps": [
    {
      "action": "openQuickSearch",
      "targetId": "word-success",
      "word": "Example",
      "bingFixture": "bing-success.html",
      "expectedSelection": "Example",
      "expectedQueryText": "Example",
      "expectedPanelState": "success",
      "expectedItemState": "success",
      "expectedPage": "quick-search.html",
      "expectedWindowCount": 1
    }
  ]
}
```

---

## 7. 为什么这是“最小扩展”

这份提案刻意做了几件事：

- 不改现有 `spec` 的基本形状
- 不新造另一套 DSL
- 尽量复用现有 fixture 字段
- 尽量复用现有 lookup terminal contract
- 只新增：
  - 顶层 `feature`
  - 顶层 `runner`
  - action `openQuickSearch`
  - 少量窗口断言字段

因此它更像：

- `spec` 的自然扩展

而不是：

- `spec` 的推翻重写

---

## 8. 当前尚未决定的点

这份提案故意不提前冻结以下实现问题：

- `openQuickSearch` 最终是通过什么技术入口触发
- `expectedReuse` 如何在 runner 中判定
- 如何等待 Quick Search page / window 出现
- Quick Search 场景由哪个 runner 文件具体执行
- 是否需要引入新的 page-state reader helper

这些都属于：

- runner / helper / 测试实现层

不应反向污染 `spec` 层设计。

---

## 9. 当前结论

`Quick Search` 完全可以进入当前统一的 `spec.json` 载体。

不需要新造平行 BDD 体系。

真正要做的是：

- 对现有 spec 做最小 schema 扩展
- 再由技术层承接 runner 实现

因此，下一步如果继续推进，应该是：

> 冻结这份 spec 扩展方案，再决定 runner 如何支持它。

---

## 10. 冻结说明

截至 2026-04-12，这份提案作为 `Quick Search` 的第一版 spec 扩展方案已被冻结。

当前冻结的内容包括：

- `spec.json` 继续作为唯一正式 BDD 载体
- `Quick Search` 不引入平行 BDD 文件格式
- 最小 schema 扩展方向为：
  - 顶层可选字段：`feature`、`runner`
  - 最小 action 扩展：`openQuickSearch`
- 第一轮推荐纳入的正式场景方向为：
  - 打开独立窗口
  - 已有窗口时复用/聚焦
  - 选区预载
  - 预载 + 自动搜索到明确终态

当前未冻结的内容包括：

- runner 如何具体执行这些场景
- 新 action 的技术实现细节
- helper / fixture / popup discovery 的具体设计

也就是说：

> `spec` 层已经冻结，执行层仍待承接。
