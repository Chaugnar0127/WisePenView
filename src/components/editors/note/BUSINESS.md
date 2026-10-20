# Note 编辑工作流程业务知识

> Canonical owner：`src/components/editors/note`

## 范围

本文件拥有文字笔记的初始化、编辑、标题、汇入、AI Diff 与 Chat 桥接流程。共用资源服务、协同 session 与 signature 投影由 [Note domain](../../../domains/Note/BUSINESS.md) 拥有，不在此重复定义。

## 编辑、标题与退出

- connecting 或没有 EDIT 时 editor 唯读；本地 Yjs 写保护等同步完成且没有 EDIT 时才启用，避免拦截 BlockNote 初始化。具 EDIT 的 disconnected 并非一律唯读，不能将此例外扩大成完整离线能力保证。依据：[NoteEditorSession](CustomBlockNote/NoteEditorSession.tsx)。
- 标题与正文分开储存；标题以 500ms 防抖送出，trim 后空值使用未命名标题，旧请求不覆盖较新编辑的储存提示。标头状态优先顺序为标题 failed、正文 waiting、任一 saving、最后才 saved。依据：[NoteTitle](components/NoteTitle/index.tsx)、[resolveNoteHeaderSaveStatus](components/NoteWorkspace/noteWorkspaceModel.ts)。
- Note 自订退出策略只协商尚未完成的图片工作，不承诺退出时 flush 标题或等待正文持久化；`hasUnsavedChanges` 与图片 `pendingWork` 不是同一状态。依据：[NoteWorkspace](components/NoteWorkspace/index.tsx)。

## 汇入与 AI Diff

- Markdown 汇入先建立资源，再把正文放入 tab-scope 记忆体待办，协同 ready 后才写入编辑器。成功与解析失败都消费待办，没有对已建立资源的回滚；不能把新建成功当成正文已汇入。依据：[useMarkdownNoteImport](hooks/useMarkdownNoteImport.ts)、[usePendingNoteImportStore](_store/usePendingNoteImportStore.ts)、[useNoteEditorHydration](CustomBlockNote/runtime/useNoteEditorHydration.ts)。
- AI Diff 使用正文旁的 Yjs sidecar；接受／拒绝动作在同一 AI action origin 的 transaction 中更新正文与 sidecar，整块删除会清除子树的 sidecar。bulk review 只在有差异、compare 且可写时显示。依据：[applyNoteAiDiffAction](CustomBlockNote/engines/aiDiff/action.ts)、[removeBlockWithAiContent](CustomBlockNote/engines/aiDiff/action.ts)、[useNoteAiDiff](CustomBlockNote/runtime/useNoteAiDiff.ts)。
- AI Diff preview 使用 localOnly session，不连协同服务；预览灌入不能当成正式协同或后端保存证据。依据：[NoteEditorSession](CustomBlockNote/NoteEditorSession.tsx)、[useNoteEditorHydration](CustomBlockNote/runtime/useNoteEditorHydration.ts)。

## Chat 与原文定位

- Note Chat provider 只在协同 connected 且正文 signature 不再 pending 时解除阻挡；选区以文字及 scope 写入 frontend state，不能把选区展示或前端可送出状态当成后端已消费的证据。依据：[createNoteChatStateProvider](NoteChatProtocol.ts)、[createNoteSelectionChatContext](NoteChatProtocol.ts)。
- 原文连结由 `wisepen://note/<id>#p_<blockId>` 协定解析；同一笔记只卷动，其他笔记先开启再定位。定位请求有 TTL 与重试期限，新请求会让旧定位停止；送出导航意图不保证目标 block 仍存在或一定能定位。依据：[parseNoteLinkUrl](noteLinkProtocol.ts)、[resolveNoteLinkAction](noteLinkProtocol.ts)、[createNoteExternalNavigationRequest](noteExternalNavigationModel.ts)、[useNoteExternalNavigationController](components/NoteWorkspace/useNoteExternalNavigationController.ts)。

## 尚未由前端证明的事项

储存文案、唯读 UI、Yjs transaction 与 frontend state 不证明后端授权、正文持久化或跨请求原子性。图片的共用生命周期由 [Image](../../../domains/Image/BUSINESS.md) 拥有。
