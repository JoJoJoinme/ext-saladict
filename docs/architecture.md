# Saladict 当前架构与协作开发说明

> 最后核对日期：2026-04-11
> 配套文档：[`../MV3_MIGRATION.md`](../MV3_MIGRATION.md)、[`./user-intent-acceptance.md`](./user-intent-acceptance.md)、[`../CLAUDE.md`](../CLAUDE.md)

## 1. 这份文档解决什么问题

这份文档不是迁移复盘，而是当前仓库的“工作说明书”。

它回答四个问题：

1. 这个仓库现在如何 build。
2. 这个扩展现在如何运行。
3. 测试体系如何分层、各自保护什么。
4. 后一个 AI 或开发者接手时，应该按什么方式协作，才不容易把 MV3 运行时搞坏。

## 2. 适用边界

当前分支的明确目标是：

- Chrome / Edge Manifest V3
- npm + WXT + Vite
- 真实扩展产物输出到 `dist/chrome-mv3/`

当前分支**不是**：

- MV2 / MV3 双轨兼容分支
- Firefox / Safari 继续维护分支
- 允许直接修改 `dist/` 产物的仓库

## 3. 仓库结构怎么读

先看这些目录：

```text
src/entrypoints/              WXT 入口定义
src/background/               MV3 service worker 逻辑
src/content/                  注入网页的 React 面板与 Redux 状态机
src/selection/                选词监听与页面侧事件采集
src/components/dictionaries/  各词典 engine / parser
src/background/database/      Notebook / History / syncmeta 的 IndexedDB 层
src/public/                   直接进入扩展产物的静态资源与 locales
test/specs/                   Jest 单测
test/acceptance/              用户意图验收
test/e2e/                     扩展构建与真实浏览器 E2E
docs/                         迁移、验收、架构文档
```

如果是第一次接手，这个顺序最有效：

1. 先读 [`../CLAUDE.md`](../CLAUDE.md)
2. 再读 [`../MV3_MIGRATION.md`](../MV3_MIGRATION.md)
3. 再读 [`./user-intent-acceptance.md`](./user-intent-acceptance.md)
4. 最后再看这份架构文档

## 4. Build 是如何工作的

### 4.1 单一事实来源

现在 manifest、权限、入口和构建行为的单一事实来源是：

- [`../wxt.config.ts`](../wxt.config.ts)

关键点：

- `manifest` 字段定义扩展名、权限、命令、`web_accessible_resources`、CSP 等。
- `vite` 字段提供别名 `@ -> src` 和全局 SCSS 注入。
- `runner.binaries.chrome` 指定本地 Chrome 路径，便于 WXT / 运行时一致。

在这个仓库里，**不要**再去找旧的 `src/manifest/*` 作为真相源；它们已经不是当前实现。

### 4.2 入口是如何被发现的

WXT 通过 [`../src/entrypoints/`](../src/entrypoints/) 生成扩展入口。

当前关键入口：

- [`../src/entrypoints/background.ts`](../src/entrypoints/background.ts)：service worker 入口
- [`../src/entrypoints/content.ts`](../src/entrypoints/content.ts)：内容脚本入口
- [`../src/entrypoints/selection.content.ts`](../src/entrypoints/selection.content.ts)：选词监听脚本入口
- [`../src/entrypoints/popup/`](../src/entrypoints/popup/)：popup 页面
- [`../src/entrypoints/options/`](../src/entrypoints/options/)：options 页面
- [`../src/entrypoints/notebook/`](../src/entrypoints/notebook/)：notebook 页面
- [`../src/entrypoints/history/`](../src/entrypoints/history/)：history 页面
- [`../src/entrypoints/quick-search/`](../src/entrypoints/quick-search/)：独立查词页
- [`../src/entrypoints/word-editor/`](../src/entrypoints/word-editor/)：词条编辑页
- [`../src/entrypoints/audio-control/`](../src/entrypoints/audio-control/)：音频页
- [`../src/entrypoints/offscreen/`](../src/entrypoints/offscreen/)：DOM 能力承载页

