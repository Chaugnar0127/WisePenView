# 发布与分支

## 分支

- 日常 Bug、功能和重构默认从 `main` 创建符合 `agent/docs/commit.md` 的 `<type>/<topic>` 分支，并提交到 `main` PR。
- `dev` 只有在用户明确说明集成、版本或发布目标时使用。
- 发布版本通过 `package.json#version` 驱动 `.github/workflows/release.yml`；PR 合并到 `main` 后，未更新版本时自动生成补丁版本 PR，通过轻量版本门禁后合并并发布。
- PR 显式修改版本号时优先使用该版本，适用于 minor/major 发布；不要手工移动已有版本标签。
- `main` 受 ruleset 保护，版本提交不得尝试直接推送；发布工作流使用 `RELEASE_TOKEN` 创建版本 PR，避免 `GITHUB_TOKEN` 创建的 PR 进入 Actions 人工审批。
- `RELEASE_TOKEN` 使用仓库协作者持有的 fine-grained PAT，仅授权本仓库，权限限制为 `Contents: Read and write` 与 `Pull requests: Read and write`；不要复用普通 CI 权限或授予管理员权限。

## 发布前

- 确认 major/minor 版本变更和 PR 说明一致；补丁版本由发布工作流自动递增。
- 自动版本 PR 只允许修改 `package.json#version` 且必须恰好递增一个补丁号；不要在该 PR 中加入其他文件或字段。
- 运行 `pnpm lint`、`pnpm typecheck`、`pnpm build`。
- 检查 release workflow 的写权限仍只在发布任务使用，并按需保留 `actions: read`、`checks: read`、`contents: write` 与 `pull-requests: write`；确认 `RELEASE_TOKEN` 未过期。
- 记录未验证的正式后端、Electron、真机或第三方编辑器场景。
