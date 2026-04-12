# Test Tech Story: Quick Search

> 日期：2026-04-12
> 目的：把 [`feature-quick-search-baseline.md`](./feature-quick-search-baseline.md) 里的 `BDD` 场景，进一步承接为“测试实现层”的技术拆解，但暂时不写测试代码

---

## 1. 这份文档的位置

当前链路：

> `Epic --(探索定义迁移基线)--> Feature --> User Story --(定义BDD场景/验收约束)--> Tech Story`

这份文档属于：

- `BDD 场景` 与 `测试实现` 之间的承接层

它回答的是：

- 每条 `Quick Search BDD` 场景更适合挂在哪个测试层
- 需要哪些测试辅助能力
- 断言点是什么
- 当前 blocker 是什么

它不回答：

- 产品代码如何修改
- 最终测试代码如何写

---

## 2. 当前目标

把 [`feature-quick-search-baseline.md`](./feature-quick-search-baseline.md) 中建议优先冻结的 4 条场景：

- `QS-BDD-1`
- `QS-BDD-2`
- `QS-BDD-3`
- `QS-BDD-4`

承接为可实现的测试设计。

---

## 3. 当前测试资产盘点

### 3.1 已有最适合复用的测试层

当前更适合挂载到：

- [`test/e2e/playwright-e2e.mjs`](../test/e2e/playwright-e2e.mjs)

原因：

- 该文件已具备真实扩展运行时
- 已覆盖 extension pages
- 已覆盖 service worker
- 已覆盖 `windows.create popup`
- 可访问 service worker 执行上下文
- 已复用：
  - [`test/acceptance/helpers.mjs`](../test/acceptance/helpers.mjs)

### 3.2 当前已有 helper 能力

可直接复用：

- `waitFor`
- `readLookupUi`
- `getTextRect`
- `centerOf`
- 浏览器代理配置
- 扩展 ID 检测
- service worker evaluate

### 3.3 当前还没有的显式 helper 能力

尚缺但可通过新 helper 补充：

- 按 URL / 页面标题识别 Quick Search window
- 等待新 popup window 出现
- 从已有 Quick Search window 中读取 query / terminal state
- 在普通页面制造选区后再触发 Quick Search

---

## 4. 场景挂载建议

### QS-BDD-1 打开独立窗口

建议挂载：

- `Playwright E2E`

原因：

- 这是典型 runtime + window 行为
- 当前已有 `windows.create popup` smoke signal
- 只差把“用户正式入口”冻结成场景

### QS-BDD-2 已有窗口时复用/聚焦

建议挂载：

- `Playwright E2E`

原因：

- 这是窗口管理语义
- acceptance 层当前没有窗口生命周期驱动能力

### QS-BDD-3 选区预载

建议挂载：

- `Playwright E2E`

原因：

- 同时依赖：
  - 内容页真实选区
  - Quick Search window
  - preload bridge

### QS-BDD-4 预载 + 自动搜索

建议挂载：

- `Playwright E2E`

原因：

- 该场景横跨：
  - preload
  - extension page initialization
  - lookup terminal contract

结论：

- 第一轮 `Quick Search` 场景全部建议挂载到 `Playwright E2E`

---

## 5. 每条场景的测试 tech story

### QSTS-1 承接 QS-BDD-1：打开独立窗口

对应：

- `QS-US1`
- `QS-BDD-1`

目标：

- 用真实扩展入口验证 Quick Search 独立窗口能被打开并成功渲染

建议实现位置：

- `test/e2e/playwright-e2e.mjs`
  - 新增单独 phase 或 phase 下的新小节

测试前置：

- 扩展已加载
- service worker 可用

建议步骤：

1. 获取当前 service worker
2. 通过正式入口触发 Quick Search
3. 等待新窗口 / 页面出现
4. 识别其 URL 为 `quick-search.html`
5. 验证页面 root 和基本 UI 存在

建议入口方式：

- 首选：通过 background / service worker 调用正式能力
  - `BackgroundServer.getInstance().openQSPanel()` 所对应的 runtime path
- 备选：通过 `chrome.runtime.sendMessage({ type: 'OPEN_QS_PANEL' })`

关键断言：

- 新页面 URL 为扩展内的 `quick-search.html`
- 页面渲染成功
- 不是空白页

当前 blocker：

- 需要一个稳定的“等待 Quick Search window 出现”的 helper

### QSTS-2 承接 QS-BDD-2：已有窗口时复用/聚焦

对应：

- `QS-US2`
- `QS-BDD-2`

目标：

- 验证重复触发 Quick Search 时不会创建重复失控窗口

建议实现位置：

