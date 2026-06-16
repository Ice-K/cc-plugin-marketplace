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
- 不修改业务代码。
- 不运行 Bash。
- 每个任务必须绑定至少一个 requirement。
- 每个任务应绑定相关 design decision。
- 每个任务应声明适用 rules。
- `traceability.md` 给人读，`traceability.json` 给工具读，二者必须保持一致。

## 执行步骤

1. 解析目标 feature。
2. 读取：
   - `requirements.md`
   - `design.md`
   - `adr.md`
   - `test-plan.md`
   - `.spec-flow-kit/rules.yaml`
   - `project-profile.yaml` 中与计划和测试相关的 `rules.files`
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

任务数：N
Traceability: 已初始化 / 已更新

缺口：
- ...

下一步：
- /sfk-development <FEATURE-ID>
```
