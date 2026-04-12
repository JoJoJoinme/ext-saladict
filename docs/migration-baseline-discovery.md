# MV3 迁移基线探索 v0

> 日期：2026-04-12
> 目标：把当前仓库的 MV3 迁移任务，先映射到一条可执行的需求承接链路上
>
> 链路：
>
> `Epic --(探索定义迁移基线)--> Feature --> User Story --(定义BDD场景/验收约束)--> Tech Story`

---

## 1. 这份文档解决什么问题

这不是完整的规格说明书，也不是 tech story 文档。

它只解决一件事：

> 在进入技术承接前，先把当前 MV3 迁移任务的“迁移基线”盘出来。

这里的“迁移基线”指的是：

- 这次迁移到底要保护哪些主能力块
- 这些能力块当前已经有哪些 `User Story`
- 这些 story 当前已经有哪些 `BDD Scenario / 验收约束`
- 哪些地方已经有足够 evidence
- 哪些地方仍然存在 `BDD gap`

这份文档当前只做到：

- `Epic`
- `迁移基线`
- `Feature`
- `User Story`
- `BDD gap analysis`

还没有进入：

- `Tech Story`

---

## 2. Epic

当前迁移任务的 `Epic` 定义如下：

- 完成 `ext-saladict` 的 MV2 -> MV3 迁移

默认原则：

- 默认保持与 MV2 的用户可见行为一致
- 当前优先范围是 Chrome / Edge
- 主流程优先于边角行为
- 对旧系统行为的保护以已冻结的基线和主流程认知为准，而不是默认保护所有历史偶然实现

---

## 3. 当前迁移基线的输入源

当前 `迁移基线` 不是从空白写出来的，而是来自以下输入：

### 3.1 已有产品/验收基线

- [`docs/user-intent-acceptance.md`](./user-intent-acceptance.md)
- [`test/acceptance/spec.json`](../test/acceptance/spec.json)
- [`mv2-capability-inventory.md`](./mv2-capability-inventory.md)

当前 acceptance spec 已经提供了一个重要的 `baseline kernel`。
而 `MV2 capability inventory` 则补上了：

- 当前 acceptance kernel 之外
- 但 MV2 实现中明确存在的一级能力块

因此，这份迁移基线探索从现在开始同时参考：

- `显式产品基线`
- `MV2 实现基线`

### 3.2 已有运行时与页面能力 evidence

- [`test/e2e/playwright-e2e.mjs`](../test/e2e/playwright-e2e.mjs)
- [`test/e2e/extension-e2e.mjs`](../test/e2e/extension-e2e.mjs)
- [`docs/verification-report-2026-04-12.md`](./verification-report-2026-04-12.md)

这些文件提供了：

- 扩展页渲染
- service worker 生命周期
- offscreen
- clipboard
- PDF
- context menu
- badge
- popup window

等能力存在性的 evidence。

### 3.3 当前工作线与产品对齐上下文

- [`docs/workboard.md`](./workboard.md)

当前 workboard 已经明确：

- MV3 基础运行时已经基本完成
- 当前更大的未决点是产品行为对齐，而不是纯架构不可用

### 3.4 代码入口点

以下入口点帮助识别一级产品能力块：

- `src/entrypoints/content.ts`
- `src/entrypoints/selection.content.ts`
- `src/entrypoints/quick-search/*`
- `src/entrypoints/popup/*`
- `src/entrypoints/options/*`
- `src/entrypoints/notebook/*`
- `src/entrypoints/history/*`
- `src/entrypoints/word-editor/*`
- `src/entrypoints/audio-control/*`
- `src/background/*`

---

## 4. 当前 baseline kernel

当前 acceptance spec 已冻结的场景如下。

这些场景是当前 MV3 迁移最重要的 `baseline kernel`：

1. `lookup-success`
   - 已知词条能查到明确结果
2. `lookup-empty`
   - 无结果时必须显示 explicit empty
3. `lookup-network-error`
   - provider 失败时必须显示 explicit error
4. `lookup-terminal-transitions`
   - 新查询必须替换旧终态
5. `lookup-search-refines-query`
   - 面板内再次搜索得到新的明确终态
6. `lookup-close-and-reopen`
   - 关闭面板后还能继续下一次查词
7. `lookup-add-to-notebook`
   - 成功查词后可加入 notebook，且 UI 与存储都可观察
8. `lookup-history-navigation`
   - 多次查词后可前进/后退浏览历史
9. `lookup-long-selection-translation`
   - 长选区应落到明确翻译终态
10. `lookup-long-selection-fragment-translation`
   - 长选区碎片仍应落到明确翻译终态

