# 通知收件匣工作流程業務知識

## 範圍

通知頁面擁有已載入通知的呈現、選取、跳轉、分頁與已讀互動。訊息資料和 `readTime` 映射由 [Message domain](../../../domains/Message/BUSINESS.md) 擁有；Chat 訊息歷史不屬於通知收件匣。

## 規則

- 通知清單每頁請求 100 筆，採用 infinite scroll，並以虛擬清單呈現已載入項目；URL 的 `messageId` 用來選取已載入的通知。依據：[NotificationsPage](index.tsx) 的 `MESSAGE_PAGE_SIZE`、`useApiInfiniteScroll`、`selectedMessageId`、`useVirtualizer`。
- 點選未讀通知時先導航至該通知路徑，再呼叫 read API；API 成功後才把本地已載入項目標為已讀。讀取失敗會提示錯誤，不先樂觀地更新已讀狀態。依據：[NotificationsPage](index.tsx) 的 `handleSelectMessage`、`markLoadedMessageAsRead`。
- 「全部已讀」只收集目前已載入清單中的未讀 message ID；成功後只更新這批本地項目。它不是對尚未載入頁面或整個信箱的全域操作。依據：[NotificationsPage](index.tsx) 的 `handleMarkAllAsRead`、`markLoadedMessagesAsRead`。
- 通知的 `jumpUrl` 若是 HTTP(S) URL 會在新分頁開啟並使用 `noopener,noreferrer`；否則由應用路由導航。依據：[NotificationsPage](index.tsx) 的 `handleOpenJumpUrl`。
