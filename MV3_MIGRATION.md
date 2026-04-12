# Saladict MV2 -> MV3 迁移状态

> 最后核对日期：2026-04-11
> 配套文档：[`docs/mv3-e2e-debug-retrospective.md`](./docs/mv3-e2e-debug-retrospective.md)、[`docs/user-intent-acceptance.md`](./docs/user-intent-acceptance.md)

## 结论

当前仓库的 Chrome/Edge 运行时迁移已经完成，主功能链路可以在 MV3 下正常工作。

这句话的边界也要说清楚：

- 已完成的是 Chrome/Edge 的 MV3 迁移。
- Firefox/Safari 不再是这个分支的目标。
- 绝大多数核心功能已经迁移并有自动化验证。
- 仍有少量实现层技术债，但核心运行时链路已经不再依赖 MV2 时代的关键兼容假设。

## 这次迁移到底改了什么

### 1. 构建系统从 Neutrino/Webpack 切到 WXT/Vite

迁移前：

- manifest 分散在 `src/manifest/*`
- Webpack/Neutrino 负责入口和打包

迁移后：

- 统一由 [`wxt.config.ts`](./wxt.config.ts) 生成 MV3 manifest
- 页面和脚本入口统一收口到 [`src/entrypoints/`](./src/entrypoints/)
- 构建产物输出到 `dist/chrome-mv3/`

这一步的意义是：manifest、权限、入口、打包行为不再是多套拼装逻辑，而是单一事实来源。

### 2. Background 从“持久页面”改成 Service Worker 心智

MV2 的 background page 可以长期持有 `window.*` 状态；MV3 的 service worker 不能。

所以迁移时把这类全局状态统一抽到：

- [`src/background/state.ts`](./src/background/state.ts)

现在 background 侧的配置、profile、屏幕信息等都要通过异步 getter/setter 访问，而不是直接读写 `window.appConfig` 之类的全局变量。

### 3. Background 中的 DOM 能力被搬到独立 runner

MV3 service worker 不能直接做这些事：

- `new Audio()`
- `document.execCommand('copy')`
- 临时创建 DOM 节点完成剪贴板或页面解析

所以迁移时把这类逻辑转移到：

- [`src/entrypoints/offscreen/main.ts`](./src/entrypoints/offscreen/main.ts)
- [`src/background/offscreen-helper.ts`](./src/background/offscreen-helper.ts)

当前实现的重要边界是：

- 只使用真正的 `chrome.offscreen` document
- offscreen 和 background 之间只走 `chrome.runtime` 消息
- 配置、profile、cookie、DNR 这类扩展侧能力都留在 background
- offscreen 只负责 DOM / Audio / Clipboard / HTML 解析

这条边界比之前的兼容层更纯，也更符合 Chrome 官方的 MV3 offscreen 设计。

### 4. 旧 API 被成体系替换

重点替换包括：

- `browser.browserAction.*` -> `browser.action.*`
- `tabs.executeScript/insertCSS` -> `chrome.scripting.*`
- `window.screen` -> `chrome.system.display.getInfo()`
- `XMLHttpRequest` -> `fetch()`
- 长生命周期 background 假设 -> service worker 幂等初始化

对应关键文件包括：

- [`src/background/context-menus.ts`](./src/background/context-menus.ts)
- [`src/_helpers/injectSaladictInternal.ts`](./src/_helpers/injectSaladictInternal.ts)
- [`src/background/windows-manager.ts`](./src/background/windows-manager.ts)
- [`src/background/server.ts`](./src/background/server.ts)
- [`src/background/initialization.ts`](./src/background/initialization.ts)

### 5. 用户验收方式从“实现存在”升级到“任务闭环存在”

这次迁移真正补强的不是“又多跑了几个脚本”，而是测试标准本身变了。

现在仓库里有三层验证：

- `npm test`
  看护 parser、background helper、状态机、同步等实现层
- `npm run test:acceptance`
  看护用户意图链路
- `npm run test:e2e:playwright` / `npm run test:e2e`
  看护真实扩展加载、页面、SW、权限、面板、PDF、菜单等运行时行为

## 架构变化摘要

