# Agent 編輯工作流程業務知識

## 範圍

本文件擁有 Agent 編輯器的工作區版本選擇、草稿狀態、保存／發布、資產與聊天調試流程。Agent 資料與版本 API 由 [Agent domain](../../../domains/Agent/BUSINESS.md) 擁有。

## 規則

- 工作區以目前使用者 ID 與 Agent `ownerId` 比較計算 `isOwner`；非 owner 的 UI 不提供編輯，且版本選擇器將版本停用。這是前端顯示與流程限制，不是後端授權證明。依據：[useAgentVersionController](controllers/useAgentVersionController.ts) 的 `load`、`selectVersion`、`disabledVersionKeys`。
- owner 編輯目前草稿時以快照比較 dirty 狀態；查看歷史版本、保存、發布或切換版本期間為唯讀。退出有未保存修改時，runtime 透過 `prepareDraftExit` 提供保存或捨棄選項。依據：[useAgentDraftSessionController](components/AgentWorkspace/controllers/useAgentDraftSessionController.ts) 的 `snapshotAgentDraft`、`isReadOnly`，以及 [AgentWorkspace](components/AgentWorkspace/index.tsx) 的 `prepareDraftExit`。
- 保存送出一份草稿快照；同一時間重複的保存請求共用進行中的 Promise。發布前若草稿 dirty，先保存，保存成功後才呼叫 publish。domain 儲存契約與限制詳見 [Agent domain](../../../domains/Agent/BUSINESS.md)。依據：[useAgentDraftSessionController](components/AgentWorkspace/controllers/useAgentDraftSessionController.ts) 的 `saveDraftRequest`、`publishRequest`。
- owner 開啟 system prompt 為空的目前草稿時，編輯器先以 guided prompt 預設內容初始化本地 draft；這不代表已自動保存到後端。依據：[useAgentDraftSessionController](components/AgentWorkspace/controllers/useAgentDraftSessionController.ts) 的 `initialDraft`、[guided prompt](guidedPrompt/index.ts) 的 `buildGuidedPrompt`。
- owner 查看目前草稿時可將草稿 Agent 注入 Chat 調試；若草稿 dirty，送出會等待確認，且只有保存成功才繼續。歷史版本與非 owner 不注入目前草稿。依據：[AgentWorkspace](components/AgentWorkspace/index.tsx) 的 `debugAgent`、[useAgentDebugSendGuardController](components/AgentWorkspace/controllers/useAgentDebugSendGuardController.ts) 的 `interceptSend`、`confirm`。
- asset 多檔上傳按順序逐檔提交；上傳或刪除成功後重新讀取 draft version 的資產清單。依據：[useAgentAssetsController](components/AgentEditor/controllers/useAgentAssetsController.ts) 的 `uploadRequest`、`refreshAssets`、`deleteRequest`。

## 尚未由前端證明的事項

工作區中的 owner 判斷、版本停用、dirty 狀態與成功提示不代表伺服器授權或持久化狀態；正式權限及保存／發布結果須以 API 回應與後端規則為準。
