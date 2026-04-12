# Feature Baseline: Page Translation

> 日期：2026-04-12
> 目的：正式承接 `页面翻译入口族` 这一组用户可见能力的 `Feature -> User Story -> BDD`

---

## 1. Feature 定义

### Feature 名称

- `Page Translation`

### Feature 描述

系统支持通过命令或菜单触发第三方页面翻译入口。

---

## 2. User Story（第一版）

### PT-US1

作为扩展用户，我希望能通过命令触发 Google 页面翻译入口。

### PT-US2

作为扩展用户，我希望能通过菜单触发 Youdao 页面翻译入口。

---

## 3. BDD 场景 / 验收约束（第一版）

### PT-BDD-1 命令触发 Google 页面翻译

Given 扩展已安装并运行  
When 用户触发 `open-google` 命令  
Then 系统应进入 Google 页面翻译入口

### PT-BDD-2 菜单触发 Youdao 页面翻译

Given 扩展已安装并运行  
When 用户通过菜单触发 `youdao_page_translate`  
Then 系统应进入 Youdao 页面翻译入口

