# Agent 領域業務知識

## 範圍

本文件擁有 Agent 資源、版本資料、Spec 與資產 service 契約。編輯工作區、草稿保存與發布互動由 [Agent editor workflow](../../components/editors/agent/BUSINESS.md) 擁有。

## 規則

- Agent 以 Resource ID 作為資源識別；詳情合併 Resource 資訊與 Agent 版本 bundle。已發布版本取自版本資源資訊，預設草稿版本為 `publishedVersion + 1`；若請求指定正版本，bundle 提供該版本的狀態、Spec 與資產。依據：[AgentServices](service/AgentServices.impl.ts) 的 `getAgentDetail`、[AgentServicesMap](mapper/AgentServices.map.ts) 的 `mapAgentDetail`、[Agent entity](entity/agent.ts) 的 `AgentDetail`。
- `AgentSpec` 包含 system prompt、模型策略、Tool／Skill 策略與記憶策略；mapper 對缺少的 Spec 或策略欄位套用前端預設值，並非嚴格驗證所有必要欄位。預設值不是後端已儲存設定的證明。依據：[AgentServicesMap](mapper/AgentServices.map.ts) 的 `mapSpec`、`AGENT_SPEC_FALLBACK`、[Agent API type](apis/AgentApi.type.ts) 的 `AgentSpecApi`。
- 儲存草稿透過兩個請求分別更新 Agent 基本資料的 `name`／`description` 與指定 draft version 的 Spec，service 使用 `Promise.all`；兩者不是原子交易，部分成功可能留待重新讀取確認。依據：[AgentServices](service/AgentServices.impl.ts) 的 `saveAgentDraft`、[AgentServicesMap](mapper/AgentServices.map.ts) 的 `mapSaveAgentDraftRequests`。
- Agent asset 使用版本資產上傳流程；副檔名映射為 MD、Python、JSON、YAML、TOML，其餘映射為 TEXT。上傳與刪除都帶 resource ID 及 draft version。依據：[AgentServices](service/AgentServices.impl.ts) 的 `uploadAsset`、`deleteAssets`、[AgentServicesMap](mapper/AgentServices.map.ts) 的 `resolveAssetResourceType`、[Agent API type](apis/AgentApi.type.ts) 的 `AgentAssetResourceTypeApiValue`。

## 尚未由前端證明的事項

前端將 Resource owner 資訊映射到 Agent，並送出版本／Spec／asset 請求；實際讀寫權限、發布者資格、版本不可變性及 asset 保存行為仍由後端契約決定，不能僅憑 UI 狀態推論。
