# BUSINESS.md 业务知识治理

`BUSINESS.md` 用于保存不容易从代码直接推导、但会影响实现与审查的业务规则、历史决策、特殊判断与不可任意修改的约束。它不是 API 文档、一般工程规范或更改日志。

## 一、Canonical owner

- 根目录 `BUSINESS.md` 只做索引，不复制详细规则，也不记录进度或审查状态。
- `src/domains/<Domain>/BUSINESS.md` 保存跨 view、service 或 API 的 domain 规则。
- `src/views/.../<Feature>/BUSINESS.md` 保存单一页面或流程的互动状态、编辑限制与用户可见流程。
- 只有确实存在需要长期保存的知识才创建文档；没有内容的模块不加入根索引，也不创建空文件。
- 一条规则只能有一个主要拥有者；其他位置只链接，不重复抄写。

## 二、文档内容

模块文档按实际需要说明：范围、核心规则、状态／权限、特殊判断、禁止修改事项、历史决策和相关代码。每一条重要规则都应能回到当前代码、API 契约、PR／commit 或其他可追溯证据。文档不记录维护状态或审查日期，进度以 Git 和 PR 流程为准。

## 三、迁移与删除

1. 先盘点现有 docs、注解、测试与代码中的业务规则。
2. 确认唯一 owner 与文档粒度，再依模板创建或更新 `BUSINESS.md`。
3. 更新 README、规范、代码注解与 PR 链接，避免断链。
4. 由模块 owner 审查内容是否完整、没有重复或推测性结论。
5. 只有迁移完成且所有引用已更新后，才删除旧业务 docs；工程规范文档不得因迁移而一并删除。

## 四、审查节奏

治理按业务域批量进行：先用一至两个模块试点，完成两次「内容完整性、唯一来源、代码对照、模板可用性」审查，再扩大到下一批。批量之间不要求顺手重构无关的大文件。

### 第一轮下沉盘点

- **Drive**：已将 `src/domains/Drive` 的节点、scope、系统文件夹、权限、回收站和 cursor 约束集中到 `src/domains/Drive/BUSINESS.md`。`agent/docs/routing.md`、`agent/docs/overlay.md` 中关于路由和通用浮层的工程规则不属于 Drive 业务知识，继续保留；本轮没有可删除的独立 Drive 业务文档。
- **Skill domain**：已将 `src/domains/Skill` 的版本、owner、asset、上传覆盖和 service 边界集中到 `src/domains/Skill/BUSINESS.md`。领域代码、注释和已有 PR 证据仍是来源，本轮没有删除工程文档或重复创建 domain 文档。
- **Skill editor workflow**：已将工作区、文件树、save queue、local draft cache、版本浏览和离开守卫集中到 `src/components/editors/skill/BUSINESS.md`。`agent/docs/store.md` 保留跨页面持久化工程规则，只通过链接引用业务文件，不再复制 Skill 流程细节。

因此，第一轮完成的是三个试点范围内的知识下沉和唯一 owner 创建，不是全仓库业务文档清零。下一轮开始前仍需按相同清单复核引用、代码对照和重复规则。

## 五、覆盖路线与迭代数

以目前 19 个一级业务域（不含 `_registry`、`_shared`）估算，完整覆盖预计分 **5 轮**；每轮都先盘点是否真的存在需要长期保存的业务知识，没有内容的域只更新根索引，不创建空文档。每轮完成后进行一次业务 owner 审查；第一轮还需在扩大范围前完成第二次试点复审：

1. **第 1 轮（本 PR）**：Drive、Skill domain、Skill editor workflow；完成两次试点审查后才进入下一轮。
2. **第 2 轮**：Resource、Tag、Image、Document；先处理跨页面共用的资源与标签规则，再补文档与图片生命周期。
3. **第 3 轮**：Auth、User、Group、Wallet；集中确认账号、群组、权限与资产归属边界。
4. **第 4 轮**：Chat、Agent、Course、Message；整理对话、代理、课程与消息状态及跨域引用。
5. **第 5 轮**：Note、Speech、Interact、InlineComment、Admin，并做一次全域索引、重复规则与断链审查。

上述是目前的批量基线，不是承诺每个域都必须产生文档；若盘点证明某域没有不可由代码直接推导的长期知识，该域可在该轮审查记录中记为「无需创建」，但不加入根索引。每轮至少包含一次内容／代码对照审查；第 1 轮固定先完成两次审查，后续批量沿用同一检查表并在第 5 轮追加全域一致性审查。

## 六、反模式

- 把 API 栏位表、通用 React 规范或一次性 PR 摘要写成 BUSINESS.md。
- 在根索引重复完整业务规则。
- 为了看起来完整而创建没有规则的空文档。
- 把推测当成已确认规则，或只引用 mock 而没有说明正式契约状态。
- 迁移后保留两份同等权威的文档。
