# Spec Proposal: PDF

> 日期：2026-04-12
> 目的：定义 `PDF` 应如何进入统一的 `spec.json` 载体，使其成为正式 BDD 基线的一部分

---

## 1. 核心原则

和 `Quick Search` 一样，`PDF` 的正式 BDD 也应进入：

- [`test/acceptance/spec.json`](../test/acceptance/spec.json)

不另起平行 BDD 体系。

---

## 2. 建议的最小 action 扩展

对 `PDF`，建议最小新增：

- `openPdf`

语义：

- 用户触发 PDF 相关入口

该 action 允许通过字段区分不同用户路径：

- 当前页面 PDF
- PDF 链接
- 自动 sniff

---

## 3. `openPdf` step 建议字段

- `action`
  - 固定为 `openPdf`
- `trigger`
  - `currentPage`
  - `link`
  - `sniff`
- `sourceUrl`
  - 原始 PDF URL
- `expectedPage`
  - 例如 `assets/pdf/web/viewer.html`
- `expectedFileUrl`
  - 期望 viewer 中携带的原始 PDF URL
- `runtime.config.pdfSniff`
  - 用于表达 sniff 场景

---

## 4. PDF 场景建议写法

### 4.1 打开当前 PDF 页面

```json
{
  "id": "pdf-open-current-page",
  "feature": "pdf",
  "runner": "e2e",
  "intent": "The user can open the current PDF page in Saladict PDF viewer",
  "steps": [
    {
      "action": "openPdf",
      "trigger": "currentPage",
      "sourceUrl": "http://127.0.0.1/pdf/sample.pdf",
      "expectedPage": "assets/pdf/web/viewer.html",
      "expectedFileUrl": "http://127.0.0.1/pdf/sample.pdf"
    }
  ]
}
```

### 4.2 打开 PDF 链接

```json
{
  "id": "pdf-open-link",
  "feature": "pdf",
  "runner": "e2e",
  "intent": "The user can open a PDF link in Saladict PDF viewer",
  "steps": [
    {
      "action": "openPdf",
      "trigger": "link",
      "sourceUrl": "http://127.0.0.1/pdf/sample.pdf",
      "expectedPage": "assets/pdf/web/viewer.html",
      "expectedFileUrl": "http://127.0.0.1/pdf/sample.pdf"
    }
  ]
}
```

### 4.3 自动嗅探导向 Viewer

```json
{
  "id": "pdf-sniff-redirect",
  "feature": "pdf",
  "runner": "e2e",
  "runtime": {
    "config": {
      "pdfSniff": true
    }
  },
  "intent": "When PDF sniff is enabled, opening a PDF page redirects to Saladict PDF viewer",
  "steps": [
    {
      "action": "openPdf",
      "trigger": "sniff",
      "sourceUrl": "http://127.0.0.1/pdf/sample.pdf",
      "expectedPage": "assets/pdf/web/viewer.html",
      "expectedFileUrl": "http://127.0.0.1/pdf/sample.pdf"
    }
  ]
}
```

---

## 5. 当前结论

`PDF` 适合像 `Quick Search` 一样进入统一 `spec.json`，只需要最小扩展一个新 action：

- `openPdf`

