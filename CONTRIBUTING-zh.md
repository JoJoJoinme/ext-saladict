# 沙拉查词贡献指南

## 建议先读

- [当前架构说明](./docs/architecture.md)
- [MV3 迁移状态](./MV3_MIGRATION.md)
- [用户意图验收测试](./docs/user-intent-acceptance.md)

## 环境准备

```bash
git clone git@github.com:crimx/ext-saladict.git
cd ext-saladict
npm install
cp .env.example .env
```

如果你不用带凭据的词典，`.env` 可以留空。

## 日常命令

```bash
npm run dev
npm run build
npm test
npm run test:acceptance
npm run test:e2e
npm run test:e2e:playwright
npm run test:required
```

## 强制门槛

凡是影响用户可见行为的改动，都必须：

1. 先明确它影响了哪条用户任务链路。
2. 如果 [`test/acceptance/spec.json`](./test/acceptance/spec.json) 还没覆盖，就补场景。
3. 如果 acceptance contract 有意变更，就同步更新测试和文档。
4. 运行 `npm run test:required`。

如果改动涉及共享基础设施、background、同步逻辑或词典引擎，还要额外运行：

```bash
npm test
```

## MV3 开发约束

- Background 现在是 service worker，不能再往里面新增 `window.*` 全局状态；统一走 [`src/background/state.ts`](./src/background/state.ts)。
- Background 里不能直接做 DOM 操作；需要通过 [`src/background/offscreen-helper.ts`](./src/background/offscreen-helper.ts) 转发。
- 新扩展页面统一放到 [`src/entrypoints/`](./src/entrypoints/) 下，结构使用 `name/index.html` 和 `name/main.tsx`。
- 权限或 manifest 变更统一改 [`wxt.config.ts`](./wxt.config.ts)，并补对应 E2E 覆盖。
- 不要单独删除 `lookup-panel`、`data-lookup-terminal` 这类 acceptance contract 属性；如果要改，测试和文档必须一起改。

## 新增词典

1. 在 [`src/components/dictionaries/`](./src/components/dictionaries/) 下新增词典目录。
2. 在 app config 和 locales 里注册。
3. 实现 `getSrcPage` 和 `search`。
4. 在 [`test/specs/components/dictionaries/`](./test/specs/components/dictionaries/) 下补 parser / engine 测试。
5. 如果改动了用户任务链路，同步补 acceptance 场景。

## Commit 规范

项目使用 conventional commits。需要交互式辅助时可运行 `npm run commit`。