新扩展页面必须遵循这个约定：

```text
src/entrypoints/<name>/index.html
src/entrypoints/<name>/main.tsx
```

### 4.3 静态资源如何进入产物

有两类资源：

- [`../src/public/`](../src/public/)：直接复制到扩展产物
- [`../src/assets/`](../src/assets/)：走打包流程后被引用

`src/public` 里现在有：

- `_locales/*/messages.json`
- `assets/icon-*.png`
- `pdf-rules.json`

### 4.4 常用命令

入口命令来自 [`../package.json`](../package.json)：

```bash
npm run dev
npm run build
npm run zip
npm test
npm run test:acceptance
npm run test:e2e
npm run test:e2e:playwright
npm run test:required
```

语义上：

- `npm run dev`：WXT 开发模式
- `npm run build`：生成 `dist/chrome-mv3/`
- `npm run zip`：生成打包产物
- `npm run test:required`：用户可见改动的最低门槛

### 4.5 不要做的事

- 不要手改 `dist/chrome-mv3/`
- 不要把 manifest 权限改散到多个文件
- 不要新增一套平行 build 逻辑绕开 WXT

## 5. 运行时实现思路

整个扩展可以理解成五层：

1. 页面侧事件采集层
2. 注入页面的查词 UI 层
3. background service worker 协调层
4. DOM 能力承载层
5. 数据 / 存储 / 同步层

### 5.1 页面侧事件采集层

入口是 [`../src/entrypoints/selection.content.ts`](../src/entrypoints/selection.content.ts)，实际逻辑在 [`../src/selection/index.ts`](../src/selection/index.ts)。

这层负责：

- 监听选择文本
- 监听快捷键
- 监听 quick search 触发
- 发出 `SELECTION` / `PRELOAD_SELECTION` / `EMIT_SELECTION` 等消息

它的职责是“发现用户要查词了”，不是“自己去查词”。

### 5.2 注入页面的查词 UI 层

入口是 [`../src/entrypoints/content.ts`](../src/entrypoints/content.ts)，实际挂载逻辑在 [`../src/content/index.tsx`](../src/content/index.tsx)。

这层会把三个主要 UI 注入到网页：

- `SaladBowl`
- `DictPanel`
- `WordEditor`

查词 UI 的状态管理在 [`../src/content/redux/`](../src/content/redux/)。

关键文件：

- [`../src/content/redux/modules/action-handlers/search-start.ts`](../src/content/redux/modules/action-handlers/search-start.ts)
- [`../src/content/redux/epics/searchStart.epic.ts`](../src/content/redux/epics/searchStart.epic.ts)

其中：

- `search-start` action handler 负责把当前 `word`、历史、要展开的词典列表放入状态
- `searchStartEpic` 负责并发向 background 请求各词典结果，并在合适时机触发发音

### 5.3 Background service worker 协调层

入口是 [`../src/entrypoints/background.ts`](../src/entrypoints/background.ts)，实际初始化在 [`../src/background/index.ts`](../src/background/index.ts)。

它负责：

- 初始化消息服务器
- 初始化 context menus、badge、pdf sniffer、sync
- 监听配置与 profile 变化
- 作为前台页面和底层能力之间的消息中枢

核心协调器是：

- [`../src/background/server.ts`](../src/background/server.ts)

它处理的典型消息包括：

- `FETCH_DICT_RESULT`
- `DICT_ENGINE_METHOD`
- `PLAY_AUDIO`
- `GET_CLIPBOARD` / `SET_CLIPBOARD`
- `SAVE_WORD` / `GET_WORDS`
- `OPEN_QS_PANEL`
- `TEST_CONFIGURE_ACCEPTANCE_RUNTIME`

### 5.4 Service worker 状态是怎么保存的

MV3 的 background 不是持久页面，所以不能继续依赖 `window.*` 全局状态。

当前做法是：

