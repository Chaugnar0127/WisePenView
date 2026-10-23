# 发布工作流

1. 确认发布来自明确的发布任务或已批准 PR；普通合并会自动递增补丁版本。
2. minor/major 版本在 PR 中显式修改 `package.json#version`，合并后工作流优先发布该版本。
3. 从 `main` 检查版本号、依赖锁文件、release workflow 和当前标签。
4. 运行 `pnpm lint`、`pnpm typecheck`、`pnpm build`，记录正式环境、Electron 和第三方编辑器未验证项。
5. 自动补丁版本 PR 必须通过轻量版 `Code Quality & Build Gate` 后才会合并并发布；该门禁只允许修改 `package.json#version` 并校验补丁号加一。不要绕过 ruleset 直接推送 `main`，也不要为了消除人工审批而关闭 PR 工作流审批。
6. 不手工移动已存在的版本标签；不要把发布权限扩散到普通 CI。
