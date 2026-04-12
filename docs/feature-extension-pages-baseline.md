# Feature Baseline: Extension Pages

> 日期：2026-04-12
> 目的：正式承接扩展页可用性这一组用户可见能力的 `Feature -> User Story -> BDD`

---

## 1. Feature 定义

### Feature 名称

- `Extension Pages`

### Feature 描述

扩展提供多个正式页面，不只是内容页中的查词面板。

这些页面包括：

- popup
- options
- history
- notebook
- word-editor
- audio-control

---

## 2. User Story（第一版）

### EP-US1

作为扩展用户，我希望可以打开 popup 页面并看到可用 UI。

### EP-US2

作为扩展用户，我希望可以打开 options 页面并看到可用 UI。

### EP-US3

作为扩展用户，我希望可以打开 history / notebook / word-editor / audio-control 等正式页面并看到可用 UI。

---

## 3. BDD 场景 / 验收约束（第一版）

### EP-BDD-1 Popup 页面可用

Given 扩展已安装并运行  
When 用户打开 popup 页面  
Then 页面应渲染成功  
And 用户可见主要 UI

### EP-BDD-2 Options 页面可用

Given 扩展已安装并运行  
When 用户打开 options 页面  
Then 页面应渲染成功  
And 用户可见主要 UI

### EP-BDD-3 History 页面可用

Given 扩展已安装并运行  
When 用户打开 history 页面  
Then 页面应渲染成功

### EP-BDD-4 Notebook 页面可用

Given 扩展已安装并运行  
When 用户打开 notebook 页面  
Then 页面应渲染成功

### EP-BDD-5 Word Editor 页面可用

Given 扩展已安装并运行  
When 用户打开 word-editor 页面  
Then 页面应渲染成功

### EP-BDD-6 Audio Control 页面可用

Given 扩展已安装并运行  
When 用户打开 audio-control 页面  
Then 页面应渲染成功

---

## 4. 当前结论

`Extension Pages` 现在已足够进入正式 BDD 承接。

