# Test Contract Layer Review

> 日期：2026-04-12
> 目的：把现有 `lookup` 测试的依赖模型抽象成模板，并对照当前已 formalize 的 feature 盘点各自缺少的测试契约层

---

## 1. 为什么要做这份盘点

当前仓库已经完成了：

- `Feature`
- `User Story`
- `BDD`
- `spec.json` formal carry-over

但下一阶段要进入：

- runner
- helper
- fixture
- execution-layer carry-over

在这一步最容易出问题的是：

- runner 直接耦合实现细节
- feature 没有稳定测试契约
- 测试只能围着当前代码写，重构时大量破碎

因此需要先回答：

> 现有 `lookup` 测试到底依赖哪些层？  
> 其他 feature 现在还缺哪一层？

---

## 2. `lookup` 现有依赖模型

当前 `lookup` 这套测试不是直接绑死实现，而是依赖一条比较清晰的分层链路：

### L1. 正式 BDD 载体

- [`test/acceptance/spec.json`](../test/acceptance/spec.json)

这里定义：

- 用户动作
- 预期终态
- 场景 intent

### L2. 统一执行器

- [`test/acceptance/playwright-acceptance.mjs`](../test/acceptance/playwright-acceptance.mjs)

这里负责：

- 读取 `spec`
- 分发 `step.action`
- 操作浏览器
- 做断言

### L3. Fixture / 受控外部依赖层

- 本地 fixture 页面
- `bingFixture`
- `googleFixture`
- route interception

这里负责隔离外部世界，避免测试红绿依赖真实网络。

### L4. 产品测试契约层

这是 `lookup` 测试最有价值的一层。

当前已有正式契约：

- [`docs/user-intent-acceptance.md`](./user-intent-acceptance.md)
- [`test/specs/content/acceptance/lookup-contract.spec.ts`](../test/specs/content/acceptance/lookup-contract.spec.ts)

产品代码暴露的稳定语义包括：

- `data-testid="lookup-bowl"`
- `data-testid="lookup-panel"`
- `data-testid="lookup-dict-item"`
- `data-testid="lookup-dict-result"`
- `data-testid="lookup-dict-empty"`
- `data-testid="lookup-dict-error"`
- `data-testid="lookup-dict-loading"`

以及：

- `data-lookup-state`
- `data-lookup-request-state`
- `data-lookup-terminal`

### L5. 少量集中式实现耦合

主要集中在：

- [`test/acceptance/helpers.mjs`](../test/acceptance/helpers.mjs)
  - `readLookupUi`
  - `getDeepRect`
  - `clickDeep`

这层知道：

- host id
- shadow root
- 页面如何读取状态

但耦合被集中到了 helper，不是散落到每个 scenario 中。

---

## 3. 由 `lookup` 抽出的测试契约模板

任何 feature 如果想稳定进入 runner 层，理想上都应该具备下面几层：

### T1. 正式 BDD 载体

问题：

- 这个 feature 是否已经正式进入 `spec.json`？

### T2. Runner action

问题：

- runner 是否已经知道如何解释这个 feature 的 `step.action`？

### T3. 稳定产品测试契约

问题：

- 产品代码是否暴露了稳定的测试语义，而不是逼 runner 直接读内部实现？

典型形式包括：

- `data-testid`
- `data-*` 状态属性
- 稳定页面 URL
- 稳定配置入口名
- 稳定 runtime message contract

### T4. Fixture / controlled source

问题：

- 这个 feature 的外部依赖是否可控？

### T5. Helper / adapter

问题：

- 读取状态、打开窗口、切换页面、注入配置这些脏活是否已被收敛到 helper 层？

---

## 4. 当前 feature 契约层盘点

状态说明：

- `已有`
- `部分已有`
- `缺失`

---

### F1-F4 Lookup Kernel

对应：

- lookup 主闭环
- 面板内搜索/关闭
- notebook/history
- 长选区翻译

盘点：

- 正式 BDD 载体：`已有`
- runner action：`已有`
- 稳定产品测试契约：`已有`
- fixture / controlled source：`已有`
- helper / adapter：`已有`

结论：

- 这是当前最成熟的模板

---

### F5 Quick Search

盘点：

- 正式 BDD 载体：`已有`
- runner action：`缺失`
  - `openQuickSearch`
- 稳定产品测试契约：`部分已有`
  - 已有：
    - `quick-search.html`
    - 基于 lookup panel 的部分状态语义可复用
  - 缺：
    - “Quick Search 已打开/已复用”的稳定契约
    - Quick Search 页面 query / terminal state 的稳定读取契约
- fixture / controlled source：`部分已有`
  - lookup fixture 可复用
  - preload / auto-search 配置注入路径尚未固定
- helper / adapter：`缺失`
  - popup/page discovery helper
  - Quick Search page state reader

结论：

- 当前主要缺的是：
  - `runner action`
  - `Quick Search page contract`
  - `window discovery helper`

---

### F6 Trigger Entry Paths

盘点：

- 正式 BDD 载体：`已有`
- runner action：`缺失`
  - `triggerContextMenuAction`
  - `triggerCommand`
- 稳定产品测试契约：`部分已有`
  - context menu item ids、commands 已存在
  - 但“触发成功后的用户可见结果”没有统一入口契约
- fixture / controlled source：`部分已有`
  - lookup fixture 可复用
  - command / context menu 触发路径尚未受控
- helper / adapter：`缺失`
  - command trigger helper
  - context menu trigger helper

结论：

- 入口标识已有
- 触发执行契约和 helper 仍缺

---

### F7 Extension Pages

盘点：

- 正式 BDD 载体：`已有`
- runner action：`缺失`
  - `openExtensionPage`
  - `openOptionsEntry`
