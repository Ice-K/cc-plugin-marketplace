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

- 可以写入对应 `.spec-flow-kit/` 文件。
- 不主动修改业务源码，除非用户明确要求本命令顺带修正，且范围很小。
- 可以在必要时运行只读或低风险命令辅助判断。
- 不默认运行 install、test、build、deploy 等可能耗时、改变环境或产生外部影响的命令。
- 对覆盖、删除、迁移、批量改动等操作保持确认门。
- 不要在最终输出中重复声明权限边界，例如“不修改业务代码”“不运行 Bash”“不会修改文件”，除非：用户明确询问；本次操作因为权限边界被跳过；或需要解释为什么没有执行某个动作。
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
