# Chat 對話流程業務知識

## 範圍

本文件擁有共用 Chat 輸入、會話切換、訊息傳送、歷史與工具審批的前端流程。資料 DTO 與 service 規則由 [Chat domain](../../../domains/Chat/BUSINESS.md) 擁有；URL 規則由 [routing 規範](../../../../agent/docs/routing.md) 擁有。

## 規則

- 新對話在傳送前才建立後端 session；建立前檢查登入，若本次指定的 Agent ID 或版本與 session 不符，先更新 session Agent。建立完成後以後端 session ID 更新路由，再要求側欄歷史刷新。依據：[useChatSessionController](_controllers/useChatSessionController.ts) 的 `ensureSession`、`syncNewSessionHistoryRefresh`。
- 選取其他會話或開始新對話會清除資源對話上下文與新建會話暫存標記。會話切換時輸入 store 的 session version 用來讓舊輸入非同步工作失效；草稿升級則保留同一版本。依據：[useChatSessionController](_controllers/useChatSessionController.ts) 的 `handleSelectSession`、`startNewChat`、[ChatInputStore](ChatConversation/ChatInput/_context/ChatInputStore.ts) 的 `sessionVersion` 與 `setToolSelectionSession`。
- 傳送需登入、選到模型、完成附件上傳，且沒有資源上下文阻擋或不相符狀態；必要時先確保 session，再將前端狀態、選用資源、啟用附件、Skill／Tool 選擇送交 Chat transport。按下傳送後清空輸入與附件狀態。依據：[useChatInputController](ChatConversation/ChatInput/useChatInputController/index.ts) 的 `handleSend`、[useChatTurnController](_controllers/useChatTurnController.ts) 的 `send`、[useChatSession](../../../domains/Chat/session/useChatSession.ts) 的 `sendSessionMessage`。
- 聊天歷史可分頁載入；替換會話歷史前清空舊訊息，較舊頁與當前訊息依 message ID 去重。切換會話或請求版本變更後完成的舊請求不套用。依據：[useChatHistory](../../../domains/Chat/session/useChatHistory.ts) 的 `replaceHistory`、`prependHistory`、`mergeMessages`。
- 有活動 turn 時，前端查詢 active turn 並恢復 SSE；同一 session／stream lifecycle 的重複恢復會合併，避免重複連線。取消時同時停止前端 stream 並呼叫後端 cancel API。依據：[useChatSession](../../../domains/Chat/session/useChatSession.ts) 的 `resumeSessionStream`、[useChatTurnController](_controllers/useChatTurnController.ts) 的 `cancel`。
- 工具呼叫進入 `approval-requested` 時須明確允許或拒絕；所有待審批項有決定後，前端以結果恢復同一輪對話。關閉審批視窗不會隱式批准或拒絕。依據：[useChatToolApproval](_controllers/useChatToolApproval.ts) 的 `decide`、[toolApprovalModel](_controllers/toolApprovalModel.ts) 的 `listToolApprovalRequests`、[ToolApprovalDialog](ToolApprovalDialog/index.tsx) 的 `handleOpenChange`。
- Agent 編輯器的草稿調試與傳送前確認流程由 [Agent editor workflow](../../editors/agent/BUSINESS.md) 擁有。

## 尚未由前端證明的事項

前端送出的附件／Skill／Tool／模型選項不構成後端授權或成功執行的證據；stream metadata 的歷史持久化、資源上下文在後端的消費語義，依後端契約而定。