- 稳定产品测试契约：`部分已有`
  - extension page URL 稳定
  - options 页有 `data-option-content`
  - 但大多数页面只做到“可渲染”，缺更丰富的语义契约
- fixture / controlled source：`基本不需要`
- helper / adapter：`部分已有`
  - 页面打开能力已有基础
  - options entry 切换与状态读取 helper 缺失

结论：

- 这是相对容易承接的一类
- 主要缺的是 options entry 级别的 helper/contract

---

### F8 PDF

盘点：

- 正式 BDD 载体：`已有`
- runner action：`缺失`
  - `openPdf`
- 稳定产品测试契约：`部分已有`
  - viewer URL 语义已有
  - `file=` 参数语义已有
  - 但“自动 sniff redirect 成功”的用户级契约还没有专门的测试接口
- fixture / controlled source：`缺失`
  - 稳定 PDF fixture / local PDF source 还未建
- helper / adapter：`缺失`
  - PDF page opener
  - viewer reader
  - redirect observer

结论：

- 这是 runner 层较重的一类
- 缺 fixture 和 helper 最明显

---

### F9 Audio Playback

盘点：

- 正式 BDD 载体：`已有`
- runner action：`缺失`
  - `playAudio`
- 稳定产品测试契约：`缺失`
  - 目前更多是 runtime signal，不是用户级播放契约
- fixture / controlled source：`部分已有`
  - 现有 E2E 里已有 silent wav 路径
- helper / adapter：`缺失`
  - 音频播放可观察结果读取层缺失

结论：

- 这是典型“能力存在，但产品测试契约不足”的 feature

---

### F10 Clipboard

盘点：

- 正式 BDD 载体：`已有`
- runner action：`缺失`
  - `clipboardRoundtrip`
- 稳定产品测试契约：`部分已有`
  - 输入输出语义清晰
  - 权限不足时的用户级契约需要明确
- fixture / controlled source：`已有`
  - roundtrip 自身可控
- helper / adapter：`缺失`
  - clipboard setup / readback helper

结论：

- 比 audio 更容易承接
- 主要缺 runner action 和 helper

---

### F11 Profiles and Search Modes

盘点：

- 正式 BDD 载体：`已有`
- runner action：`缺失`
  - `openOptionsEntry`
  - `triggerCommand` 已在 spec 层定义，但 runner 层未承接
- 稳定产品测试契约：`部分已有`
  - options entry 名和 URL 较稳定
  - 真正的“profile 已切换”可观察契约不足
- fixture / controlled source：`基本不需要`
- helper / adapter：`缺失`
  - profile changed observer/helper

结论：

- options entry 场景容易
- command profile switching 的状态读取契约还不够

---

### F12 Provider System

盘点：

- 正式 BDD 载体：`已有`
- runner action：`缺失`
  - `openOptionsEntry`
- 稳定产品测试契约：`部分已有`
  - options entry 名稳定
  - 只做到“入口可渲染”，还没有 provider 配置层更深契约
- fixture / controlled source：`基本不需要`
- helper / adapter：`部分已有`

结论：

- 入口层相对容易承接
- 深层 provider 行为仍未进入 runner 关注范围

---

### F13 Page Translation

盘点：

- 正式 BDD 载体：`已有`
- runner action：`缺失`
  - `triggerCommand`
  - `triggerContextMenuAction`
- 稳定产品测试契约：`缺失`
  - 当前只有入口名，没有稳定“已成功进入某翻译入口”的产品契约
- fixture / controlled source：`缺失`
  - 外部站点/脚本依赖较强
- helper / adapter：`缺失`

结论：

- 这是当前契约层最薄弱的一类
- 形式上已 formalize，但执行层承接难度较高

---

### F14 Notebook Sync Services

盘点：

- 正式 BDD 载体：`已有`
- runner action：`缺失`
  - `openOptionsEntry`
- 稳定产品测试契约：`部分已有`
  - options 中存在 sync service controls
  - 但服务级状态契约还没有明确
- fixture / controlled source：`缺失`
  - 真正服务后端不适合直接进入当前 runner
- helper / adapter：`部分已有`

结论：

- 入口可渲染类场景可做
- 深层 sync 行为仍不适合当前 runner

---

### F15 Settings Surfaces

盘点：

- 正式 BDD 载体：`已有`
- runner action：`缺失`
  - `openOptionsEntry`
- 稳定产品测试契约：`部分已有`
  - options entry 名稳定
  - `data-option-content` 可作为入口级契约
- fixture / controlled source：`基本不需要`
- helper / adapter：`部分已有`

结论：

- 这类 feature 最接近“低风险扩展页可用性承接”

---

## 5. 当前总结

从 `lookup` 依赖模型出发，当前所有 formalized feature 的主要缺口并不在：

- `spec`

而在：

- `runner action`
- `稳定产品测试契约`
- `helper / adapter`
- 少数 feature 的 `fixture / controlled source`

其中：

### 缺口最小，适合先做

- `Quick Search`
- `Extension Pages`
- `Settings Surfaces`
- `Clipboard`

### 缺口中等

- `Trigger Entry Paths`
- `Profiles and Search Modes`
- `Provider System`

### 缺口最大

- `PDF`
- `Page Translation`
- `Audio Playback`
- `Notebook Sync Services`

---

## 6. 对下一步执行的建议

如果进入 runner 层，建议遵循：

1. 先承接 `Quick Search`
2. 再承接 `openOptionsEntry` 这一类扩展页动作
3. 再承接 `clipboardRoundtrip`
4. 然后再进入更重的：
   - `openPdf`
   - `triggerContextMenuAction`
   - `triggerCommand`
   - `playAudio`

也就是说：

> 先补“测试契约层缺口最小”的 feature，避免一上来就在最重的 feature 上把 runner 体系写死。

