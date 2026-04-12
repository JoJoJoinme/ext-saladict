# Feature Baseline: PDF

> 日期：2026-04-12
> 目的：把 `PDF` 从“MV2 明确具备、MV3 当前有 evidence 但缺 BDD”的能力块，正式提升为可承接的 `Feature -> User Story -> BDD` 基线

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

- `PDF`

### Feature 描述

系统提供 PDF 相关入口与 Viewer 链路，使用户可以把当前 PDF 页面或 PDF 链接导向扩展内的 PDF 阅读体验，而不是把 PDF 能力完全交给浏览器默认处理。

### 为什么它属于一级能力块

`PDF` 在 MV2 中具备以下一级特征：

- 有独立命令入口：`open-pdf`
- 有显式 context menu 入口：
  - `view_as_pdf`
  - `copy_pdf_url`
- 有独立的 PDF sniffer / redirect 链路
- 有专门的 options 配置面：
  - `pdfSniff`
  - `pdfStandalone`
  - 黑白名单

因此，它不应被降格为 runtime plumbing；它本质上是用户可见能力。

---

## 3. 主要证据来源

### 3.1 MV2 实现基线来源

- [`mv2-capability-inventory.md`](./mv2-capability-inventory.md)
- MV2:
  - `src/manifest/common.manifest.js`
  - `src/background/initialization.ts`
  - `src/background/context-menus.ts`
  - `src/background/pdf-sniffer.ts`
  - `src/options/components/Entries/PDF.tsx`

### 3.2 当前 MV3 evidence 来源

- [`migration-baseline-discovery.md`](./migration-baseline-discovery.md)
- `test/e2e/playwright-e2e.mjs`
  - `PDF interception`
  - `tabs.update available`
  - `DNR API available`
- `test/specs/background/pdf-sniffer.spec.ts`

### 3.3 当前结论

当前已经能证明：

- PDF interception 相关 runtime path 在 MV3 中存在
- `openPDF` / `pdfSniffer` / viewer 路由逻辑仍然存在

当前还不能正式证明：

- 用户级 PDF 主流程已经被完整承接

所以它当前是：

- `有 evidence，缺正式 BDD`

---

## 4. User Story（第一版）

以下 `User Story` 是基于 MV2 实现和当前产品基线提炼出的第一版。

### PDF-US1

作为扩展用户，当我处于一个 PDF 页面并触发 `open-pdf` 时，我希望扩展用 Saladict PDF viewer 打开当前 PDF，而不是停留在默认页面。

### PDF-US2

作为扩展用户，当我点击或选择一个 PDF 链接并触发 “在 PDF 阅读器中打开” 时，我希望该 PDF 链接被导向 Saladict PDF viewer。

### PDF-US3

作为扩展用户，当 `pdfSniff` 开启时，我希望命中的 PDF 页面能够自动导向 Saladict PDF viewer。

### PDF-US4

作为扩展用户，当 `pdfStandalone` 设为独立窗口模式时，我希望 PDF viewer 以独立窗口打开，而不是复用当前标签页。

### PDF-US5

作为扩展用户，当我已在 Saladict PDF viewer 中并再次触发当前 PDF 打开时，我希望系统正确处理，不出现重复失控行为。

### PDF-US6

作为扩展用户，当我在 PDF viewer 页面上使用 “复制 PDF URL” 相关入口时，我希望能得到原始 PDF 链接而不是 viewer URL。

---

## 5. 当前建议纳入第一轮的 User Story

### 第一轮建议纳入

- `PDF-US1`
- `PDF-US2`
- `PDF-US3`

原因：

- 这些构成了 PDF 功能的最小主闭环
- 它们最接近“用户真正感知 PDF 是否可用”
- 当前已有较强 runtime evidence，可先补最小 BDD

### 第二轮再考虑

- `PDF-US4`
- `PDF-US5`
- `PDF-US6`

原因：

- 仍然重要，但更偏配置模式、窗口形态或辅助操作
- 不是第一轮最小闭环必须项

---

## 6. BDD 场景 / 验收约束（第一版）

### PDF-BDD-1 打开当前 PDF 页面

Given 用户当前处于一个 PDF 页面  
When 用户触发 `open-pdf` 能力  
Then 扩展应打开 Saladict PDF viewer  
And viewer 应携带当前 PDF 原始 URL

承接：

- `PDF-US1`

当前 evidence：

- `openPDF()` 逻辑存在
- PDF interception smoke signal 存在

当前缺口：

- 还没有从用户动作角度正式冻结该路径

### PDF-BDD-2 打开 PDF 链接

Given 页面存在一个 PDF 链接  
When 用户触发“在 PDF 阅读器中打开”  
Then 扩展应打开 Saladict PDF viewer  
And viewer 应携带该链接对应的原始 PDF URL

承接：

- `PDF-US2`

当前 evidence：

- `view_as_pdf` context menu path 存在

当前缺口：

- 还没有正式场景冻结 link-based PDF entry

### PDF-BDD-3 自动嗅探导向 Viewer

Given `pdfSniff` 已开启  
When 用户打开命中的 PDF 页面  
Then 扩展应把该页面导向 Saladict PDF viewer

承接：

- `PDF-US3`

当前 evidence：

- `pdfSniffer` 逻辑与相关测试存在

当前缺口：

- 还没有正式从用户路径角度冻结自动导向行为

---

## 7. 当前验收层建议

对 `PDF`，当前更建议先挂到：

- `Playwright E2E`

原因：

- 该 feature 本质上跨越：
  - background
  - webRequest / DNR / tabs.update
  - viewer page
  - 浏览器页面导航
- 当前 acceptance harness 更偏向内容页 lookup 主闭环
- PDF 的主语义包含导航与 viewer 切换，更接近 E2E 责任边界

---

## 8. 当前 Feature 的最小正式基线

如果只冻结最小可执行基线，建议当前把 `PDF` 的正式承接边界定义为：

### 必须成立

- 可以打开当前 PDF 页面
- 可以打开 PDF 链接
- `pdfSniff` 开启时可自动导向 viewer

### 可以暂缓

- standalone 窗口模式细节
- 已在 viewer 中再次打开的重入处理
- copy PDF URL 辅助能力

---

## 9. 当前结论

`PDF` 不应继续停留在“runtime interception 存在”的 evidence 层。

它已经具备足够条件进入：

- `Feature`
- `User Story`
- `BDD 场景 / 验收约束`

的正式基线承接。

因此，`PDF` 适合作为：

> 当前仓库第二个完整走通 `Feature -> User Story -> BDD` 的 `P1` 迁移切片。

