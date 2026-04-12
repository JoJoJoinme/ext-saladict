# Feature Baseline: Trigger Entry Paths

> 日期：2026-04-12
> 目的：正式承接 `Context Menu / Shortcut / Clipboard` 这组用户触发入口能力的 `Feature -> User Story -> BDD`

---

## 1. Feature 定义

### Feature 名称

- `Trigger Entry Paths`

### Feature 描述

系统不仅支持页面内直接划词查词，还提供多种独立触发入口：

- context menu
- command / shortcut
- clipboard-driven search

这些入口不只是内部 plumbing，而是用户实际感知和使用的能力。

---

## 2. User Story（第一版）

### TE-US1

作为扩展用户，我希望能通过右键菜单触发查词入口，而不必总是依赖默认的页面内触发方式。

### TE-US2

作为扩展用户，我希望能通过快捷键/命令触发基于剪贴板的搜索。

---

## 3. BDD 场景 / 验收约束（第一版）

### TE-BDD-1 右键菜单触发查词

Given 页面中存在可选中的文本  
When 用户通过 context menu 触发查词入口  
Then 系统应进入查词流程  
And 在可见时间内得到明确终态

### TE-BDD-2 命令触发剪贴板搜索

Given 剪贴板中存在有效文本  
When 用户触发 `search-clipboard` 命令  
Then 系统应进入基于剪贴板的搜索流程  
And 用户能观察到对应查询文本被带入

---

## 4. 当前结论

`Trigger Entry Paths` 现在已足够进入正式 BDD 承接。