- `test/e2e/playwright-e2e.mjs`

测试前置：

- 已成功创建一个 Quick Search window

建议步骤：

1. 第一次触发 Quick Search
2. 记录现有 Quick Search window/page identity
3. 第二次触发 Quick Search
4. 等待系统稳定
5. 统计 Quick Search window/page 数量
6. 验证仍然只有一个实例，或验证同一实例被聚焦

关键断言：

- 不出现第二个 Quick Search 窗口
- 或窗口 ID / URL / page identity 保持一致

当前 blocker：

- 需要定义“实例复用”的稳定判定方式
- Playwright 对扩展 popup window 的聚焦状态可观察性需要确认

### QSTS-3 承接 QS-BDD-3：选区预载

对应：

- `QS-US3`
- `QS-BDD-3`

目标：

- 验证 `selection preload` 能把页面选区带入 Quick Search

建议实现位置：

- `test/e2e/playwright-e2e.mjs`

测试前置：

- 打开一个普通测试页面
- 创建可控文本选区
- 将 Quick Search 相关配置切到 `selection preload`

建议步骤：

1. 打开本地 fixture 页面
2. 构造用户选区
3. 通过 runtime/config API 将 Quick Search 切到 `selection preload`
4. 触发 Quick Search
5. 读取 Quick Search 初始 query text

关键断言：

- query text 与页面选区一致

当前 blocker：

- 当前 E2E 中还没有统一的“配置注入 helper”
- 需要确认是通过 storage 直接写配置，还是通过 options/runtime 消息完成配置

### QSTS-4 承接 QS-BDD-4：预载 + 自动搜索 -> 明确终态

对应：

- `QS-US5`
- `QS-BDD-4`

目标：

- 验证 Quick Search 在预载成功且 `auto search` 开启时，会自动进入查询并到达明确终态

建议实现位置：

- `test/e2e/playwright-e2e.mjs`

测试前置：

- 已有稳定的选区预载能力
- 已能控制 `qsAuto` / preload 配置
- 已有可控 provider fixture 或 acceptance-style mock

建议步骤：

1. 打开 fixture 页面并构造选区
2. 配置：
   - `selection preload = on`
   - `auto search = on`
3. 打开 Quick Search
4. 等待查询完成
5. 在 Quick Search 页面读取 lookup terminal state

关键断言：

- query text 正确
- 最终到达明确终态
- 终态必须是：
  - `success`
  - `empty`
  - `error`

当前 blocker：

- 当前 acceptance runtime mock 主要挂在 acceptance harness 中
- 需要决定 Quick Search E2E 是否：
  - 复用 acceptance runtime mock
  - 或直接用 fixture provider

---

## 6. 共同 blocker

在正式写 Quick Search 的 E2E 之前，建议先解决以下公共问题。

### B1. Quick Search window/page discovery helper

需要一个 helper，用来：

- 找到当前 Quick Search 页面
- 等待其出现
- 区分新窗口与旧窗口

### B2. 配置注入方式

需要统一决定：

- Quick Search 相关配置在 E2E 中如何设置

候选方案：

- 直接写 `chrome.storage`
- 通过扩展 runtime message 配置
- 通过 options 页面 UI 配置

当前建议：

- 第一轮优先选最稳定、最不依赖 UI 的方式
- 倾向直接写 storage 或通过 runtime message

### B3. Quick Search 页面读取 helper

需要一个 helper，用来在 `quick-search.html` 中读取：

- 当前 query text
- lookup panel state
- terminal state
- item state

当前可能可以部分复用：

- `readLookupUi`

但需要确认它对 Quick Search 页面是否直接适用。

### B4. 可控查询结果来源

需要决定：

- Quick Search 的 terminal state 测试使用什么可控输入

候选方案：

- 复用 acceptance mock
- 复用现有 fixture provider
- 新建 Quick Search 专用 fixture/mocking path

---

## 7. 建议的实现顺序

如果后续开始写测试代码，建议顺序如下：

1. 先做 `QSTS-1`
   - 打开独立窗口
2. 再做 `QSTS-2`
   - 重复触发复用/聚焦
3. 再做 `QSTS-3`
   - selection preload
4. 最后做 `QSTS-4`
   - preload + auto search + terminal state

原因：

- 前一个场景是后一个场景的基础
- 可以逐步补齐 helper，而不是一上来写一个很大的 E2E

---

## 8. 当前结论

`Quick Search` 的 `BDD` 已经足够清晰，可以进入测试承接设计。

当前最合理的选择是：

- 全部先挂到 `Playwright E2E`
- 先补 helper / config / popup-discovery 这些测试基础设施
- 暂不进入产品代码实现

