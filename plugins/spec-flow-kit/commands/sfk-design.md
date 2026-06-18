---
description: 基于需求创建系统设计、ADR 和测试计划
argument-hint: [FEATURE-ID]
---

# /sfk-design

你正在执行 `spec-flow-kit` 的设计命令。

## 目标

基于 feature requirements、项目上下文和 rules，生成设计文档、ADR 和测试计划。

## 输入

用户参数：`$ARGUMENTS`

Feature 解析顺序：

1. 如果用户显式传入 `<FEATURE-ID>`，使用该 feature。
2. 否则使用 `.spec-flow-kit/state.json` 中的 `activeFeature`。
3. 如果没有 active feature，提示运行 `/sfk-use <FEATURE-ID>`。

## 前置条件

- `.spec-flow-kit/` 已初始化。
- 目标 feature 存在。
- `requirements-ready` 为 `passed` 或 `waived`；如果不是，说明阻塞原因。

## 必须遵守

- 默认使用中文编写 Markdown 产物。
- 不修改业务代码。
- 默认不运行 Bash。
- 不覆盖用户已手动修改的设计文档；如果文件已存在，先读取并增量更新或询问用户。
- 设计必须覆盖 requirements 中的验收标准、边界情况、风险和非功能需求。
- 必须按“运行时规则加载协议”读取适用于 `design` 阶段的规则；`rules.yaml` 是运行时主入口，`project-profile.yaml.rules.files` 只用于同步检查和兜底诊断。

## 用户澄清门

在生成或更新 `design.md`、`adr.md`、`test-plan.md`、status、gate、evidence 或 runs 之前，必须先判断是否存在用户拥有的未决信息。

用户拥有的未决信息包括但不限于：架构取舍、接口契约、数据模型、错误处理口径、安全策略、测试策略、发布/回滚边界、规则缺口处理方式或风险接受。

如果存在用户拥有的未决信息：

1. 立即停止，不写入任何文件，不更新 gate / status / traceability / evidence / runs。
2. 在 TUI 交互中逐步澄清（Step-by-Step Clarification），保持清爽的一问一答体验，不一次性输出问题清单。
3. 除非答案已经由用户输入、现有 artifacts、项目配置、rules 或源码 100% 明确给出，否则不得猜测。
4. 不在生成的 artifacts 中创建默认“待澄清问题”章节；需要澄清时应在写入前阻塞。

## 运行时规则加载协议

当前阶段：`design`。

1. 读取 `.spec-flow-kit/rules.yaml`。
2. 选择 `status: active` 且 `appliesTo` 包含 `design` 的规则。
3. 按 priority、level、enforcement.mode 分组，列出 required / recommended / informational。
4. 从选中规则提取 `source`，规范化为项目相对路径并去重。
5. 每个唯一 `source` 文件最多读取一次。
6. `required + strict` 规则必须读取正文全文；recommended / informational 可读取摘要或相关段落。
7. 如果 source 缺失，记录为规则加载缺口，并在设计阻塞项中说明。

## 执行步骤

1. 解析目标 feature。
2. 读取：
   - `.spec-flow-kit/state.json`
   - `.spec-flow-kit/gates.json`
   - `.spec-flow-kit/project-profile.yaml`
   - `.spec-flow-kit/rules.yaml`
   - `.spec-flow-kit/features/<FEATURE-ID>/requirements.md`
   - 按 `rules.yaml` 过滤出的适用于 `design` 阶段的唯一 `source` 文件（规范化路径并去重，每个文件最多读取一次）
3. 只读分析相关源码结构和项目配置。
4. 生成或更新：

```text
.spec-flow-kit/features/<FEATURE-ID>/design.md
.spec-flow-kit/features/<FEATURE-ID>/adr.md
.spec-flow-kit/features/<FEATURE-ID>/test-plan.md
```

5. 更新 feature `status.json`。
6. 更新 `gates.json` 中的 `design-ready`：
   - 设计完整时标记 `passed`。
   - 缺少关键设计时标记 `blocked`，并写明 requiredActions。
7. 追加 evidence，类型通常为 `claude-inferred`，除非用户明确确认。

## 设计内容必须包含

- 当前系统上下文。
- 设计方案。
- 接口和契约。
- 数据模型变化。
- 错误处理。
- 安全和隐私影响。
- 可观测性。
- 备选方案。
- 发布和回滚说明。

## 输出要求

```text
设计结果

Feature: <FEATURE-ID>
Gate: design-ready = passed / blocked

规则加载：
- active applicable rules: N
- required/strict: N
- 已读取规则文件：N
- 缺失 source：N

已生成或更新：
- design.md
- adr.md
- test-plan.md

阻塞项：
- ...

下一步：
- /sfk-plan <FEATURE-ID>
```
