# MV2 Capability Inventory

> 日期：2026-04-12
> 目的：列出当前仓库在 MV2 实现阶段明确具备的一级能力块，作为后续定义 MV3 迁移基线的重要参考输入

---

## 1. 这份文档解决什么问题

迁移任务不能只从当前迁移实现反推需求，否则容易漏功能。

因此，在定义 MV3 迁移基线时，除了现有 acceptance / E2E / 文档之外，还必须显式参考：

> MV2 时系统到底具备哪些一级能力。

这份文档不试图穷举每一个边角行为。

它的范围是：

- 识别 MV2 中明确存在的一级产品能力块
- 说明这些能力块的主要用户入口
- 给出本仓库中的主要证据来源

它不是：

- 完整的 feature spec
- 完整的 user story 清单
- 完整的 BDD 场景集

它的角色是：

> `MV2 实现基线输入`

供后续 `Epic --(探索定义迁移基线)--> Feature --> User Story --(定义BDD场景/验收约束)--> Tech Story`

这条链路使用。

---

## 2. 主要证据来源

这份能力清单主要来自以下 MV2 实现输入：

- MV2 README
  - [`README.md`](../README.md)
  - [`README-zh.md`](../README-zh.md)
- MV2 manifest
  - `src/manifest/common.manifest.js`
  - `src/manifest/chrome.manifest.json`
- MV2 background command / menu / server 逻辑
  - `src/background/initialization.ts`
  - `src/background/context-menus.ts`
  - `src/background/server.ts`
- MV2 options 可配置入口
  - `src/options/components/Entries/*`
- MV2 sync services
  - `src/background/sync-manager/services/*`

说明：

- 本文档当前使用的是 `HEAD` 对应的旧实现，也即迁移前的 MV2 基线代码。
- 这里列出的能力是“明确可识别的一级能力块”，不是所有历史偶然实现。

---

## 3. MV2 一级能力清单

### C1. 网页划词查词主闭环

能力说明：

- 用户在普通网页中选中内容后，可以触发查词入口并看到词典/翻译面板。

典型入口：

- 页面选词
- bowl / panel UI
- content script

主要证据来源：

- README 中对“网页划词翻译”的整体定位
- `src/background/initialization.ts`
- `src/background/server.ts`
- 现有 acceptance kernel 也证明该能力是产品主轴

迁移意义：

- 这是 MV3 迁移必须保护的核心能力

### C2. 面板内继续搜索与状态切换

能力说明：

- 用户在已打开的查词面板内可以继续搜索新内容
- 面板可以在不同查询终态间切换

典型入口：

- 面板内搜索框
- history switch

主要证据来源：

- `src/background/initialization.ts`
- `src/background/server.ts`
- 现有 acceptance kernel 已覆盖这部分行为

迁移意义：

- 属于主闭环的直接延伸能力

### C3. Quick Search 独立窗口

能力说明：

- 系统提供独立的 quick search / standalone quick search 窗口
- 可被命令、菜单、剪贴板、页面选词等入口唤起

典型入口：

- manifest command: `open-quick-search`
- background: `OPEN_QS_PANEL` / `QUERY_QS_PANEL`
- options: `QuickSearch`

主要证据来源：

- `src/manifest/common.manifest.js`
- `src/background/initialization.ts`
- `src/background/server.ts`
- `src/options/components/Entries/QuickSearch/index.tsx`
- `web_accessible_resources` 中存在 `quick-search.html`

迁移意义：

- 这是明确存在的一级能力块，不能只靠当前 MV3 页面存在性 evidence 代替

### C4. Popup / Options / History / Notebook / Word Editor / Audio Control 页面

能力说明：

- 扩展提供多个独立页面，不只是一个查词面板

主要页面包括：

- popup
- options
- history
- notebook
- word editor
- audio control

主要证据来源：

- `web_accessible_resources`
- 旧实现中的页面入口
- options 主页面与对应 entry 组件

迁移意义：

- 迁移不能只保护 content-side 主闭环，还需要保护这些正式页面能力

### C5. Notebook 与 Search History

能力说明：

- 用户可保存单词到 notebook
- 系统可记录 search history
- 历史行为可前进/后退切换

典型入口：

- command: `add-notebook`
- notebook page
- history page
- options notebook settings

主要证据来源：

- `src/background/initialization.ts`
- `src/background/server.ts`
- `src/options/components/Entries/Notebook/index.tsx`

迁移意义：

