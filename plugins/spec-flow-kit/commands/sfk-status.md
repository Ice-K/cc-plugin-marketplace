---
description: 查看 spec-flow-kit feature 状态、gate、缺口和下一步
argument-hint: [FEATURE-ID|--all]
---

# /sfk-status

你正在执行 `spec-flow-kit` 的状态查询命令。

## 目标

查看当前或指定 feature 的阶段、gate 状态、traceability 缺口、evidence 可信度、rules 同步状态和下一步建议。

## 输入

用户参数：`$ARGUMENTS`

支持：

```text
/sfk-status
/sfk-status <FEATURE-ID>
/sfk-status --all
```

解析规则：

1. `--all`：列出所有 feature 摘要。
2. `<FEATURE-ID>`：显示指定 feature。
3. 无参数：显示 `state.json` 中的 active feature。
4. 无 active feature：列出可用 feature，并提示 `/sfk-use <FEATURE-ID>`。

## 必须遵守

- 不修改业务代码。
- 不运行 Bash。
- 默认不写入文件；如需记录状态查询，可追加 `runs.jsonl`，但不是必需。
- 输出使用中文。
- 不把 Claude 推断当成 actual evidence。

## 读取文件

- `.spec-flow-kit/state.json`
- `.spec-flow-kit/gates.json`
- `.spec-flow-kit/project-profile.yaml`
- `.spec-flow-kit/rules.yaml`
- `.spec-flow-kit/features/<FEATURE-ID>/status.json`
- `.spec-flow-kit/features/<FEATURE-ID>/traceability.json`
- `.spec-flow-kit/features/<FEATURE-ID>/evidence.jsonl`

## 检查内容

### Feature 状态

- 当前 stage。
- 当前 active feature。
- branch / gitRef 元数据。
- blockers。

### Gate 状态

- pending。
- passed。
- blocked。
- failed。
- waived。

### Traceability 缺口

检查是否存在：

- requirement 没有 design。
- design 没有 task。
- task 没有 code。
- code 没有 test。
- test 没有 evidence。

### Evidence 可信度

区分：

- ✅ actual-command。
- ✅ external-ci。
- 🟡 user-confirmed。
- 🟠 claude-inferred。
- ❌ 缺 evidence。

### Rules 同步状态

检查：

- `rules.yaml` 是否存在。
- `project-profile.yaml` 中 `rules.files` 指向的文件是否存在。
- 是否存在未被 `rules.files` 引用的 `.spec-flow-kit/rules/*.md`。
- 是否可能需要后续运行 `/sfk-rules-sync`。

## 输出示例

```text
Feature: AUTH-LOCK-001
Stage: development_ready
Active: yes

Gates:
  ✅ requirements-ready
  ✅ design-ready
  ✅ plan-ready
  🟡 development-ready: missing test evidence

Traceability:
  REQ-001 ✅ code + test + evidence
  REQ-002 ❌ missing test

Evidence:
  ✅ EV-UNIT-001 actual-command
  🟠 EV-DESIGN-001 claude-inferred

Rules:
  ✅ rules.yaml exists
  🟡 rules.files 可能不同步；后续可运行：/sfk-rules-sync

Next:
  /sfk-verify AUTH-LOCK-001
```
