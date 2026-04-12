# Feature Baseline: Profiles and Search Modes

> 日期：2026-04-12
> 目的：正式承接 `Profile 切换与搜索模式配置` 这一组用户可见能力的 `Feature -> User Story -> BDD`

---

## 1. Feature 定义

### Feature 名称

- `Profiles and Search Modes`

### Feature 描述

系统允许用户维护多个 profile，并通过命令或配置切换不同搜索模式与行为路由。

---

## 2. User Story（第一版）

### PS-US1

作为扩展用户，我希望能通过命令切换当前激活的 profile。

### PS-US2

作为扩展用户，我希望能在 options 中访问 Profiles 配置入口。

### PS-US3

作为扩展用户，我希望能在 options 中访问 Search Modes 配置入口。

---

## 3. BDD 场景 / 验收约束（第一版）

### PS-BDD-1 命令切换 profile

Given 扩展已安装并运行  
When 用户触发 `next-profile` 命令  
Then 系统应切换当前 profile

### PS-BDD-2 打开 Profiles 配置入口

Given 扩展已安装并运行  
When 用户打开 options 中的 `Profiles` 入口  
Then 系统应渲染对应配置界面

### PS-BDD-3 打开 Search Modes 配置入口

Given 扩展已安装并运行  
When 用户打开 options 中的 `SearchModes` 入口  
Then 系统应渲染对应配置界面

