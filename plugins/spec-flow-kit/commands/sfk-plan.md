---
description: 将设计拆分为任务并初始化 traceability
argument-hint: [FEATURE-ID]
---

# /sfk-plan

你正在执行 `spec-flow-kit` 的任务拆分命令。

## 目标

基于 requirements、design、ADR 和 test-plan，拆分可执行任务，并初始化或更新 traceability。

## 输入

用户参数：`$ARGUMENTS`

Feature 解析顺序：

1. 显式 `<FEATURE-ID>`。
2. `state.json` 中的 `activeFeature`。
3. 如果没有 active feature，提示运行 `/sfk-use <FEATURE-ID>`。

## 前置条件

- `requirements-ready` 为 `passed` 或 `waived`。
- `design-ready` 为 `passed` 或 `waived`。

## 必须遵守

- 默认使用中文编写 Markdown 产物。
- 可以写入对应 `.spec-flow-kit/` 文件。
- 不主动修改业务源码，除非用户明确要求本命令顺带修正，且范围很小。
- 可以在必要时运行只读或低风险命令辅助判断。
- 不默认运行 install、test、build、deploy 等可能耗时、改变环境或产生外部影响的命令。
- 对覆盖、删除、迁移、批量改动等操作保持确认门。
- 不要在最终输出中重复声明权限边界，例如“不修改业务代码”“不运行 Bash”“不会修改文件”，除非：用户明确询问；本次操作因为权限边界被跳过；或需要解释为什么没有执行某个动作。
- 每个任务必须绑定至少一个 requirement。
- 每个任务应绑定相关 design decision。
- 每个任务应声明适用 rules。
- `traceability.md` 给人读，`traceability.json` 给工具读，二者必须保持一致。

## 用户澄清门

在生成或更新 `tasks.md`、`traceability.md`、`traceability.json`、status、gate、evidence 或 runs 之前，必须先判断是否存在用户拥有的未决信息。

用户拥有的未决信息包括但不限于：任务范围、优先级、实施顺序、验收口径、requirement/design 映射、规则适用性、证据要求或完成定义。

如果存在用户拥有的未决信息：

1. 立即停止，不写入任何文件，不更新 gate / status / traceability / evidence / runs。
2. 在 TUI 交互中逐步澄清（Step-by-Step Clarification），保持清爽的一问一答体验，不一次性输出问题清单。
3. 除非答案已经由用户输入、现有 artifacts、项目配置、rules 或源码 100% 明确给出，否则不得猜测。
4. 不在生成的 artifacts 中创建默认“待澄清问题”章节；需要澄清时应在写入前阻塞。

## 运行时规则加载协议

当前阶段：`plan`。

1. 读取 `.spec-flow-kit/rules.yaml`。
2. 选择 `status: active` 且 `appliesTo` 包含 `plan` 的规则。
3. 按 priority、level、enforcement.mode 分组，列出 required / recommended / informational。
4. 从选中规则提取 `source`，规范化为项目相对路径并去重。
5. 每个唯一 `source` 文件最多读取一次。
6. 任务中的“适用 rules”必须引用已选中的规则 ID。
7. 如果 source 缺失，记录为规则加载缺口，并在 plan-ready gate 中标记 blocked。

## 执行步骤

1. 解析目标 feature。
2. 读取：
   - `requirements.md`
   - `design.md`
   - `adr.md`
   - `test-plan.md`
   - `.spec-flow-kit/rules.yaml`
   - 按 `rules.yaml` 过滤出的适用于 `plan` 阶段的唯一 `source` 文件（规范化路径并去重，每个文件最多读取一次）
3. 生成或更新：

```text
.spec-flow-kit/features/<FEATURE-ID>/tasks.md
.spec-flow-kit/features/<FEATURE-ID>/traceability.md
.spec-flow-kit/features/<FEATURE-ID>/traceability.json
```

4. 更新 feature `status.json`。
5. 更新 `gates.json` 中的 `plan-ready`。
6. 如果发现需求没有对应任务，标记为缺口。

## 任务拆分要求

每个任务至少包含：

- Task ID。
- 任务说明。
- 关联 requirement。
- 关联 design decision。
- 适用 rules。
- 预期代码变更。
- 预期测试。
- 所需 evidence。

## 输出要求

```text
任务拆分结果

Feature: <FEATURE-ID>
Gate: plan-ready = passed / blocked

规则加载：
- active applicable rules: N
- required/strict: N
- 已读取规则文件：N
- 缺失 source：N

任务数：N
Traceability: 已初始化 / 已更新

缺口：
- ...

下一步：
- /sfk-development <FEATURE-ID>
```
