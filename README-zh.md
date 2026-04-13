# Saladict 沙拉查词

Saladict 是一个基于 Chrome/Edge Manifest V3 的划词查词与翻译扩展。

## 当前状态

- 当前分支上的 MV2 -> MV3 迁移，对 Chrome/Edge 运行时已经完成。
- 构建系统已经切到 WXT + Vite。
- Firefox/Safari 的 manifest 在这个分支里不再继续维护。
- 主要用户链路已经由 Jest、用户意图验收、Playwright E2E、Puppeteer E2E 覆盖。

相关文档：

- [文档入口](./docs/README.md)
- [当前架构说明](./docs/architecture.md)
- [MV3 迁移状态](./MV3_MIGRATION.md)
- [用户意图验收测试](./docs/user-intent-acceptance.md)
- [v7.20.2 发布说明](./docs/releases/v7.20.2.md)
- [贡献指南](./CONTRIBUTING-zh.md)

## 从 Release 安装

下载地址：

- [v7.20.2 release](https://github.com/JoJoJoinme/ext-saladict/releases/tag/v7.20.2)
- [saladict-7.20.2-chrome.zip](https://github.com/JoJoJoinme/ext-saladict/releases/download/v7.20.2/saladict-7.20.2-chrome.zip)

Chrome / Edge 手动安装方式：

1. 解压 `saladict-7.20.2-chrome.zip`
2. 打开 `chrome://extensions` 或 `edge://extensions`
3. 开启开发者模式
4. 点击“加载已解压的扩展程序”
5. 选择解压后的扩展目录

说明：

- 当前 GitHub release 主要提供 `zip` 包供手动安装
- 这个分支不把 `.crx` 作为主要发布格式

## 从源码构建

```bash
git clone git@github.com:crimx/ext-saladict.git
cd ext-saladict
npm install
cp .env.example .env
npm run build
```

如果你不用带凭据的词典，`.env` 可以保持为空。

构建产物输出到 `dist/chrome-mv3/`。

## 开发

```bash
npm run dev
```

## 测试

```bash
npm test
npm run test:acceptance
npm run test:e2e
npm run test:e2e:playwright
npm run test:required
```

`npm run test:required` 是面向用户可见改动的合并门槛，包含：

1. 查词 acceptance contract 单测
2. 用户意图验收测试
3. Playwright 真实扩展 E2E

## License

[MIT](./LICENSE)
