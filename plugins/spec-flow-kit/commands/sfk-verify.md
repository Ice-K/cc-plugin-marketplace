---
description: 验证验收标准并记录 evidence
argument-hint: [FEATURE-ID]
---

# /sfk-verify

你正在执行 `spec-flow-kit` 的验证命令。

## 目标

对照 requirements、design、tasks、test-plan、traceability 和 evidence，验证实现是否满足验收标准，并更新 verification、reports、traceability、status、gate 和 evidence。

## 输入

用户参数：`$ARGUMENTS`

支持：

```text
/sfk-verify
/sfk-verify <FEATURE-ID>
```

Feature 解析顺序：

1. 显式 `<FEATURE-ID>`。
2. `state.json` 中的 `activeFeature`。
3. 如果没有 active feature，提示运行 `/sfk-use <FEATURE-ID>`。

## 前置条件

- `.spec-flow-kit/` 已初始化。
- 目标 feature 存在。
- `requirements-ready` 为 `passed` 或 `waived`。
- `design-ready` 为 `passed` 或 `waived`。
- `plan-ready` 为 `passed` 或 `waived`。
- `development-ready` 为 `passed` 或 `waived`；如果不是，仍可进行诊断，但不能把 `verification-passed` 标记为 `passed`。

## 必须遵守

- 默认使用中文编写 Markdown 产物。
- 可以读取源码、测试、配置和 `.spec-flow-kit/` artifact。
- 默认不做大范围实现改动；验证中发现缺陷时，优先记录失败原因和修复建议。
- 如需小修复，必须与验证结果分开说明，并重新运行相关验证。
- 可以运行 lint、typecheck、test、build，优先使用 `project-profile.yaml` 或项目已有脚本。
- 不运行 install、deploy、release、production、数据迁移或破坏性命令，除非用户明确确认。
- 不伪造 evidence，不把 Claude 推断当成 actual evidence。
- `claude-inferred` 不能作为 `verification-passed` 的唯一依据。
- 如果测试命令、环境或依赖缺失，应标记 `blocked` 或 `partial`，不要标记通过。
- `traceability.json` 中的 status 只能使用：`pending`、`pass`、`partial`、`blocked`、`failed`。
- `evidence.jsonl` 中的 type 只能使用：`actual-command`、`external-ci`、`user-confirmed`、`manual-review`、`claude-inferred`。
- secrets、token、private key、credentials 不得写入 verification、reports、traceability、evidence 或 runs。
- 不要在最终输出中重复声明权限边界，例如“不修改业务代码”“不运行 Bash”“不会修改文件”，除非：用户明确询问；本次操作因为权限边界被跳过；或需要解释为什么没有执行某个动作。

## 用户澄清门

在生成或更新 `verification.md`、reports、traceability、status、gate、evidence 或 runs 之前，必须先判断是否存在用户拥有的未决信息。

用户拥有的未决信息包括但不限于：外部 CI 结果、人工验收结果、用户确认、验证环境、测试命令选择、证据来源可信度、缺口是否可豁免或风险接受。

如果存在用户拥有的未决信息：

1. 立即停止，不写入任何文件，不更新 gate / status / traceability / evidence / runs。
2. 在 TUI 交互中逐步澄清（Step-by-Step Clarification），保持清爽的一问一答体验，不一次性输出问题清单。
3. 除非答案已经由用户输入、现有 artifacts、项目配置、rules、源码或本次真实命令输出 100% 明确给出，否则不得猜测。
4. 不在生成的 artifacts 中创建默认“待澄清问题”章节；需要澄清时应在写入前阻塞。

客观验证失败或真实命令输出已经明确时，可以记录失败结果；不得用用户澄清门掩盖实际失败。

## 读取文件

必须读取：

- `.spec-flow-kit/state.json`
- `.spec-flow-kit/gates.json`
- `.spec-flow-kit/project-profile.yaml`
- `.spec-flow-kit/rules.yaml`
- `.spec-flow-kit/features/<FEATURE-ID>/requirements.md`
- `.spec-flow-kit/features/<FEATURE-ID>/design.md`
- `.spec-flow-kit/features/<FEATURE-ID>/tasks.md`
- `.spec-flow-kit/features/<FEATURE-ID>/test-plan.md`
- `.spec-flow-kit/features/<FEATURE-ID>/verification.md`
- `.spec-flow-kit/features/<FEATURE-ID>/traceability.md`
- `.spec-flow-kit/features/<FEATURE-ID>/traceability.json`
- `.spec-flow-kit/features/<FEATURE-ID>/evidence.jsonl`
- `.spec-flow-kit/features/<FEATURE-ID>/status.json`
- 按 `rules.yaml` 过滤出的适用于 `verification` 阶段的唯一 `source` 文件（规范化路径并去重，每个文件最多读取一次）

按需读取：

- `.spec-flow-kit/features/<FEATURE-ID>/runs.jsonl`
- `.spec-flow-kit/features/<FEATURE-ID>/reports/*.md`
- 相关源码文件和测试文件
- 项目配置文件，例如 package scripts、测试配置、lint/typecheck 配置
- 用户提供的外部 CI 链接或报告

## 运行时规则加载协议

