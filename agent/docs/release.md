# 发布与分支

## 分支

- 日常 Bug、功能和重构默认从 `main` 创建符合 `agent/docs/commit.md` 的 `<type>/<topic>` 分支，并提交到 `main` PR。
- `dev` 只有在用户明确说明集成、版本或发布目标时使用。
- 发布版本通过 `package.json#version` 驱动 `.github/workflows/release.yml`；PR 合并到 `main` 后，未更新版本时自动生成补丁版本 PR，通过 CI 后合并并发布。
- PR 显式修改版本号时优先使用该版本，适用于 minor/major 发布；不要手工移动已有版本标签。
- `main` 受 ruleset 保护，版本提交不得尝试直接推送；发布工作流需要仓库允许 GitHub Actions 创建 Pull Request。

## 发布前

- 确认 major/minor 版本变更和 PR 说明一致；补丁版本由发布工作流自动递增。
- 运行 `pnpm lint`、`pnpm typecheck`、`pnpm build`。
- 检查 release workflow 的写权限仍只在发布任务使用，并按需保留 `actions: write`、`checks: read`、`contents: write` 与 `pull-requests: write`。
- 记录未验证的正式后端、Electron、真机或第三方编辑器场景。