- 模块级缓存收口在 [`../src/background/state.ts`](../src/background/state.ts)
- 真正的配置来源仍是 storage / config-manager / profile-manager
- SW 重启后，缓存为空；下一次访问时懒加载恢复

这套设计的原则是：

- 允许 service worker 被回收
- 允许它无状态地重新拉起
- 初始化必须幂等

如果后续改动重新引入“background 一直活着”的假设，基本就会把 MV3 稳定性重新搞坏。

### 5.5 DOM 能力为什么不在 background 里

MV3 background 不能安全依赖：

- `document`
- `window`
- `new Audio()`
- 某些需要真实 DOM 的解析/复制流程

当前仓库把这些能力转发到：

- [`../src/background/offscreen-helper.ts`](../src/background/offscreen-helper.ts)
- [`../src/entrypoints/offscreen/main.ts`](../src/entrypoints/offscreen/main.ts)

需要注意的现实细节：

- 代码层面叫 “offscreen helper”
- 正常路径会优先创建真正的 hidden offscreen document
- Background 只用 `chrome.runtime` 与 offscreen 通信
- config/profile/cookie/DNR 这类扩展侧能力都在 background 准备
- offscreen 只负责 DOM / Audio / Clipboard / HTML 解析

这条边界是当前仓库里更符合 Chrome 官方 MV3 offscreen 模型的实现。

### 5.6 Notebook / History / Sync 在哪里

前台通过 [`../src/_helpers/record-manager.ts`](../src/_helpers/record-manager.ts) 发消息，真正的数据读写落在 background：

- [`../src/background/database/core.ts`](../src/background/database/core.ts)
- [`../src/background/database/index.ts`](../src/background/database/index.ts)

实现要点：

- IndexedDB 通过 Dexie 封装
- 表有 `notebook`、`history`、`syncmeta`
- 对 notebook 的写入和删除会触发 sync-manager 上传

### 5.7 消息与 API 包装层

整个扩展大量依赖 runtime messaging，统一包装在：

- [`../src/_helpers/browser-api.ts`](../src/_helpers/browser-api.ts)

消息类型定义集中在：

- [`../src/typings/message.ts`](../src/typings/message.ts)

这两层的作用是：

- 减少散落的 `chrome.runtime.sendMessage`
- 给消息 payload / response 一个集中定义点
- 统一 storage、openUrl、page info、self page messaging 等行为

后续新增跨层交互时，优先沿用这套机制，不要直接在各处硬编码字符串消息。

## 6. 一次查词是怎么走通的

以“用户在网页上选中 `Example` 并得到结果”为例，主链路是：

1. [`../src/selection/index.ts`](../src/selection/index.ts) 监听到选词，生成 `Word`
2. 消息送到页面内的内容脚本 UI
3. [`../src/content/redux/modules/action-handlers/search-start.ts`](../src/content/redux/modules/action-handlers/search-start.ts) 决定本次搜索应渲染哪些词典、是否记录历史
4. [`../src/content/redux/epics/searchStart.epic.ts`](../src/content/redux/epics/searchStart.epic.ts) 并发发送 `FETCH_DICT_RESULT`
5. [`../src/background/server.ts`](../src/background/server.ts) 收到请求，转发给 offscreen runner
6. offscreen runner 载入对应词典 engine，执行网络请求与 DOM 解析
7. 查词结果通过消息回到前台 Redux
8. `DictPanel` 渲染结果；若命中自动发音规则，还会触发 `PLAY_AUDIO`

这一条链路决定了两个实践原则：

- 前台页面不直接碰词典抓取细节
- background 不直接做 DOM 解析

## 7. 词典 engine 是如何组织的

每个词典通常放在：

- [`../src/components/dictionaries/`](../src/components/dictionaries/)

典型 engine 暴露：

- `search`
- `getSrcPage`

Background 通过动态 import 加载 engine：

- [`../src/background/server.ts`](../src/background/server.ts)

这意味着：