当前阶段：`verification`。

1. 读取 `.spec-flow-kit/rules.yaml`。
2. 选择 `status: active` 且 `appliesTo` 包含 `verification` 的规则。
3. 按 priority、level、enforcement.mode 分组，列出 required / recommended / informational。
4. 从选中规则提取 `source`，规范化为项目相对路径并去重。
5. 每个唯一 `source` 文件最多读取一次。
6. `required + strict` 规则必须读取正文全文，并纳入验证矩阵或规则符合性缺口。
7. 如果 source 缺失，记录为规则加载缺口；影响 required strict 规则时不得把 `verification-passed` 标记为 `passed`。

## 执行步骤

1. 解析目标 feature。
2. 检查前置 gate 和当前 stage。
3. 读取 requirements、design、tasks、test-plan、traceability 和 evidence。
4. 检查 traceability 缺口：
   - requirement 没有 design。
   - design 没有 task。
   - task 没有 code。
   - code 没有 test。
   - test 没有 evidence。
5. 构建验证矩阵。
6. 根据 `project-profile.yaml` 和项目脚本，确定可运行的验证命令：
   - `commands.lint`
   - `commands.typecheck`
   - `commands.unitTest`
   - `commands.build`
   - `commands.e2e`
7. 运行适用且安全的验证命令；如果命令缺失，记录缺口，不要编造命令。
8. 对照验收标准和 test-plan 判断每个 requirement 的结果。
9. 更新：

```text
.spec-flow-kit/features/<FEATURE-ID>/verification.md
.spec-flow-kit/features/<FEATURE-ID>/reports/verification.md
.spec-flow-kit/features/<FEATURE-ID>/traceability.md
.spec-flow-kit/features/<FEATURE-ID>/traceability.json
.spec-flow-kit/features/<FEATURE-ID>/status.json
```

10. 如运行了命令、检查了外部 CI、收到用户确认或完成人工检查，追加 `evidence.jsonl`。
11. 按验证结果更新 `gates.json` 中的 `verification-passed`。
12. 如需要记录本次执行过程，追加 `runs.jsonl`。

## 验证矩阵要求

验证报告必须按 requirement 展示：

| Requirement | Design | Task | Code | Test | Evidence | Method | Result | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| REQ-001 | DD-001 | TASK-001 | path | path | EV-001 | unit test | passed | pass |

Status 只能使用：

- `pending`：尚未验证。
- `pass`：验收标准已被真实 evidence 支撑。
- `partial`：部分覆盖或 evidence 不完整。
- `blocked`：验证无法继续，例如缺少命令、环境、依赖或外部结果。
- `failed`：命令失败或实现不满足验收标准。

## Evidence 记录要求

追加到 `evidence.jsonl` 的每条记录必须包含：

- `id`
- `featureId`
- `stage`
- `type`
- `timestamp`
- `generatedBy`
- `summary`

验证阶段建议：

- `stage`: `verification`
- `generatedBy`: `claude`
- `type`: 根据真实来源选择

Evidence 类型规则：

- `actual-command`：只能用于本次实际运行过的命令；必须记录 `command` 和 `exitCode`。
- `external-ci`：只能用于真实 CI 链接或用户提供的 CI 结果。
- `user-confirmed`：只能用于用户明确确认的结果。
- `manual-review`：用于明确的人工检查记录。
- `claude-inferred`：用于静态分析、覆盖判断或风险提示，不能单独支撑 `verification-passed`。

## Gate 判定规则

`verification-passed` 只能在以下条件全部满足时标记为 `passed`：

- 所有必需验收标准都有对应验证结果。
- traceability 覆盖 requirement、design、task、code、test 和 evidence。
- 必需 lint/typecheck/test/build 或等价外部 CI 已通过。
- evidence 记录符合 schema，并且关键 evidence 不是仅由 `claude-inferred` 构成。
- 没有 critical requirement 处于 `pending`、`partial`、`blocked` 或 `failed`。

必须标记为 `blocked` 的情况：

- 缺少必要测试命令或环境。
- 缺少关键 traceability 信息。
- 缺少关键 evidence。
- 需要用户确认外部系统或手工验收。

必须标记为 `failed` 的情况：

- 本地命令实际运行失败。
- 实现不满足验收标准。
- 发现 critical defect。

## 输出要求

```text
验证结果

Feature: <FEATURE-ID>
Gate: verification-passed = passed / blocked / failed
Stage: verification_passed / verification_blocked / verification_failed

规则加载：
- 阶段：verification
- active applicable rules: N
- required/strict: N
- 已读取规则文件：N
- 已跳过重复 source：N
- 缺失 source：N

Requirement 覆盖：
- REQ-001: pass / partial / blocked / failed

执行命令：
- <command> -> exitCode=<code>

Evidence:
- EV-VERIFY-001 actual-command / external-ci / user-confirmed / manual-review / claude-inferred

Traceability 缺口：
- ...

失败或阻塞项：
- ...

报告：
- verification.md
- reports/verification.md

下一步：
- 如果 failed/blocked：修复问题后重新运行 /sfk-verify <FEATURE-ID>
- 如果 passed：运行 /sfk-status <FEATURE-ID> 查看最终状态
```
