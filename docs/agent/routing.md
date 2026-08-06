# WisePenView 正式路由契约

本文档记录上线后的前端 URL 契约。路由变更会影响深链、分享、浏览器历史、桌面端窗口恢复和外部通知，修改前必须评估兼容与发布成本。

## 基本准则

- URL 是页面位置、顶部导航、侧栏默认面板、页面级 Tab 和面包屑的唯一真相。
- 页面级 Tab 必须可刷新、分享，并支持浏览器前进和后退；点击使用 `push`。
- 编辑模式、排序、预览、表单、弹窗等临时 UI 状态保留在本地。
- 静态路径使用 `APP_ROUTE_PATH`，动态路径使用 `src/utils/navigation/appRoute.ts` 的 builder；动态 ID 必须编码。
- UI、layout 和 hook 禁止直接写 `/app`、`/auth`、`/admin` 路径字面量。路由契约、路由树和领域 API endpoint 不受此限制。
- 本次废弃路径没有 redirect、alias、wrapper 或其它兼容入口。

## 门户与认证

| 路径                          | 参数与行为               |
| ----------------------------- | ------------------------ |
| `/`                           | 门户首页                 |
| `/auth`                       | replace 到 `/auth/login` |
| `/auth/login`                 | 登录；可带 `redirect`    |
| `/auth/register`              | 注册；可带 `redirect`    |
| `/auth/onboarding/bind`       | 注册后的账号绑定         |
| `/auth/password/forgot`       | 发起密码重置             |
| `/auth/password/reset?token=` | 设置新密码               |
| `/auth/email/verify?token=`   | 验证邮箱                 |

已登录用户仍可访问全部 `/auth/*` 页面。任意 Axios 401 清理会话后进入 `/auth/login?redirect=`，其中 `redirect` 保存完整 pathname、query 和 hash。

## 应用基础

| 路径                                        | 参数与行为             |
| ------------------------------------------- | ---------------------- |
| `/app`                                      | replace 到 `/app/chat` |
| `/app/chat[/:sessionId]`                    | 新对话或指定会话       |
| `/app/notifications[/:messageId]`           | 消息列表或指定消息     |
| `/app/profile`                              | replace 到 account     |
| `/app/profile/{account\|usage\|appearance}` | 个人设置页面           |

`/app` 统一由登录守卫保护。`userService.getUserInfo()` 是会话真相；加载时展示 Spin，非 401 错误保留当前 URL 并提供重试。

## 云盘与资源

| 路径                                          | 参数与行为          |
| --------------------------------------------- | ------------------- |
| `/app/drive`                                  | replace 到 personal |
| `/app/drive/personal[/folder/:folderId]`      | 个人云盘及文件夹    |
| `/app/drive/{upload-queue\|favorites\|trash}` | 系统视图            |
| `/app/drive/trash/folder/:folderId`           | 回收站文件夹        |
| `/app/resources/:resourceType/:resourceId`    | 资源工作区          |

资源工作区保留 `viewer`，PDF 可保留 `page`、`zoom` query。没有 `resourceId` 的资源路径无效。Skill 的版本、文件、配置和预览状态不进入 URL。

## 小组与课程

| 路径                                                               | 参数与行为           |
| ------------------------------------------------------------------ | -------------------- |
| `/app/groups?role=&page=&size=`                                    | 小组列表、筛选和分页 |
| `/app/courses?page=&size=`                                         | 课程列表与分页       |
| `/app/invite?code=`                                                | 通用邀请入口         |
| `/app/groups/:groupId`                                             | replace 到 files     |
| `/app/groups/:groupId/files[/folder/:folderId]`                    | 小组文件及文件夹     |
| `/app/groups/:groupId/{members\|wallet\|token-transfer\|settings}` | 小组详情页面         |

`role=all&page=1&size=8` 是默认值，从 URL 省略。有效筛选和分页使用 push。邀请入口独立于列表 query，`code` 仅用于打开加入弹窗。wallet 和 token-transfer 无权限时保留 URL 并展示 403。

## 课程

| 路径                                                                               | 参数与行为       |
| ---------------------------------------------------------------------------------- | ---------------- |
| `/app/courses/:courseId`                                                           | replace 到 home  |
| `/app/courses/:courseId/{home\|info\|materials\|announcements\|members\|settings}` | 课程页面         |
| `/app/courses/:courseId/assignments[/:assignmentId]`                               | 作业列表或详情   |
| `/app/courses/:courseId/learning[/:outlineNodeId]`                                 | 学习页或大纲节点 |

home 与 info 是同级路由。settings 只允许教师访问；无权限时保留 URL 并展示 403。

## 管理端与错误页

- 现有 `/admin/*` 路径保持不变，`/admin` replace 到 `/admin/users`。
- App、Admin 和门户分别提供所属壳层的 404。
- 管理端公告跳转地址的自由文本与历史失效示例暂不纳入本次约束。

## Route Meta、Tab 与面包屑

- App 路由通过 `handle.app` 声明 `pageKey`、`headerNav` 和 `sidebarTab`。
- `useAppRouteMeta()` 从最深匹配读取元数据。顶部导航不保存额外选择状态；侧栏允许临时切换，但 pathname 变化时恢复路由默认面板。
- 页面级 Tab 直接调用领域 route builder，不抽象 `useRouteTab`。
- 面包屑数据统一为 `{ key, label, to?, current? }`。祖先项必须有真实 `to` 并渲染 Link；当前项不可点击且带 `aria-current="page"`。
- 拖放等领域交互通过面包屑 `renderItem` 扩展，不改变导航协议。

## 前进与后退

- Web 使用浏览器自身的历史能力，不读取 `window.history.state` 推断前进或后退边界。
- 桌面端导航按钮以 Electron `webContents.navigationHistory` 为真相，只允许进入相邻的 `/app` 历史项，不通过应用内按钮退回门户、认证或管理端。
- 业务代码不得直接调用 `window.history.pushState` 或 `window.history.replaceState`；pathname、query 和 hash 都必须通过 React Router 更新。
- `AppNavigationContext` 只提供 `canGoBack`、`canGoForward`、`goBack` 和 `goForward`，不向业务层暴露历史索引。

## 权限与废弃路径

`/app/groups` 和 `/app/courses` 是登录后的“小组/课程”入口，不代表匿名访问。

以下路径已删除且不重定向：旧认证根路径、`/app/collaboration*`、`/app/course*`、`/app/drive/group*`、`/app/workspace*`、`/app/my-group*`、`/app/profile/subscription`、`/app/zen`。
