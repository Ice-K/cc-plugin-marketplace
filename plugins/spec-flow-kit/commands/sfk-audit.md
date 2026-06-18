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
- 按 `rules.yaml` 过滤出的适用于 `audit` 阶段的唯一 `source` 文件（规范化路径并去重，每个文件最多读取一次）

## 运行时规则加载协议

当前阶段：`audit`。

1. 读取 `.spec-flow-kit/rules.yaml`。
2. 选择 `status: active` 且 `appliesTo` 包含 `audit` 的规则。
3. 按 priority、level、enforcement.mode 分组，列出 required / recommended / informational。
4. 从选中规则提取 `source`，规范化为项目相对路径并去重。
5. 每个唯一 `source` 文件最多读取一次。
6. 审计时同时检查 `project-profile.yaml.rules.files` 与 `rules.yaml.rules[].source` 是否一致，但不要把 `rules.files` 作为主加载入口。
7. 缺失 source、重复 source、未索引规则文件和失效 rules.files 都应作为 audit finding 输出。

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
- active 且适用于 `audit` 的规则是否能按 source 成功加载。
- `rules.yaml.rules[].source` 是否存在重复、缺失或路径不规范。
- `project-profile.yaml.rules.files` 是否与实际 `.spec-flow-kit/rules/*.md` 和 `rules.yaml.rules[].source` 一致。
- feature artifact 是否明显违反 active/required/strict rules。
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
- active applicable rules: N
- required/strict: N
- loaded sources: N
- duplicate sources skipped: N
- missing sources: N

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