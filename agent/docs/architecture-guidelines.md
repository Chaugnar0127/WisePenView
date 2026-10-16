# 前端架构与代码文件拆分规范

本规范补充 `component-boundary.md`、`component-controller.md` 与 domain 分层规范。目标是让责任、状态所有权与依赖方向清楚，不是为了追求更少或更多代码文件。

## 一、代码文件长度使用 ESLint 监测

使用 ESLint 对单个代码文件长度分级：

- 超过 400 行：warning，先检查职责边界，不要求为行数机械拆分。
- 超过 600 行：error，必须拆分或在 ESLint 配置中为明确不适合拆分的代码文件登记例外及原因。
- 第一轮先对 `src/components/editors/skill` 试行；通过两次审查后再扩大目录范围。
- 生成代码文件、第三方 `_shadcn`、fixture、snapshot、样式与 build output 不纳入检查。

warning 与 error 都应逐项审查。处理方式是创建稳定责任边界并拆分，或保留在原代码文件并说明 ESLint 例外理由。审查时至少回答：代码文件能否用一句话说明责任？同一组状态与行为是否共同维护不变量？一次更改是否经常跨越不相关的行为域？

## 二、拆分决策

按下列顺序判断，第一个能创建稳定边界的层级即可：

1. **纯函数／config**：无 React 状态、副作用或生命周期，且能独立理解的映射、规则、列配置或索引，放在同域的普通模块。
2. **类型／接口**：跨代码文件或跨模块的公开契约抽出；只服务一个函数或组件的私有类型留在使用处。
3. **常量**：具有稳定业务语义、被多处使用或需要独立审查时抽出；单一流程私有常量不为了形式拆档。
4. **parts／组件**：有独立视觉语义、互动责任或稳定 Props 契约时抽出；不要创建只有一次使用的薄 wrapper。
5. **Controller**：以共同维护的不变量与变化原因为边界，整体移动 state、ref、派生值、请求、事件、错误与 cleanup。

禁止按「所有 state」「所有 handler」「所有 JSX」平均切层，也禁止把原组件完整搬进一个返回几十个栏位的总 Controller。

## 三、目录归属与依赖

- `src/domains/<Domain>`：API、mapper、service、entity、enum、validation 与跨页面业务规则。
- `src/views/...`：页面或流程私有的 UI、Controller、config 与 store。
- `src/components/base`：不带业务语义的可复用组件。
- `src/components/business`：跨页面复用且有稳定业务语义的组件。
- `base` 不得依赖 `business`；domain 不得反向依赖 view、component 或 layout。
- Controller 不得 import 兄弟 Controller；跨域流程由共同父层以语义化 callback 编排。
- API DTO 必须在 mapper／service 边界转成前端稳定类型，不直接作为组件 Props。

## 四、高内聚低耦合检查

每次拆分或保留决策都检查：

- 每个模块能用一句话说明责任，且只有一个主要更改原因。
- 同一行为链的触发、状态、请求、成功／失败处理与 cleanup 由同一所有者维护。
- 公开接口只暴露必要状态与意图方法，不暴露临时 ref、内部 cache 或整个父层 Props。
- 兄弟模块不共享可变内部对象；需要协作时提升到共同父层或下沉成无状态模型。
- 拆分后删除旧 wrapper、alias、重复派生与无效导出，不保留双路径。

## 五、PR 审查

触及代码文件长度 warning/error、Controller 边界或业务文档时，PR 应说明：

- 原责任与新责任如何分界。
- 为何保留或拆出该代码文件。
- 是否添加、更新或删除 `BUSINESS.md`，以及 canonical owner。
- 执行的静态检查与尚未验证的执行时风险。
