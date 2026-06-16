---
description: 审计 traceability、evidence、rules、gate 和 waiver 缺口
argument-hint: "[FEATURE-ID] [--strict]"
---

# /sfk-audit

你正在执行 `spec-flow-kit` 的审计命令。

## 目标

对当前或指定 feature 执行只读审计，检查 requirements、design、tasks、traceability、evidence、rules、gates 和 waivers 是否一致，并输出可执行的修复建议。

## 输入

用户参数：`$ARGUMENTS`

支持：

```text
/sfk-audit
/sfk-audit <FEATURE-ID>
/sfk-audit <FEATURE-ID> --strict
```

Feature 解析顺序：

1. 显式 `<FEATURE-ID>`。
2. `state.json` 中的 `activeFeature`。
3. 如果没有 active feature，提示运行 `/sfk-use <FEATURE-ID>` 或 `/sfk-status --all`。

`--strict` 只改变审计口径：严格列出会阻塞 strict gate 的问题；不要自动启用 strict mode。

## 必须遵守

- 默认只读，不修改业务代码和 `.spec-flow-kit/` 文件。
- 不运行 Bash。
- 输出使用中文。
- 不把 Claude 推断当成 actual evidence。
- 不伪造测试结果、CI 结果、用户确认或命令输出。
- 不读取或输出 secrets、token、password、private key、credentials。
- 不自动创建、删除或接受 waiver；只能提示需要 waiver 或需要修复。

## 读取文件

必须按需读取：

- `.spec-flow-kit/state.json`
- `.spec-flow-kit/gates.json`
- `.spec-flow-kit/project-profile.yaml`
- `.spec-flow-kit/rules.yaml`
- `.spec-flow-kit/features/<FEATURE-ID>/requirements.md`
- `.spec-flow-kit/features/<FEATURE-ID>/design.md`
- `.spec-flow-kit/features/<FEATURE-ID>/adr.md`
- `.spec-flow-kit/features/<FEATURE-ID>/tasks.md`
- `.spec-flow-kit/features/<FEATURE-ID>/test-plan.md`
- `.spec-flow-kit/features/<FEATURE-ID>/verification.md`
- `.spec-flow-kit/features/<FEATURE-ID>/traceability.md`
- `.spec-flow-kit/features/<FEATURE-ID>/traceability.json`
- `.spec-flow-kit/features/<FEATURE-ID>/evidence.jsonl`
- `.spec-flow-kit/features/<FEATURE-ID>/status.json`
- `.spec-flow-kit/features/<FEATURE-ID>/waivers.json`（如果存在）
- `project-profile.yaml` 中相关 `rules.files`

## 审计内容

### 1. Artifact 完整性

检查 feature 必需文件是否存在、是否明显为空、是否仍是模板占位内容。

### 2. Traceability

检查：

- requirement 是否有 design。
- design 是否有 task。
- task 是否有关联 code/test（如果已经 development-ready）。
- test 是否有 evidence。
- `traceability.md` 与 `traceability.json` 是否冲突。

### 3. Evidence 可信度

区分：

- `actual-command`
- `external-ci`
- `user-confirmed`
- `manual-review`
- `claude-inferred`

`claude-inferred` 只能作为提示，不能满足需要真实验证的验收标准。

### 4. Gate 与 waiver

检查：

- gate status 是否和 artifact/evidence 状态一致。
- `waived` gate 是否有 waiver 记录支持。
- waiver 是否包含原因、范围、批准信息或过期/复查条件。
- strict mode 下哪些问题会阻塞。

### 5. Rules 合规

检查：

- `rules.yaml` 是否存在并可解析。
- `project-profile.yaml` 的 `rules.files` 是否指向存在文件。
- feature artifact 是否明显违反 active/required rules。
- 是否需要运行 `/sfk-rules-sync`。

## 输出格式

```text
Feature: <FEATURE-ID>
Audit Mode: advisory / strict-check
Overall: pass / partial / blocked / failed

Findings:
- [severity] [area] 描述
  Evidence: 文件或记录
  Required action: ...

Traceability:
- ...

Evidence:
- ...

Rules:
- ...

Waivers:
- ...

Next:
- /sfk-next <FEATURE-ID>
```

Severity 使用：

- `blocker`：strict mode 下应阻塞。
- `warning`：advisory 提醒。
- `info`：状态说明。

如果没有发现问题，明确输出 `Overall: pass`，并说明审计仅基于已读取的本地 artifacts。