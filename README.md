# WisePenView

WisePenView 前端项目，基于 React、Vite、TypeScript、HeroUI 与 Shadcn。

开发规约入口见 `AGENTS.md`，专题规约位于 `docs/agent/`。

## 快速开始

### 1 安装前置环境

- Node.js：`22.23.2`（项目已通过 `.nvmrc` 固定版本）。
- pnpm：执行 `corepack enable` 后使用，版本由 `package.json` 的 `packageManager` 固定。

### 2 项目初始化

```bash
pnpm install
```

如需连接真实后端，复制开发环境示例并按需调整：

```bash
cp .env.development.example .env.development
```

Mock 模式使用 `.env.mock`，生产构建使用 `.env.production`。

### 3 启动本地开发

```bash
pnpm dev
```

Mock 模式：

```bash
pnpm mock
```

Mock 與正式環境共用 service、mapper、快取和 registry，只在 `@domain-apis` 替換 API 與 OSS I/O。模擬資料存於記憶體，重新整理後重置；API 契約變更時需同步更新 mock API。

Note AI Diff 與 PDF 使用本機展示資料。課程公告、作業等正式 service 尚未提供的能力，在 mock 中也維持未開放狀態。Chat 串流、外部協作、Office 編輯與語音辨識不在此模擬範圍。

## 常用命令

- `pnpm dev`：启动开发服务器
- `pnpm mock`：以 mock 模式启动
- `pnpm build`：构建产物
- `pnpm lint`：执行全量 ESLint 检查，error 或 warning 均会失败
- `pnpm lint:fix`：自动整理导入、移除未使用的导入并修复可自动处理的问题
- `pnpm typecheck`：执行 TypeScript 类型检查
- `pnpm check:mock`：離線檢查 mock API 與正式 service 的跨領域讀寫，不啟動伺服器

提交前由 lint-staged 对暂存的 JS、MJS、CJS、TS、TSX 文件执行 ESLint 自动修复，再交给
Prettier 格式化。全量 lint、提交钩子与 CI 共用同一份 ESLint 规则。

导入按副作用导入、Node 内置模块、第三方包、项目别名、相对路径分组。副作用导入保留组内顺序；
依赖初始化或样式覆盖顺序的入口必须保留语义顺序。重复导入由 ESLint 报错，类型导入可以单独声明。
未使用的局部变量应删除；确需保留位置的回调参数使用 `_` 前缀，对象 rest 排除字段不计为未使用。
