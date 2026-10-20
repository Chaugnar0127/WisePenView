# Chat 領域業務知識

## 範圍

本文件擁有 Chat domain 的會話資料、模型／Provider／Tool 服務契約、資源選項與附件上傳規則。Chat 輸入、傳送、歷史載入與工具審批的使用者流程由 [Chat workflow](../../components/business/Chat/BUSINESS.md) 擁有；目前會話 ID 的路由來源由 [routing 規範](../../../agent/docs/routing.md) 說明。

## 規則

- 會話 API 目前只將 ID、使用者 ID、標題、建立／更新時間及 Agent ID／版本映射為 `ChatSession`。domain 的 session cache 只快取伺服器會話中繼資料；目前選取 ID 不持久化，也不由 cache 驅動導航。依據：[ChatApi session DTO](apis/ChatApi.type.ts) 的 `ChatSession`、[ChatServicesMap](mapper/ChatServices.map.ts) 的 `mapSessionFromApi`、[session cache](session/sessionCache.ts) 的 `chatSessionCache`。
- 模型選項來自啟用中的 system／user 模型，並依啟用的 provider mapping 展開；沒有啟用 mapping 時仍建立未指定 provider ID 的 fallback 選項，不代表該 provider 已可用。同一模型的不同 mapping 可形成不同選項，選項 `id` 可含 provider ID，送出 request 則使用後端 `modelId`。預設優先選第一個 system 免費選項，其 provider mapping 的輸入、快取輸入及輸出計費比例必須全為字串 `'0'`；否則沿用第一個啟用選項。依據：[ChatServicesMap](mapper/ChatServices.map.ts) 的 `getOrderedProviderOptions`、`createFallbackProviderOption`、`buildSelectionId`、`isFreeModel`、`mapGetModelsFromApi`。
- Chat 可列出個人及群組資源中的 Agent／Skill；群組範圍需有 `groupId`，否則回傳空頁。Agent 選項由 Resource item 映射，不代表 Agent API／後端授權已通過。依據：[ChatServices](service/ChatServices.impl.ts) 的 `listChatInputAgents`、`listChatInputSkills`、[agent mapper](mapper/agent.mapper.ts) 的 `buildAgentFromResourceItem`。
- 一般輸入能力選項依所選 Agent 的群組來源決定 Skill 搜尋範圍；Tool picker 僅以已設定且名稱符合 `_search` 結尾的 Tool 作為 Web Search 選項。這是前端當前分類方式，不是後端完整 Tool 分類或可用權限的證明。依據：[ChatServices](service/ChatServices.impl.ts) 的 `getChatInputCapabilityOptions`、[capability picker mapper](mapper/capabilityPicker.mapper.ts) 的 `selectChatInputWebSearchTools`。
- 臨時附件上傳先計算檔案 MD5 並向 Chat API 取得上傳初始化結果，再依回傳資訊直傳 OSS；`saveToLibrary` 只映射為初始化請求的 `enable_library`。前端不能據此保證後端保存、保留期限或檔案處理結果。依據：[ChatServices](service/ChatServices.impl.ts) 的 `uploadAttachment`、[ChatApi.type](apis/ChatApi.type.ts) 的 `InitTemporaryAttachmentUploadApiResponse`。
- 會話歷史由 Chat Session API 分頁取得並映射為 UI message；mapper 略過沒有字串 ID 或 role 不屬於 system／user／assistant 的訊息，將非陣列 parts 視為空集合，並略過無法映射的 part。這不構成完整回應的執行期契約驗證，也不從開放型 metadata 與 tool payload 推導固定業務結構。依據：[ChatServices](service/ChatServices.impl.ts) 的 `listHistoryMessages`、[ChatServicesMap](mapper/ChatServices.map.ts) 的 `mapMessageFromApi`、`mapMessagePartFromApi`、`mapListHistoryMessagesFromApi`。

## 尚未由前端證明的事項

- 模型計費、Provider 憑證保管、附件授權／保存期限、Agent／Skill／Tool 的伺服器端存取控制與正式業務語義，必須以後端契約為準；本文件不將選項可見或請求欄位視為授權、計費或持久化承諾。
