---
description: 按任务实现代码和测试并更新 traceability
argument-hint: "[FEATURE-ID] [--task TASK-ID]"
---

# /sfk-development

你正在执行 `spec-flow-kit` 的开发实现命令。

## 目标

基于 requirements、design、ADR、test-plan 和 tasks，按任务实现代码和测试，并维护 traceability、status、gate 和 evidence。

## 输入

用户参数：`$ARGUMENTS`

支持：

```text
/sfk-development
/sfk-development <FEATURE-ID>
/sfk-development <FEATURE-ID> --task TASK-003
/sfk-development --task TASK-003
```

Feature 解析顺序：

1. 显式 `<FEATURE-ID>`。
2. `state.json` 中的 `activeFeature`。
3. 如果没有 active feature，提示运行 `/sfk-use <FEATURE-ID>`。

Task 解析规则：

1. 如果传入 `--task TASK-ID`，只处理该任务。
2. 如果未传入 task，优先处理 `tasks.md` 中未完成或阻塞解除后的任务。
3. 如果任务范围不清晰，先说明可选任务并请求用户确认。

## 前置条件

- `.spec-flow-kit/` 已初始化。
- 目标 feature 存在。
- `requirements-ready` 为 `passed` 或 `waived`。
- `design-ready` 为 `passed` 或 `waived`。
- `plan-ready` 为 `passed` 或 `waived`。

如果前置条件不满足，不要修改业务代码；输出阻塞原因和需要先运行的命令。

## 必须遵守

- 默认使用中文编写 Markdown 产物。
- 可以修改业务代码和测试代码，但必须限制在目标 feature 和选定 task 范围内。
- 不执行 install、deploy、release、production、数据迁移或破坏性命令，除非用户显式确认。
- 运行本地 lint、typecheck、test 或 build 前，优先使用 `project-profile.yaml` 中已配置的命令或项目已有脚本。
- 不把 Claude 推断当成 actual evidence。
- 不伪造测试结果、CI 结果、用户确认或命令输出。
- 不设置 `verification-passed`；验证阶段由 `/sfk-verify` 负责。
- `traceability.md` 给人读，`traceability.json` 给工具读，二者必须保持一致。
- `traceability.json` 中的 status 只能使用：`pending`、`pass`、`partial`、`blocked`、`failed`。
- `evidence.jsonl` 中的 type 只能使用：`actual-command`、`external-ci`、`user-confirmed`、`manual-review`、`claude-inferred`。
- secrets、token、private key、credentials 不得写入 traceability、evidence、runs 或报告。

## 读取文件

必须读取：

- `.spec-flow-kit/state.json`
- `.spec-flow-kit/gates.json`
- `.spec-flow-kit/project-profile.yaml`
- `.spec-flow-kit/rules.yaml`
- `.spec-flow-kit/features/<FEATURE-ID>/requirements.md`
- `.spec-flow-kit/features/<FEATURE-ID>/design.md`
- `.spec-flow-kit/features/<FEATURE-ID>/adr.md`
- `.spec-flow-kit/features/<FEATURE-ID>/tasks.md`
- `.spec-flow-kit/features/<FEATURE-ID>/test-plan.md`
- `.spec-flow-kit/features/<FEATURE-ID>/traceability.md`
- `.spec-flow-kit/features/<FEATURE-ID>/traceability.json`
- `.spec-flow-kit/features/<FEATURE-ID>/status.json`
- 按 `rules.yaml` 过滤出的适用于 `development` 阶段的唯一 `source` 文件（规范化路径并去重，每个文件最多读取一次）

按需读取：

- `.spec-flow-kit/features/<FEATURE-ID>/evidence.jsonl`
- `.spec-flow-kit/features/<FEATURE-ID>/runs.jsonl`
- 相关源码文件和测试文件
- 项目配置文件，例如 package scripts、测试配置、lint/typecheck 配置

## 运行时规则加载协议

当前阶段：`development`。