### 入口层

- `src/entrypoints/background.ts`：MV3 service worker 入口
- `src/entrypoints/content.ts`：内容脚本入口
- `src/entrypoints/selection.content.ts`：selection 内容脚本入口
- `src/entrypoints/*/index.html + main.tsx`：popup/options/notebook/history/quick-search/word-editor/audio-control 页面入口

### 状态层

- background 共享状态收口到 [`src/background/state.ts`](./src/background/state.ts)
- service worker 重启后从 storage 懒加载恢复

### DOM 能力转发层

- [`src/background/offscreen-helper.ts`](./src/background/offscreen-helper.ts)
- [`src/entrypoints/offscreen/main.ts`](./src/entrypoints/offscreen/main.ts)

### Manifest 与权限层

- 单点定义在 [`wxt.config.ts`](./wxt.config.ts)
- 当前关键权限包括 `scripting`、`webRequest`、`offscreen`、`system.display`

## 功能迁移覆盖情况

### 已迁移并已验证的核心功能

以下功能已经在 MV3 路径上工作，并且至少有一层自动化验证：

| 功能 | 状态 | 验证方式 | 备注 |
|------|------|----------|------|
| 划词打开查词面板 | 已迁移 | acceptance + Playwright E2E | 核心闭环 |
| 面板内再次搜索 | 已迁移 | acceptance | 多步用户任务 |
| 查词历史前进/后退 | 已迁移 | acceptance | 多步用户任务 |
| notebook 保存 | 已迁移 | acceptance | UI + storage 双验证 |
| popup/options/history/notebook/quick-search/word-editor 页面 | 已迁移 | Playwright + Puppeteer E2E | 页面渲染和基础行为 |
| context menus / badge | 已迁移 | Jest + Playwright E2E | 已修复旧测试 |
| 音频播放链路 | 已迁移 | Jest + Playwright E2E | 经 offscreen runner |
| 剪贴板链路 | 已迁移 | Jest | 权限受限场景在 E2E 中优雅跳过 |
| PDF 打开与拦截链路 | 已迁移 | Playwright + Puppeteer E2E | 走 MV3 可行实现 |
| service worker 生命周期 | 已迁移 | Playwright E2E | storage/alarms/listeners |
| WebDAV 同步服务 | 已迁移 | Jest | 当前是单测覆盖，不是用户意图验收 |

### 不能说成“全部完美迁移”的地方

#### 1. Firefox/Safari 没有继续迁移

当前仓库目标已经收敛到 Chrome/Edge MV3。也就是说：

- 不是“同一套代码同时完整支持 MV2/MV3”
- 不是“还维持 Firefox/Safari 的产物”
- 不是“跨浏览器迁移完成”

这个边界必须写清楚。

#### 2. ZDIC 音频 Referer 改写已切到可用的 MV3 路径

`ZDIC` 音频请求需要合法 `Referer`，现在这条链路已经改成：

- manifest 声明 `declarativeNetRequestWithHostAccess`
- 运行时通过 `updateSessionRules()` 注册 `modifyHeaders` 规则
- 规则注册使用固定 rule id + `removeRuleIds`，保证重复初始化时仍然幂等

对应代码：

- [`wxt.config.ts`](./wxt.config.ts)
- [`src/components/dictionaries/zdic/engine.ts`](./src/components/dictionaries/zdic/engine.ts)

因此 `ZDIC` 之前那种“代码里想改 Referer，但 manifest 没开权限，最后退回无效 fallback”的状态已经被修掉。

#### 3. Offscreen 方案已经收回到官方 MV3 形态

当前 helper 的运行方式是：

- background 用 `chrome.offscreen.createDocument()` 保证 hidden offscreen 存在
- background 先准备扩展侧上下文，例如 config/profile、cookie、DNR
- offscreen 只接收纯执行 payload，并返回结果

也就是说：

- 不再有用户可见的 `offscreen.html` window fallback
- 不再依赖 `clients.matchAll()` + `postMessage()`
- 不再让 hidden offscreen 直接访问 `storage`、`cookies`、`declarativeNetRequest`

## 测试盘点

截至 2026-04-11，本仓库本地核对结果如下：

