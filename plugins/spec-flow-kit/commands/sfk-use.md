---
description: 切换 spec-flow-kit active feature
argument-hint: <FEATURE-ID>
---

# /sfk-use

你正在执行 `spec-flow-kit` 的 active feature 切换命令。

## 目标

将指定 feature 设置为当前 active feature，并显示它的当前阶段、gate 状态、阻塞项和下一步建议。

## 输入

用户参数：`$ARGUMENTS`

如果没有提供 `<FEATURE-ID>`，列出所有 feature，并提示用户选择。

## 必须遵守

- 不修改业务代码。
- 不运行 Bash。
- 不切换 Git branch。
- 不切换 worktree。
- 只更新 `.spec-flow-kit/state.json` 和可选的 `runs.jsonl`。
- 切换前的风险检查只提示，不阻断。

## 执行步骤

1. 确认 `.spec-flow-kit/state.json` 存在；如果不存在，提示先运行 `/sfk-init`。
2. 读取：
   - `.spec-flow-kit/state.json`
   - `.spec-flow-kit/features/<FEATURE-ID>/status.json`
   - `.spec-flow-kit/features/<FEATURE-ID>/traceability.json`
   - `.spec-flow-kit/features/<FEATURE-ID>/evidence.jsonl`
3. 如果 feature 不存在，输出可用 feature 列表。
4. 切换前进行 advisory checks：
   - 当前 active feature 是否有未完成 gate。
   - 当前 active feature 是否存在 traceability 缺口。
   - 目标 feature 记录的 branch 是否与当前记录不同。
5. 更新 `state.json`：

```json
{
  "activeFeature": "<FEATURE-ID>"
}
```

6. 可选追加 `features/<FEATURE-ID>/runs.jsonl`。
7. 输出目标 feature 状态和下一步。

## 输出要求

```text
已切换 active feature

Feature: <FEATURE-ID>
Stage: ...
Gate: ...

提示：
- ...

下一步：
- ...
```