这一组 kernel 说明：

- 当前主闭环已经围绕“划词 -> 打开面板 -> 得到明确终态”建立了比较稳的产品基线
- 但它还不是完整迁移基线
- 它目前只覆盖了查词主闭环及其几个关键延伸动作
- 还必须与 [`mv2-capability-inventory.md`](./mv2-capability-inventory.md)
  一起使用，才能避免漏掉 MV2 中真实存在的一级能力块

---

## 5. Feature 地图（第一版）

下面这份 `Feature` 地图不是最终冻结版，而是第一版迁移基线候选。

状态含义：

- `已覆盖`
  - 已有 acceptance kernel 直接覆盖
- `有 evidence，缺 BDD`
  - 已有 E2E / manual / docs evidence，但缺少明确的 BDD 场景约束
- `待探索`
  - 当前只知道能力存在，但还不能稳定说明其主流程边界

### F1. 划词查词主闭环

状态：

- `已覆盖`

已有 User Story：

- 用户在普通网页精确划词后，点击查词入口，必须在可见时间内得到一个明确终态
- 明确终态只能是 `success / empty / error`
- 新选择必须替换旧终态，不能残留旧结果或空白壳子

已有 BDD / 验收约束：

- `lookup-success`
- `lookup-empty`
- `lookup-network-error`
- `lookup-terminal-transitions`

备注：

- 这是当前最稳的迁移主基线

### F2. 面板内连续操作

状态：

- `已覆盖`

已有 User Story：

- 用户打开面板后可以继续输入新查询并得到新终态
- 用户关闭面板后，还能继续下一次查词

已有 BDD / 验收约束：

- `lookup-search-refines-query`
- `lookup-close-and-reopen`

### F3. 查词结果持久化与导航

状态：

- `已覆盖`

已有 User Story：

- 用户可以把当前词条加入 notebook，并观察到保存成功
- 用户在多次查词后可以前进/后退浏览查词历史，并得到对应结果

已有 BDD / 验收约束：

- `lookup-add-to-notebook`
- `lookup-history-navigation`

### F4. 长选区翻译路由

状态：

- `已覆盖`

已有 User Story：

- 用户选择长句时，应得到明确翻译终态，而不是空白或全 empty
- 用户选择跨词边界的长句碎片时，仍然应得到明确翻译终态

已有 BDD / 验收约束：

- `lookup-long-selection-translation`
- `lookup-long-selection-fragment-translation`

备注：

- 当前 kernel 已覆盖“有无终态”这件事
- 但“默认 profile 下长选区到底应该走哪些 provider / route quality 应如何定义”仍在产品对齐中
- 这属于后续更细的产品基线问题，不影响当前 kernel 成立

### F5. Quick Search 独立窗口

状态：

- `有 evidence，缺 BDD`

已有 evidence：

- `quick-search` 页面构建和渲染存在
- `windows.create popup` 在 E2E 中通过
- `docs/architecture.md` 明确把 `quick-search` 视为正式扩展入口

候选 User Story：

- 用户可以打开 `Quick Search` 独立窗口
- 用户可以在独立窗口内执行查询并得到明确终态
- 独立窗口在已存在时可以被复用或聚焦，而不是重复失控创建

当前 BDD 情况：

- 当前 acceptance kernel 未直接覆盖

当前判断：

- 这是 `P1 gap`
- 适合作为第一轮“Agent 补全迁移基线”的实验对象

当前进一步 formalization 见：

- [`feature-quick-search-baseline.md`](./feature-quick-search-baseline.md)

### F6. 触发入口：Context Menu / Shortcut / Clipboard

状态：

- `有 evidence，缺 BDD`

已有 evidence：

- context menu 创建 / 删除在 E2E 中通过
- clipboard roundtrip 在 E2E 中通过
- `commands` / `context menus` / `search-clipboard` 在代码中具备明确入口

候选 User Story：

- 用户可以通过 context menu 触发查词或相关入口
- 用户可以通过快捷键打开 quick search 或搜索剪贴板内容
- 用户在授权存在的前提下可完成 clipboard search 流程

当前 BDD 情况：

- 当前 acceptance kernel 未直接覆盖

当前判断：

- `P2 gap`
- 有价值，但不应先于 Quick Search / PDF 主场景

当前进一步 formalization 见：

- [`feature-trigger-entry-baseline.md`](./feature-trigger-entry-baseline.md)

### F7. 扩展页可用性

状态：

- `有 evidence，缺 BDD`

已有 evidence：

