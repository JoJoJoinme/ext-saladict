# Test Tech Story: PDF

> 日期：2026-04-12
> 目的：把 [`feature-pdf-baseline.md`](./feature-pdf-baseline.md) 里的 `BDD` 场景，承接为“测试实现层”的技术拆解，但暂时不写测试代码

---

## 1. 当前目标

把以下三条场景承接为可实现的测试设计：

- `PDF-BDD-1`
- `PDF-BDD-2`
- `PDF-BDD-3`

---

## 2. 推荐挂载层

全部建议先挂到：

- `Playwright E2E`

原因：

- 涉及导航、viewer 页面、runtime interception、窗口/标签页行为

---

## 3. 测试 tech story

### PDFTS-1 承接 PDF-BDD-1：打开当前 PDF 页面

目标：

- 验证用户从当前 PDF 页面触发 `open-pdf` 后，系统打开 Saladict PDF viewer

建议位置：

- `test/e2e/playwright-e2e.mjs`

关键断言：

- viewer 页面被打开
- viewer URL 中包含原始 PDF URL

### PDFTS-2 承接 PDF-BDD-2：打开 PDF 链接

目标：

- 验证用户触发 PDF 链接入口后，系统打开 Saladict PDF viewer

建议位置：

- `test/e2e/playwright-e2e.mjs`

关键断言：

- 打开的页面是扩展 viewer
- file 参数对应目标 PDF 链接

### PDFTS-3 承接 PDF-BDD-3：自动嗅探导向 Viewer

目标：

- 验证在 `pdfSniff` 开启时，命中 PDF 页面会自动导向 viewer

建议位置：

- `test/e2e/playwright-e2e.mjs`

关键断言：

- 原始 PDF 页面被导向 viewer
- 导向后的 file 参数正确

---

## 4. 公共 blocker

- 需要一个更明确的 PDF fixture / local PDF source
- 需要决定测试中如何稳定配置 `pdfSniff`
- 需要决定如何区分“手动打开”和“自动导向”两种路径

---

## 5. 当前结论

`PDF` 的测试 tech story 已经足够清晰，可以在不修改产品代码的前提下继续推进到 runner 承接层。