- 这是典型“产品数据能力”，不能只看 UI 是否存在

### C6. Profile 切换与搜索模式配置

能力说明：

- 系统支持多个 profile
- 支持 profile 之间切换
- 支持不同 search mode / pin mode / panel mode / qs panel mode

典型入口：

- commands:
  - `next-profile`
  - `prev-profile`
  - `profile-1` ... `profile-5`
- options:
  - `Profiles`
  - `SearchModes`

主要证据来源：

- `src/manifest/common.manifest.js`
- `src/background/initialization.ts`
- `src/options/components/Entries/Profiles/*`
- `src/options/components/Entries/SearchModes/index.tsx`

迁移意义：

- profile / routing 行为是当前产品对齐问题的重要来源

### C7. Dictionary / Translator Provider 体系

能力说明：

- 系统支持多词典 / 多翻译引擎
- 用户可在 options 中配置词典与相关行为
- context menus 中也暴露了多个 provider 入口

主要证据来源：

- `package.json` 中多 provider 依赖
- `src/app-config/context-menus.ts`
- `src/options/components/Entries/Dictionaries/*`
- `src/background/server.ts`

迁移意义：

- MV3 迁移不仅是 UI/页面迁移，也要保护 provider 调用与路由能力

### C8. 页面翻译与第三方页面翻译入口

能力说明：

- 系统支持页面翻译入口
- 包括 Google / Youdao / Caiyun / Baidu / Sogou / Microsoft 等

典型入口：

- commands:
  - `open-google`
  - `open-youdao`
  - `open-caiyun`
- context menus:
  - `google_page_translate`
  - `youdao_page_translate`
  - `caiyuntrs`
  - `baidu_page_translate`
  - `sogou_page_translate`
  - `microsoft_page_translate`

主要证据来源：

- `src/manifest/common.manifest.js`
- `src/background/initialization.ts`
- `src/background/context-menus.ts`
- `src/app-config/context-menus.ts`

迁移意义：

- 这是独立于查词主闭环之外的一级能力块

### C9. Context Menu 入口与自定义菜单

能力说明：

- 系统支持右键菜单入口
- 支持自定义菜单项与自定义 URL 跳转

典型入口：

- `src/background/context-menus.ts`
- `src/app-config/context-menus.ts`
- options:
  - `ContextMenus`

主要证据来源：

- `contextMenus` permission
- `src/background/context-menus.ts`
- `src/options/components/Entries/ContextMenus/*`

迁移意义：

- 这是用户触发入口层的重要组成部分

### C10. PDF 打开与 PDF Viewer 链路

能力说明：

- 系统支持把 PDF 内容导向扩展 viewer
- 支持 view-as-pdf / copy-pdf-url 等入口

典型入口：

- command: `open-pdf`
- context menu:
  - `view_as_pdf`
  - `copy_pdf_url`
- background:
  - `pdf-sniffer`

主要证据来源：

- `src/manifest/common.manifest.js`
- `src/background/initialization.ts`
- `src/background/context-menus.ts`
- `src/background/pdf-sniffer.ts`
- options:
  - `PDF`

迁移意义：

- 这是 MV2 中明确存在的一级能力块
- 不能只把它当成 runtime plumbing

### C11. Clipboard 搜索与剪贴板能力

能力说明：

- 系统支持读取/写入剪贴板相关能力
- 可从剪贴板内容发起搜索

典型入口：

- command: `search-clipboard`
- background:
  - `GET_CLIPBOARD`
  - `SET_CLIPBOARD`
  - `searchClipboard`
- optional permissions:
  - `clipboardRead`
  - `clipboardWrite`

主要证据来源：

- `src/manifest/common.manifest.js`
- `src/background/initialization.ts`
- `src/background/server.ts`
- options:
  - `Permissions`

迁移意义：

- 这是显式的用户能力，不只是内部 helper

### C12. 音频播放与发音控制

能力说明：

- 系统支持词条音频播放
- 还存在独立的音频控制页 / waveform 相关能力

典型入口：

- `PLAY_AUDIO` / `STOP_AUDIO`
- `audio-control.html`
- options:
  - `Pronunciation`

主要证据来源：

- `web_accessible_resources` 中包含 `audio-control.html`
- `src/background/server.ts`
- `src/options/components/Entries/Pronunciation.tsx`

迁移意义：

- 这是完整的用户可感知链路，不只是技术能力

### C13. 快捷键命令体系

能力说明：

- 系统对多类能力暴露了快捷键命令