1. 读取 `.spec-flow-kit/rules.yaml`。
2. 选择 `status: active` 且 `appliesTo` 包含 `development` 的规则。
3. 按 priority、level、enforcement.mode 分组，列出 required / recommended / informational。
4. 从选中规则提取 `source`，规范化为项目相对路径并去重。
5. 每个唯一 `source` 文件最多读取一次；同一个 source 被多条规则引用时不得重复读取。
6. `required + strict` 规则必须读取正文全文，并作为代码实现约束。
7. recommended 规则作为实现建议；informational 规则作为上下文。
8. 如果 source 缺失，记录为规则加载缺口；strict required 规则缺失时不得继续修改业务代码，除非用户明确确认继续。
9. 实施前必须输出或内部整理本轮“适用规则清单”，包含 rule ID、level、enforcement.mode、source。

## 执行步骤

1. 解析目标 feature 和 task 范围。
2. 检查前置 gate：
   - `requirements-ready`
   - `design-ready`
   - `plan-ready`
3. 读取目标 feature 的 requirements、design、ADR、tasks、test-plan 和 traceability。
4. 按运行时规则加载协议读取适用 rules，列出会影响实现的 required / recommended / informational rules，并记录去重后的 source 文件列表。
5. 对每个选定 task：
   - 确认关联 requirement ID。
   - 确认关联 design ID 或 ADR。
   - 确认预期代码变更。
   - 确认预期测试变更。
   - 只读分析相关源码和测试。
   - 实施最小必要代码变更。
   - 添加或更新对应测试。
   - 如适合，运行聚焦的本地检查。
6. 更新 traceability：

```text
.spec-flow-kit/features/<FEATURE-ID>/traceability.md
.spec-flow-kit/features/<FEATURE-ID>/traceability.json
```

7. 更新 feature `status.json`：
   - stage 通常更新为 `development_in_progress` 或 `development_ready`。
   - blockers 必须反映未完成 task、缺失测试、缺失证据或外部阻塞。
8. 更新 `gates.json` 中的 `development-ready`：
   - 实现和测试路径已建立时标记 `passed`。
   - 存在阻塞时标记 `blocked`，并写明 `requiredActions`。
   - 检查实际失败时标记 `failed`。
9. 如运行了命令或形成了有价值的开发证据，追加 `evidence.jsonl`。
10. 如需要记录本次执行过程，追加 `runs.jsonl`。

## Traceability 更新要求

`traceability.json` 必须保持如下结构语义：

- 顶层包含 `featureId`、`version`、`links`。
- 每个 link 包含：
  - `requirementId`
  - `designIds`
  - `taskIds`
  - `code`
  - `tests`
  - `evidence`
  - `status`

开发阶段 status 建议：

- `pending`：尚未实现。
- `partial`：已有代码或测试，但未充分验证。
- `pass`：该 link 的实现和聚焦检查都已通过，并且 evidence 已记录。
- `blocked`：缺少需求、设计、依赖、权限、环境或用户决策。
- `failed`：实现或本地检查失败。

不要使用 `done`、`implemented`、`ok`、`verified` 等非 schema 状态。

## Evidence 记录要求

追加到 `evidence.jsonl` 的每条记录必须包含：

- `id`
- `featureId`
- `stage`
- `type`
- `timestamp`
- `generatedBy`
- `summary`

开发阶段建议：

- `stage`: `development`
- `generatedBy`: `claude`
- `type`: 根据真实来源选择

Evidence 类型规则：

- `actual-command`：只能用于本次实际运行过的命令；必须记录 `command` 和 `exitCode`。
- `external-ci`：只能用于真实 CI 链接或用户提供的 CI 结果。
- `user-confirmed`：只能用于用户明确确认的结果。
- `manual-review`：用于明确的人工检查记录。
- `claude-inferred`：用于静态分析或实现总结，不能等同于测试通过。

## 输出要求

```text
开发实现结果

Feature: <FEATURE-ID>
Gate: development-ready = passed / blocked / failed
Stage: development_in_progress / development_ready

规则加载：
- 阶段：development
- active applicable rules: N
- required/strict: N
- recommended: N
- informational: N
- 已读取规则文件：
  - .spec-flow-kit/rules/development-process.md
- 已跳过重复 source：N
- 缺失 source：N

处理任务：
- TASK-001: passed / partial / blocked / failed

代码变更：
- ...

测试变更：
- ...

执行命令：
- <command> -> exitCode=<code>

Traceability:
- REQ-001: pending / pass / partial / blocked / failed

Evidence:
- EV-DEV-001 actual-command / claude-inferred / ...

阻塞项：
- ...

下一步：
- /sfk-verify <FEATURE-ID>
```
