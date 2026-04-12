# 用户意图验收测试

## 目标

这套测试不把“页面挂载了 React root”或“某个词典组件 class 存在”当作成功，而是把下面这条用户任务当作成功：

> 用户在普通网页里精确划词后，点击查词入口，必须在可见时间内得到一个明确终态。

终态只能是：

- `success`：出现非空查词结果
- `empty`：明确显示“未找到结果”
- `error`：明确显示“查询失败”等错误提示

不允许出现下面这种假绿：

- 只有面板壳子，没有可读内容
- 请求结束了，但面板仍然是空白
- 测试断言绑死某个 provider 的内部 DOM

## 稳定契约

产品代码通过以下稳定语义对测试暴露状态：

- `data-testid="lookup-bowl"`
- `data-testid="lookup-panel"`
- `data-testid="lookup-dict-item"`
- `data-testid="lookup-dict-result"`
- `data-testid="lookup-dict-empty"`
- `data-testid="lookup-dict-error"`
- `data-testid="lookup-dict-loading"`

以及这些状态属性：

- `data-lookup-state`
- `data-lookup-request-state`
- `data-lookup-terminal`

这些属性是测试契约的一部分。可以重构样式、组件层级和实现方式，但不能无声删除这些契约；如果要改，必须同时更新 acceptance 测试和本文档。

## 场景清单

用户意图场景登记在：

- [`test/acceptance/spec.json`](../test/acceptance/spec.json)

当前 spec 覆盖的核心用户任务包括：

1. 已知词条能查到明确结果
2. 查不到结果时显示 empty state
3. provider 失败时显示 error state
4. 连续重新划词时，新的终态必须替换旧终态
5. 用户在面板搜索框里改查另一个词时，必须得到新的明确终态
6. 用户关闭面板后，还能继续下一次查词
7. 用户可以把当前词条加入 notebook，且 UI 与存储都能观察到保存成功
8. 用户在多次查词后可以前进/后退浏览查词历史，并得到对应结果
9. 用户选择长句时，会落到机器翻译而不是一排 empty
10. 用户选择跨词边界的长句碎片时，仍然会得到明确翻译终态

## Spec 结构

`test/acceptance/spec.json` 里的每个场景由一组 `steps` 组成。当前支持：

- `lookup`
- `search`
- `addToNotebook`
- `historyBack`
- `historyForward`
- `closePanel`

这让 acceptance test 可以表达真正的用户任务链路，而不是只验证“一次请求结束了”。

场景也可以声明 `runtime` 覆盖，例如：

- 某条验收只选中 `google`
- 某条验收需要不同的 acceptance 配置

## 运行方式

```bash
npm run test:acceptance
```

强制门槛：

```bash
npm run test:required
```

它会执行：

1. `npm test -- --runInBand test/specs/content/acceptance/lookup-contract.spec.ts`
2. `npm run test:acceptance`
3. `npm run test:e2e:playwright`

补充说明：

- `npm run test:acceptance` 会先 `build`，保证测的是最新扩展产物。
- `npm run test:required` 是用户可见改动的最低门槛。
- 如果改动触及共享基础设施、background、词典 parser、同步逻辑，还应额外运行 `npm test`。

## 后续开发要求

所有用户可见功能改动都必须先回答两个问题：

1. 它改变了哪个用户任务？
2. 这个用户任务在 `test/acceptance/spec.json` 里是否已有场景覆盖？

如果没有，就必须补一个 acceptance 场景，并让它通过。

### 典型需要补 acceptance 的改动

- 新的查词触发方式
- 新的面板终态
- 新的 provider 失败处理
- 新的用户操作链路
- 任何会影响“划词 -> 出结果”闭环的改动

### 通常不需要新 acceptance 的改动

- 纯内部重构，且不改变用户行为
- 不影响用户任务的文案微调
- 已有 acceptance 场景完全覆盖的实现替换

## 设计原则

- 真实浏览器、真实扩展、真实用户动作
- 测试页和 provider 响应使用可控 fixture，避免外部世界导致假红
- 断言基于产品语义，不基于实现细节
- 空白终态一律视为失败