主要命令包括：

- 功能开关：
  - `toggle-active`
  - `toggle-instant`
- 查询入口：
  - `search-clipboard`
  - `open-quick-search`
  - `open-pdf`
- 页面翻译：
  - `open-google`
  - `open-youdao`
  - `open-caiyun`
- 历史与 profile：
  - `next-history`
  - `prev-history`
  - `next-profile`
  - `prev-profile`
  - `profile-1` ... `profile-5`
- 数据操作：
  - `add-notebook`

主要证据来源：

- `src/manifest/common.manifest.js`
- `src/background/initialization.ts`

迁移意义：

- 说明 MV2 的用户入口不仅是 UI，也包含 command system

### C14. Notebook 同步服务

能力说明：

- Notebook 数据可通过多种 sync service 同步

当前可识别服务：

- Eudic
- AnkiConnect
- Shanbay
- WebDAV

主要证据来源：

- `src/background/sync-manager/index.ts`
- `src/background/sync-manager/services/*`
- `src/options/components/Entries/Notebook/index.tsx`

迁移意义：

- 这是用户数据层的正式能力，不应在迁移中被默默降级或遗忘

### C15. 权限、黑白名单、导入导出、隐私与通用设置

能力说明：

- options 中存在一整组产品级配置能力，而不只是词典配置

当前可识别的配置面包括：

- General
- Privacy
- Permissions
- BlackWhiteList
- ImportExport
- SearchModes
- QuickSearch
- DictPanel
- Dictionaries
- DictAuths
- PDF
- Notebook
- Profiles
- Popup

主要证据来源：

- `src/options/components/MainEntry.tsx`
- `src/options/components/Entries/*`

迁移意义：

- 表明 MV2 是“高度可配置的产品”，迁移时要避免只保护运行时、忽略配置面

---

## 4. 当前对 MV3 迁移的意义

这份 `MV2 capability inventory` 的作用不是直接变成最终规格，而是提供一个检查清单。

它回答：

- 当前 MV2 明确具有哪些一级能力块
- 当前仓库的 acceptance kernel 只覆盖了其中哪些
- 剩余哪些一级能力块还没有被正式提炼成 `Feature -> User Story -> BDD`

因此，后续定义 MV3 迁移基线时，应同时参考两类输入：

1. `显式产品基线`
   - 当前 acceptance / docs / 已冻结 story
2. `MV2 实现基线`
   - 本文档中的 MV2 一级能力清单

## 4.1 当前 formalization 复盘

截至 2026-04-12，当前 15 类 MV2 一级能力块可以先粗分为三类：

### `formalized`

- `C1` 网页划词查词主闭环
- `C2` 面板内继续搜索与状态切换
- `C3` Quick Search 独立窗口
- `C4` 扩展页可用性
- `C5` Notebook 与 Search History
- `C6` Profile 切换与搜索模式配置
- `C7` Dictionary / Translator Provider 体系
- `C8` 页面翻译与第三方页面翻译入口
- `C9` Context Menu 入口与自定义菜单
- `C10` PDF 打开与 PDF Viewer 链路
- `C11` Clipboard 搜索与剪贴板能力
- `C12` 音频播放与发音控制
- `C13` 快捷键命令体系
- `C14` Notebook 同步服务
- `C15` 权限、黑白名单、导入导出、隐私与通用设置

这里的 `formalized` 指的是：

- 已经被提炼成 `Feature / User Story / BDD`
- 并且正式进入统一的 `test/acceptance/spec.json`

说明：

- 这份分类是“当前状态”，不是最终结论
- 它回答的是：`feature 到底齐没齐`
- 当前 15 类 MV2 一级能力，已全部进入正式的 `Feature -> User Story -> BDD` 承接

---

## 5. 当前建议

不要试图一次把这 15 个能力块全部补成完整 BDD。

更现实的做法是：

1. 先承认当前 acceptance kernel 已经覆盖了最核心 lookup 主闭环
2. 再从 `MV2 capability inventory` 中挑出一级且重要、但当前缺 BDD 的能力块
3. 逐个能力块补：
   - `Feature`
   - `User Story`
   - `BDD Scenario`

当前最合适的优先候选仍然是：

- `Quick Search`
- `PDF`

---

## 6. 一句话结论

定义 MV3 迁移基线时，不能只看当前迁移实现和现有 acceptance。

还必须参考：

> MV2 明确具备的一级能力块。

这份文档提供的就是这层输入。