- 不要把所有词典 engine 提前静态打进一个大入口里
- parser 逻辑应尽量局部化到对应词典目录
- 如果词典需要特殊权限或特殊请求头，除了实现逻辑，还必须同步补 manifest / E2E 断言

`ZDIC` 音频 `Referer` 改写就是一个现成例子：

- manifest 在 [`../wxt.config.ts`](../wxt.config.ts) 声明 `declarativeNetRequestWithHostAccess`
- engine 在 [`../src/components/dictionaries/zdic/engine.ts`](../src/components/dictionaries/zdic/engine.ts) 运行时注册 session DNR 规则

## 8. 测试是如何工作的

这个仓库不是靠单一测试类型兜底，而是四层分工。

### 8.1 Jest：实现层回归

入口：

- [`../jest.config.cjs`](../jest.config.cjs)
- `npm test`

保护内容：

- helper
- background 模块
- 状态层
- 词典 engine / parser
- content acceptance contract 单元逻辑

它快，但不负责证明“扩展真的被 Chrome 加载后还能用”。

### 8.2 Acceptance：用户意图验收

入口：

- [`./user-intent-acceptance.md`](./user-intent-acceptance.md)
- [`../test/acceptance/spec.json`](../test/acceptance/spec.json)
- [`../test/acceptance/playwright-acceptance.mjs`](../test/acceptance/playwright-acceptance.mjs)

保护内容：

- 划词后必须进入明确终态
- 面板搜索、关闭重开、历史导航、加入 notebook 等完整任务链路
- 断言基于语义契约，而不是某个 provider 的具体 DOM

相关语义收口在：

- [`../src/content/acceptance/lookup-contract.ts`](../src/content/acceptance/lookup-contract.ts)

这是目前最接近 BDD / 用户验收的层。

### 8.3 `test:e2e`：构建产物与扩展结构检查

入口：

- [`../test/e2e/extension-e2e.mjs`](../test/e2e/extension-e2e.mjs)

特点：

- 使用 `puppeteer-core`
- 偏向验证 build 产物、manifest 结构、页面可渲染性、关键文件完整性
- 不等价于“真实扩展已完整加载并完成用户操作”

因此它适合做结构级兜底，不适合单独拿来宣布“核心功能端到端已通过”。

### 8.4 `test:e2e:playwright`：真实扩展运行时 E2E

入口：

- [`../test/e2e/playwright-e2e.mjs`](../test/e2e/playwright-e2e.mjs)

特点：

- 用 Playwright 的 Chromium / Chrome for Testing
- 真正通过 `--load-extension` 加载扩展
- 验证 service worker、扩展页面、内容脚本、划词开 panel、offscreen 音频、PDF、context menus、badge、权限等

这是当前仓库里“真实扩展运行起来之后”的最强自动化兜底。

### 8.5 手工浏览器验证

入口：

- [`../test/e2e/manual-open-browser.mjs`](../test/e2e/manual-open-browser.mjs)

适用场景：

- 自动化绿了，但你仍怀疑核心功能
- 需要把浏览器留着给人手试
- 需要看真实 UI 与截图

典型用法：

```bash
npm run build
KEEP_OPEN=true node test/e2e/manual-open-browser.mjs
```

### 8.6 强制门禁

用户可见改动至少跑：

```bash
npm run test:required
```

它串的是：

1. content lookup contract 单测
2. user-intent acceptance
3. Playwright 真实扩展 E2E

如果改动触及以下区域，还要再跑：

```bash
npm test
```

需要额外跑 `npm test` 的典型情况：

- background
- 词典 engine
- 同步逻辑
- helper
- 状态管理

## 9. 机制层面的硬约束

下面这些是这个仓库最容易被新接手的人破坏的点。

### 9.1 Manifest / permission 只能改一个地方

只改：

- [`../wxt.config.ts`](../wxt.config.ts)

改完以后至少补：

- `test/e2e/extension-e2e.mjs`
- `test/e2e/playwright-e2e.mjs`

### 9.2 Background 不要碰 DOM

如果功能需要：

