# WisePenView 正式路由契约

本文档记录上线后的前端 URL 契约。路由变更会影响深链、分享、浏览器历史、桌面端窗口恢复和外部通知，修改前必须评估兼容与发布成本。

## 基本准则

- URL 是页面位置、顶部导航、侧栏默认面板、页面级 Tab 和面包屑的唯一真相。
- 页面级 Tab 必须可刷新、分享，并支持浏览器前进和后退；点击使用 `push`。
- 编辑模式、排序、预览、表单、弹窗等临时 UI 状态保留在本地。
- 静态路径使用 `APP_ROUTE_PATH`，动态路径使用 `src/utils/navigation/appRoute.ts` 的 builder；动态 ID 必须编码。
- UI、layout 和 hook 禁止直接写前端路径字面量。路由契约、路由树和领域 API endpoint 不受此限制。
- 本次废弃路径没有 redirect、alias、wrapper 或其它兼容入口。

## 入口与认证

| 路径                     | 参数与行为                   |
| ------------------------ | ---------------------------- |
| `/`                      | 匿名聊天假页；自动校验登录态 |
| `/login`                 | 登录；可带 `redirect`        |
| `/register`              | 注册；可带 `redirect`        |
| `/onboarding/bind`       | 注册后的账号绑定             |
| `/password/forgot`       | 发起密码重置                 |
| `/password/reset?token=` | 设置新密码                   |
| `/email/verify?token=`   | 验证邮箱                     |
| `/chat`                  | 登录后的新对话               |

门户已拆分到独立项目，本仓库不再承载门户页面。已登录用户仍可访问全部认证页面。`/` 挂载后会主动调用 `userService.getUserInfo({ forceRefresh: true })`：成功 replace 到 `/chat`，失败停留在匿名假页并提示“登录已过期”。匿名用户在 `/` 的左侧栏和聊天操作仅提示登录；左下角登录按钮进入 `/login?redirect=/chat`。任意 Axios 401 和用户主动退出都会清理会话并进入 `/login`。

## 应用基础

| 路径                                    | 参数与行为         |
| --------------------------------------- | ------------------ |
| `/chat[/:sessionId]`                    | 新对话或指定会话   |
| `/notifications[/:messageId]`           | 消息列表或指定消息 |
| `/profile`                              | replace 到 account |
| `/profile/{account\|usage\|appearance}` | 个人设置页面       |

除 `/`、认证页面和 `/admin/*` 外，业务路由统一由登录守卫保护。`userService.getUserInfo()` 是会话真相；加载时展示 Spin，校验失败进入带当前 URL 回跳参数的登录页。登录成功后的默认入口是 `/chat`，匿名入口 `/` 不承载真实会话路由。桌面端生产启动 URL 为 `/`。

## 云盘与资源

| 路径                                      | 参数与行为          |
| ----------------------------------------- | ------------------- |
| `/drive`                                  | replace 到 personal |
| `/drive/personal[/folder/:folderId]`      | 个人云盘及文件夹    |
| `/drive/{upload-queue\|favorites\|trash}` | 系统视图            |
| `/drive/trash/folder/:folderId`           | 回收站文件夹        |
| `/resources/:resourceType/:resourceId`    | 资源工作区          |

资源工作区保留 `viewer`，PDF 可保留 `page`、`zoom` query。没有 `resourceId` 的资源路径无效。Skill 的版本、文件、配置和预览状态不进入 URL。

## 小组与课程

| 路径                                                           | 参数与行为           |
| -------------------------------------------------------------- | -------------------- |
| `/groups?role=&page=&size=`                                    | 小组列表、筛选和分页 |
| `/courses?page=&size=`                                         | 课程列表与分页       |
| `/invite?code=`                                                | 通用邀请入口         |
| `/groups/:groupId`                                             | replace 到 files     |
| `/groups/:groupId/files[/folder/:folderId]`                    | 小组文件及文件夹     |
| `/groups/:groupId/{members\|wallet\|token-transfer\|settings}` | 小组详情页面         |

`role=all&page=1&size=8` 是默认值，从 URL 省略。有效筛选和分页使用 push。邀请入口独立于列表 query，`code` 仅用于打开加入弹窗。wallet 和 token-transfer 无权限时保留 URL 并展示 403。

## 课程

| 路径                                                                           | 参数与行为       |
| ------------------------------------------------------------------------------ | ---------------- |
| `/courses/:courseId`                                                           | replace 到 home  |
| `/courses/:courseId/{home\|info\|materials\|announcements\|members\|settings}` | 课程页面         |
| `/courses/:courseId/assignments[/:assignmentId]`                               | 作业列表或详情   |
| `/courses/:courseId/learning[/:outlineNodeId]`                                 | 学习页或大纲节点 |

home 与 info 是同级路由。settings 只允许教师访问；无权限时保留 URL 并展示 403。

## 管理端与错误页

- 现有 `/admin/*` 路径保持不变，`/admin` replace 到 `/admin/users`。
- 应用与管理端分别提供所属壳层的错误页，未匹配路由使用全局 404。
- 管理端公告跳转地址的自由文本与历史失效示例暂不纳入本次约束。

## Route Meta、Tab 与面包屑

- App 路由通过 `handle.app` 声明 `pageKey`、`headerNav` 和 `sidebarTab`。
- `useAppRouteMeta()` 从最深匹配读取元数据。顶部导航不保存额外选择状态；侧栏允许临时切换，但 pathname 变化时恢复路由默认面板。
- 页面级 Tab 直接调用领域 route builder，不抽象 `useRouteTab`。
- 面包屑数据统一为 `{ key, label, to?, current? }`。祖先项必须有真实 `to` 并渲染 Link；当前项不可点击且带 `aria-current="page"`。
- 拖放等领域交互通过面包屑 `renderItem` 扩展，不改变导航协议。

## 前进与后退

- Web 使用浏览器自身的历史能力，不读取 `window.history.state` 推断前进或后退边界。
- 桌面端导航按钮以 Electron `webContents.navigationHistory` 为真相，只允许进入相邻的已登录业务历史项，不通过应用内按钮退回匿名入口、认证或管理端。
- 业务代码不得直接调用 `window.history.pushState` 或 `window.history.replaceState`；pathname、query 和 hash 都必须通过 React Router 更新。
- `AppNavigationContext` 只提供 `canGoBack`、`canGoForward`、`goBack` 和 `goForward`，不向业务层暴露历史索引。

## 权限与废弃路径

`/groups` 和 `/courses` 是登录后的“小组/课程”入口，不代表匿名访问。

`/app`、`/auth` 及其全部子路径已删除且不重定向；其它历史废弃路径同样不提供兼容入口。
