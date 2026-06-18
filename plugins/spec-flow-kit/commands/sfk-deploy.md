---
description: 生成部署 runbook、环境检查和回滚步骤
argument-hint: "[FEATURE-ID] [local|staging|production]"
---

# /sfk-deploy

你正在执行 `spec-flow-kit` 的部署规划命令。

## 目标

为指定 feature 生成部署 runbook、环境检查和回滚步骤。默认只生成文档，不执行部署命令。production 永远默认 runbook 模式。

## 输入

用户参数：`$ARGUMENTS`

支持：

```text
/sfk-deploy
/sfk-deploy <FEATURE-ID>
/sfk-deploy <FEATURE-ID> staging
/sfk-deploy <FEATURE-ID> production
```

Feature 解析顺序：

1. 显式 `<FEATURE-ID>`。
2. `state.json` 中的 `activeFeature`。
3. 如果没有 active feature，提示运行 `/sfk-use <FEATURE-ID>`。

环境解析：

1. 显式 `local`、`staging` 或 `production`。
2. 未指定且用户目标不依赖具体环境时，可使用 `staging` 作为文档模板目标。
3. 如果目标环境会影响 runbook、风险或授权，先按“用户澄清门”逐步澄清，不要静默默认。
4. production 只生成 runbook，不执行命令。

## 必须遵守

- 默认生成交付说明、风险说明、runbook、环境检查和回滚步骤。
- 不真正执行部署、发布、生产变更或数据迁移。
- 如果用户明确要求执行外部动作，应先确认目标环境、命令、回滚方式和风险。
- 不执行 deploy、release、publish、tag、production、数据迁移或破坏性命令，除非用户在当前对话中明确要求执行并确认风险。
- 即使 `project-profile.yaml` 中配置了 deploy 命令，也只写入 runbook，除非用户在当前对话中明确要求执行并确认风险。
- production 部署必须显式确认；没有确认时只输出 runbook。
- 不伪造测试结果、CI 结果、用户确认或命令输出。
- 不把 Claude 推断当成 actual evidence。
- `claude-inferred` 不能作为 delivery-ready 或 deployment-ready 的唯一依据。
- secrets、token、private key、credentials 不得写入交付材料、部署材料、traceability、evidence 或 runs。
- 不要在最终输出中重复声明权限边界，例如“不修改业务代码”“不运行 Bash”“不会修改文件”，除非：用户明确询问；本次操作因为权限边界被跳过；或需要解释为什么没有执行某个动作。

## 用户澄清门

在生成或更新 `deploy-plan.md`、`rollback-plan.md`、status、gate、evidence 或 runs 之前，必须先判断是否存在用户拥有的未决信息。

用户拥有的未决信息包括但不限于：目标环境、production 授权、部署范围、回滚权限、人工确认、Go / No-Go 口径、外部系统状态、配置来源或风险接受。

如果存在用户拥有的未决信息：

1. 立即停止，不写入任何文件，不更新 gate / status / traceability / evidence / runs。
2. 在 TUI 交互中逐步澄清（Step-by-Step Clarification），保持清爽的一问一答体验，不一次性输出问题清单。
3. 除非答案已经由用户输入、现有 artifacts、项目配置、rules、源码或真实 evidence 100% 明确给出，否则不得猜测。
4. 不在生成的 artifacts 中创建默认“待澄清问题”章节；需要澄清时应在写入前阻塞。

## 读取文件

按需读取：

- `.spec-flow-kit/state.json`
- `.spec-flow-kit/gates.json`
- `.spec-flow-kit/project-profile.yaml`
- `.spec-flow-kit/rules.yaml`
- `.spec-flow-kit/features/<FEATURE-ID>/requirements.md`
- `.spec-flow-kit/features/<FEATURE-ID>/verification.md`
- `.spec-flow-kit/features/<FEATURE-ID>/delivery-plan.md`
- `.spec-flow-kit/features/<FEATURE-ID>/rollback-plan.md`
- `.spec-flow-kit/features/<FEATURE-ID>/risk-review.md`
- `.spec-flow-kit/features/<FEATURE-ID>/traceability.json`
- `.spec-flow-kit/features/<FEATURE-ID>/evidence.jsonl`
- `.spec-flow-kit/features/<FEATURE-ID>/status.json`
- `.spec-flow-kit/features/<FEATURE-ID>/waivers.json`（如果存在）
- 按 `rules.yaml` 过滤出的适用于 `deploy` 阶段的唯一 `source` 文件（规范化路径并去重，每个文件最多读取一次）

## 运行时规则加载协议

当前阶段：`deploy`。

1. 读取 `.spec-flow-kit/rules.yaml`。
2. 选择 `status: active` 且 `appliesTo` 包含 `deploy` 的规则。
3. 从选中规则提取 `source`，规范化为项目相对路径并去重。
4. 每个唯一 `source` 文件最多读取一次。
5. `required + strict` 规则必须纳入 deploy-plan.md 的 Go / No-Go 检查清单。
6. 缺失 source 或 strict gate 问题必须写入 Warnings。

## 写入文件

创建或更新：

```text
.spec-flow-kit/features/<FEATURE-ID>/deploy-plan.md
.spec-flow-kit/features/<FEATURE-ID>/rollback-plan.md
```

如果 `rollback-plan.md` 已由 `/sfk-deliver` 生成，应合并部署环境相关内容，不要丢弃已有人工说明。

## Runbook 内容

`deploy-plan.md` 至少包含：

- 目标环境。
- 部署范围。
- 前置 gate 和 verification 状态。
- 需要人工确认的风险。
- 环境变量/配置占位（不得写入真实 secrets）。
- 部署步骤（文档化）。
- 验证步骤。
- 监控/观察点。
- 回滚入口。
- Go / No-Go 检查清单。

`rollback-plan.md` 至少包含：

- 回滚触发条件。
- 回滚步骤。
- 数据/配置回退注意事项。
- 回滚后验证。
- 联系/确认占位。

## 输出要求

```text
Feature: <FEATURE-ID>
Environment: <local|staging|production>
Mode: runbook-only

Generated:
- deploy-plan.md
- rollback-plan.md

Warnings:
- ...

Next:
- 人工确认 runbook
- 如需执行部署，请显式说明环境、命令和确认授权
```

如果 verification 未通过、缺少 rollback plan、存在 blocker 或 strict gate 问题，必须在 Warnings 中列出。