- 播音频
- 读写剪贴板
- 依赖 DOM 的词典抓取

就走：

- [`../src/background/offscreen-helper.ts`](../src/background/offscreen-helper.ts)

不要直接在 background 里重新发明一套 `window` / `document` 方案。

### 9.3 用户可见 DOM 契约不能静默删除

Acceptance 依赖稳定语义契约。

相关文档：

- [`./user-intent-acceptance.md`](./user-intent-acceptance.md)

相关实现：

- [`../src/content/acceptance/lookup-contract.ts`](../src/content/acceptance/lookup-contract.ts)

如果你删掉 `data-testid`、`data-lookup-state`、`data-lookup-terminal` 之类的契约属性，却没同步改 acceptance，那不是“重构”，是把验收标准拆了。

### 9.4 不要重新引入 MV2 心智

典型错误包括：

- 假设 background 永不回收
- 把全局状态塞进 `window.*`
- 认为扩展页天然能替代 service worker 状态
- 直接依赖废弃 API

这类错误短期可能不报错，长期会把真实浏览器 E2E 弄红。

## 10. 后一个 AI 应该怎么协作开发

如果后续还是让 AI 接手，这一套流程最靠谱。

### 10.1 先做上下文收敛，不要上来就改

建议顺序：

1. 读 [`../CLAUDE.md`](../CLAUDE.md)
2. 读 [`../MV3_MIGRATION.md`](../MV3_MIGRATION.md)
3. 读 [`./user-intent-acceptance.md`](./user-intent-acceptance.md)
4. 找到受影响的运行时层
5. 再开始改代码

### 10.2 先问“它改变了哪条用户任务”

对任何用户可见改动，先回答：

1. 用户在做什么任务？
2. 任务成功的终态是什么？
3. `test/acceptance/spec.json` 有没有覆盖？

如果答不上来，就不要急着写实现。

### 10.3 选对改动层

决策可以按这个判断：

- 只是页面 UI：优先看 `src/content/` 或对应 `src/entrypoints/<page>/`
- 需要跨页面协调：看 `src/background/server.ts`
- 需要持久状态：看 `src/background/state.ts` 或 storage manager
- 需要 Notebook / History：看 `src/background/database/`
- 需要 DOM 能力：走 offscreen helper
- 需要词典抓取：看 `src/components/dictionaries/<dict>/`
- 需要权限：改 `wxt.config.ts`

### 10.4 改完必须选对验证层

- 纯 parser / helper 改动：至少 `npm test`
- 用户行为变更：至少 `npm run test:required`
- 涉及扩展加载、权限、service worker、offscreen、PDF：必须看 `npm run test:e2e:playwright`
- 自动化看着过，但你怀疑真实浏览器体验：跑 `manual-open-browser.mjs`

### 10.5 不要对生成物动刀

AI 常见错误之一是直接改：

- `dist/chrome-mv3/*`

这在这个仓库里是无效工作。应该改源文件，再 `build`。

### 10.6 不要把实现测试当验收测试

如果测试只是在验证：

- React root 挂没挂
- 某个 class 名还在不在
- 某个 provider DOM 结构没变

那它不等于用户任务真的成功。

这个仓库现在的标准是：

- 实现测试看实现
- acceptance 看用户任务
- Playwright E2E 看真实扩展运行时

三层各自做自己的事，不互相冒充。

## 11. 最后给接手者的短版规则

如果你只记 8 条，就记这些：

1. 真正的 manifest / permission 真相在 [`../wxt.config.ts`](../wxt.config.ts)
2. 真正的扩展入口在 [`../src/entrypoints/`](../src/entrypoints/)
3. Background 是 service worker，不是持久页面
4. DOM 能力走 offscreen helper，不走 background 直接操作
5. Notebook / History 在 background IndexedDB，不在前台页面本地硬存
6. 用户可见改动先补 acceptance，再跑 `npm run test:required`
7. 权限、加载、真实运行时问题要看 Playwright E2E，不要只看 Jest
8. 不要手改 `dist/`
