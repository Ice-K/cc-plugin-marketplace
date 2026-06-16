---
description: 推荐 spec-flow-kit 当前 feature 的下一步动作
argument-hint: "[FEATURE-ID|--all]"
---

# /sfk-next

你正在执行 `spec-flow-kit` 的下一步推荐命令。

## 目标

根据当前 feature 的 stage、gate、traceability、evidence、rules 和 blockers，推荐最小、明确、可执行的下一步。

## 输入

用户参数：`$ARGUMENTS`

支持：

```text
/sfk-next
/sfk-next <FEATURE-ID>
/sfk-next --all
```

解析规则：

1. `--all`：为所有 feature 给出摘要级下一步。
2. `<FEATURE-ID>`：分析指定 feature。
3. 无参数：分析 `state.json` 中的 active feature。
4. 无 active feature：列出可用 feature，并提示 `/sfk-use <FEATURE-ID>`。

## 必须遵守

- 不修改业务代码。
- 不运行 Bash。
- 默认不写入文件。
- 输出使用中文。
- 不把 Claude 推断当成 actual evidence。
- 不建议执行 deploy、release、production 或破坏性命令，除非用户已明确要求进入部署规划。

## 读取文件

按需读取：

- `.spec-flow-kit/state.json`
- `.spec-flow-kit/gates.json`
- `.spec-flow-kit/project-profile.yaml`
- `.spec-flow-kit/rules.yaml`
- `.spec-flow-kit/features/<FEATURE-ID>/status.json`
- `.spec-flow-kit/features/<FEATURE-ID>/tasks.md`
- `.spec-flow-kit/features/<FEATURE-ID>/traceability.json`
- `.spec-flow-kit/features/<FEATURE-ID>/evidence.jsonl`
- `.spec-flow-kit/features/<FEATURE-ID>/waivers.json`（如果存在）

## 推荐逻辑

优先级从高到低：

1. 如果 `.spec-flow-kit/` 未初始化：推荐 `/sfk-init`。
2. 如果没有 active feature：推荐 `/sfk-status --all` 和 `/sfk-use <FEATURE-ID>`。
3. 如果 requirements 不 ready：推荐 `/sfk-requirements` 或补充需求。
4. 如果 design 不 ready：推荐 `/sfk-design <FEATURE-ID>`。
5. 如果 plan 不 ready：推荐 `/sfk-plan <FEATURE-ID>`。
6. 如果 development 不 ready：推荐 `/sfk-development <FEATURE-ID>` 或具体未完成 task。
7. 如果 verification 未通过：推荐 `/sfk-verify <FEATURE-ID>` 或运行缺失验证命令。
8. 如果 traceability/evidence/rules 有明显缺口：推荐 `/sfk-audit <FEATURE-ID>` 或 `/sfk-rules-sync --apply`。
9. 如果 feature 已验证通过：推荐归档、交付准备或保持状态（不要自动部署）。

## 输出格式

```text
Feature: <FEATURE-ID>
Stage: <stage>
Recommended next action: <command or action>
Why: <one sentence>

Blocking gaps:
- ...

Optional follow-ups:
- ...
```

`--all` 输出表格：

```text
| Feature | Stage | Blockers | Next |
| --- | --- | --- | --- |
```

只给一个最推荐的下一步；其他内容放入 Optional follow-ups。