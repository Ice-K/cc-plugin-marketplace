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
2. 未指定时使用 `staging` 作为文档模板目标。
3. production 只生成 runbook，不执行命令。

## 必须遵守

- 默认不执行部署、发布、打 tag、生产变更、数据迁移或破坏性命令。
- 即使 `project-profile.yaml` 中配置了 deploy 命令，也只写入 runbook，除非用户在当前对话中明确要求执行并确认风险。
- production 部署必须显式确认；没有确认时只输出 runbook。
- 不伪造测试结果、CI 结果、用户确认或命令输出。
- 不把 Claude 推断当成 actual evidence。
- 不输出 secrets、token、password、private key、credentials。
- 默认使用中文编写 Markdown 产物。

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