- popup / options / history / notebook / quick-search / word-editor 页面均有 E2E 渲染 evidence
- popup UI rendered
- options UI rendered

候选 User Story：

- 用户能打开 popup 并看到可用 UI
- 用户能打开 options / history / notebook / word-editor 页面

当前 BDD 情况：

- 当前没有面向用户任务的 acceptance 场景

当前判断：

- `P2 gap`
- 当前更像“存在性 evidence”，还不是完整行为基线

当前进一步 formalization 见：

- [`feature-extension-pages-baseline.md`](./feature-extension-pages-baseline.md)

### F8. PDF 打开链路

状态：

- `有 evidence，缺 BDD`

已有 evidence：

- PDF interception 在 E2E 中通过
- `webRequest` / `DNR` / `tabs.update` 相关 runtime evidence 已存在
- 代码中有明确的 `openPDF` 与 `pdfSniffer` 承接

候选 User Story：

- 用户打开 PDF 链接或页面时，可以进入扩展 PDF viewer 链路
- PDF 相关入口行为与 MV2 主要体验保持一致

当前 BDD 情况：

- 当前 acceptance kernel 未覆盖

当前判断：

- `P1 gap`
- 这是扩展的重要一级能力块，不应只停留在 runtime evidence 层

### F9. 音频播放链路

状态：

- `有 evidence，缺 BDD`

已有 evidence：

- offscreen PLAY_AUDIO pipeline 在 E2E 中通过
- 相关 unit test 与 runtime boundary test 已存在

候选 User Story：

- 用户在可发音词条上触发音频时，扩展必须能完成可观察的播放动作

当前 BDD 情况：

- 当前 acceptance kernel 未覆盖

当前判断：

- `P2 gap`
- 当前更多是运行时能力 evidence，而不是正式产品验收基线

当前进一步 formalization 见：

- [`feature-audio-baseline.md`](./feature-audio-baseline.md)

### F10. Clipboard 链路

状态：

- `有 evidence，缺 BDD`

已有 evidence：

- clipboard roundtrip 在 E2E 中通过
- 相关 offscreen / permissions path 已存在

候选 User Story：

- 用户在授权存在时，能够完成复制/读取剪贴板相关查询流程

当前 BDD 情况：

- 当前 acceptance kernel 未覆盖

当前判断：

- `P2 gap`

当前进一步 formalization 见：

- [`feature-clipboard-baseline.md`](./feature-clipboard-baseline.md)

---

## 6. 当前 User Story / BDD gap 总结

按当前第一版探索结果，缺口可以先分成三组。

### 6.1 已具备 acceptance kernel 的能力

- 划词查词主闭环
- 面板内连续操作
- 查词结果持久化与导航
- 长选区翻译路由

这些能力块已经有比较明确的 `User Story + BDD` 基线，可直接作为后续 `Tech Story` 的承接上游。

### 6.2 当前 formalization 状态

当前已经完成正式 BDD 承接的能力包括：

- `Quick Search`
- `PDF`
- `Trigger Entry Paths`
- `Extension Pages`
- `Audio Playback`
- `Clipboard`

这意味着：

- 当前识别出的主要用户可见能力块，已经全部具备正式 BDD 承接
- 迁移任务在“规格承接层”已不再缺主 feature 的 formal BDD

### 6.3 当前主缺口已从“BDD 缺口”转向“runner 承接缺口”

当前剩余的主要问题不再是：

- 哪些 feature 没有正式 BDD

而是：

- 哪些 `runner=e2e` 场景还没有执行层支持
- 哪些 helper / fixture / page discovery 能力还没有补齐

---

## 7. 当前不做的事

这份文档当前明确不做：

- 不把所有旧代码行为都自动纳入“必须迁移保持一致”
- 不直接拆 `Tech Story`
- 不直接生成大而全的 IPD 文档
- 不在没有冻结 `User Story + BDD` 前直接宣称后续实现已经承接完整需求

---

## 8. 推荐下一步

基于这份 `迁移基线探索 v0`，当前建议下一步转向执行层承接：

### 当前重点

- `spec` 承接已经完成
- 下一步应优先进入：
  - `runner`
  - `helper`
  - `fixture`
  - `execution-layer tech story`

### 当前优先入口

- `Quick Search`
  - 因为它是第一个完整 formalized 的迁移切片
  - 也最适合作为 runner-side carry-over 的实验对象

---

## 9. 一句话结论

当前仓库已经不再缺“正式 BDD 承接”这一层。

下一阶段真正要解决的是：

> 如何让统一 `spec.json` 中的 `runner=e2e` 场景被执行层稳定承接。
