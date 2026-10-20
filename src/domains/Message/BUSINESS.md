# Message 領域業務知識

## 範圍

Message domain 擁有登入使用者的通知訊息分頁與已讀 API 映射；通知清單及互動流程由 [notifications workflow](../../views/app/notifications/BUSINESS.md) 擁有。此 domain 不代表 Chat 對話訊息或歷史。

## 規則

- 使用者訊息由 Message API 分頁取得，domain 映射 ID、收件範圍、類型、標題、內容、跳轉 URL、額外資料、建立時間與已讀狀態。`read` 以 `Boolean(readTime)` 計算，非空字串會成為已讀，不驗證時間字串是否有效。依據：[MessageApi.type](apis/MessageApi.type.ts) 的 `UserMessageApiModel`、[MessageServicesMap](mapper/MessageServices.map.ts) 的 `mapUserMessageApiModelToEntity`。
- 已讀操作按訊息 ID 清單提交；domain 不負責推導未載入頁面或全帳號的訊息狀態。依據：[MessageServices](service/MessageServices.impl.ts) 的 `readMessages`、[MessageServicesMap](mapper/MessageServices.map.ts) 的 `mapReadMessagesRequest`。
- Message `UserMessage` 與 Chat 的 `WisePenUIMessage` 是不同 entity、不同 API／service；通知訊息不應被當作會話中的 Chat turn。依據：[Message entity](entity/message.ts)、[Chat message entity](../Chat/entity/message.ts)、[Chat history API mapping](../Chat/mapper/ChatServices.map.ts) 的 `mapMessageFromApi`。
