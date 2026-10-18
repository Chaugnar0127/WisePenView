# Course 領域業務知識

## 範圍

Course 是前端建立在 Group、Tag、Resource 與 Interact 服務上的聚合視圖，不是獨立後端 Course API。Course entity 與服務只表示目前 UI 使用的聚合模型。

## 規則

- Course 清單只查詢 `GROUP_TYPE.ADVANCED`；詳情也會拒絕非 ADVANCED Group。角色映射為 Group `OWNER` → Course `TEACHER`、`ADMIN` → `ASSISTANT`、其餘 → `STUDENT`。依據：[CourseServices](service/CourseServices.impl.ts) 的 `listMyCourses`、`getCourseDetail`、[CourseServicesMap](mapper/CourseServices.map.ts) 的 `mapGroupRole`、`mapGroupToCourseDetail`。
- Course metadata 放在 Group `groupMetaInfo.course`，schema 為 `wisepen.course.v1`；已知欄位包括學期、類別、起訖日、大綱 root tag、學習目標、會議、評量與期末評量。序列化保留原 metadata 中未識別的 course 欄位及其他 Group 頂層 metadata。依據：[CourseServicesMap](mapper/CourseServices.map.ts) 的 `COURSE_META_SCHEMA`、`parseCourseMeta`、`serializeCourseMeta`。
- 建立 Course 依序建立 ADVANCED Group、新增「大綱內容」root tag，再回寫 tag ID 至 Group metadata；此流程由多個 service 請求構成，前端程式未提供跨請求交易。依據：[CourseServices](service/CourseServices.impl.ts) 的 `createCourse`。
- 大綱的章節／節點由 Tag 樹表示，節點資源從 Group resources 查詢；資源已讀狀態取自 `myInteraction.read`，Course 進度按唯一 resource ID 計算。章節資源順序寫在 tag metadata 的 `resourceOrder`。依據：[CourseServices](service/CourseServices.impl.ts) 的 `getCourseOutlineRoot`、`loadCourseOutlineResources`、`mountCourseOutlineResources`、[CourseServicesMap](mapper/CourseServices.map.ts) 的 `mapCourseOutlineNodes`、`calculateCourseOutlineProgress`、`resourceOrder` mapper。
- 公告與作業 API 目前回報 `COURSE_SERVICE_UNAVAILABLE`；Course home 對公告及待辦作業回傳空集合。即使 UI 有公告／作業頁面與暫存 entity，也不能視為此功能已接入正式服務。依據：[CourseServices](service/CourseServices.impl.ts) 的 `unavailable`、`getCourseHome`、`listCourseAnnouncements`、`listCourseAssignments`、`getCourseAssignment`、`submitCourseAssignment`。

## 尚未由前端證明的事項

Group／Tag／Resource 的正式權限、Course metadata 的後端驗證與公告／作業未來資料模型不由此聚合實作證明。不要把目前 entity 欄位或 UI 頁面當成已上線的服務契約。