- `npm test`
  - `40` suites passed
  - `213` tests passed
  - `1` todo
- `npm run test:acceptance`
  - `8` passed
  - `0` failed
- `npm run test:e2e:playwright`
  - `30` passed
  - `0` failed
- `npm run test:e2e`
  - `18` passed
  - `0` failed
- `npm run test:required`
  - passed

### 这次顺手修掉的坏测试

这轮没有删除测试来“换绿”，而是把已经跟 MV3 架构脱节的测试修到和现状一致。重点修复了：

- `background/audio-manager.spec.ts`
- `background/clipboard-manager.spec.ts`
- `background/offscreen-helper.spec.ts`
- `background/context-menus.spec.ts`
- `background/sync-manager/services/webdav.spec.ts`
- `_helpers/browser-api.spec.ts`
- `components/dictionaries/merriamwebster/engine.spec.ts`

另外补了 Merriam-Webster 缺失 fixture：

- `test/specs/components/dictionaries/merriamwebster/response/add.html`
- `test/specs/components/dictionaries/merriamwebster/response/transitive.html`

### 还剩下的测试注意点

当前没有失败用例需要再删。

但还有一个显式待办：

- [`test/specs/components/dictionaries/merriamwebster/engine.spec.ts`](./test/specs/components/dictionaries/merriamwebster/engine.spec.ts) 中保留了 `it.todo('should returns correct forms')`

这不是坏测试，但代表 Merriam-Webster forms 这一小块解析断言还没补完。

## 后续加功能的门禁与注意事项

### 强制门禁

用户可见改动至少要过：

```bash
npm run test:required
```

如果改动涉及基础设施、background、词典 parser、同步逻辑，还要再跑：

```bash
npm test
```

### 新功能开发规则

#### 1. 用户任务优先，不要只补实现测试

任何会改变用户体验的功能，都先回答：

1. 它改变了哪条用户任务？
2. `test/acceptance/spec.json` 是否已经覆盖？

如果没有，就先补场景。

#### 2. Background 里不要重新引入 MV2 心智

不要在 background 里新增：

- `window.*` 全局状态
- 直接 DOM 操作
- 假设 background 永久存活的逻辑

正确做法：

- 状态走 [`src/background/state.ts`](./src/background/state.ts)
- DOM 能力走 [`src/background/offscreen-helper.ts`](./src/background/offscreen-helper.ts)
- 长生命周期任务优先考虑 `chrome.alarms`

#### 3. 新扩展页面统一走 entrypoints

新增页面时，按这个结构加：

- `src/entrypoints/<name>/index.html`
- `src/entrypoints/<name>/main.tsx`

不要再回到旧时代的手写 manifest 页面拼装。

#### 4. 权限变更必须连同测试一起改

如果新增权限、host permission、命令、web accessible resources：

- 先改 [`wxt.config.ts`](./wxt.config.ts)
- 再补或更新 E2E 覆盖

#### 5. Acceptance contract 不要随手删

以下这类语义契约默认不能无声改掉：

- `lookup-bowl`
- `lookup-panel`
- `lookup-dict-result`
- `lookup-dict-empty`
- `lookup-dict-error`
- `data-lookup-terminal`

如果用户意图没变，就保持契约稳定；如果用户意图变了，就一起改测试和文档。

## 当前仓库整理结果

这轮顺手做了几件“让目录更干净”的事：

- 更新根文档，去掉旧的 Yarn/Webpack/MV2 叙述
- 补充 WXT/MV3 真实入口和门禁说明
- 补齐 `.gitignore`，忽略 WXT/build/acceptance artifacts 生成物
- 清理空的 `src/manifest/` 目录及多余的本地构建产物目录

## 可以继续做但不影响当前交付的事

- 把 Sass `@import` / 全局内建函数的弃用警告系统性迁移掉
- 继续观察自动化 Chromium 对 hidden offscreen 的支持情况，确认是否还能去掉窗口 fallback
- 补完 Merriam-Webster forms 的 `todo` 测试
- 如果要重新支持非 Chrome 平台，单独开新阶段处理，不要混在当前 MV3 Chrome 维护里
