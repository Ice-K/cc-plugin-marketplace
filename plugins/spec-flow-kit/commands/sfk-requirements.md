---
description: 从自然语言需求创建 feature requirements
argument-hint: "<需求描述>"
---

# /sfk-requirements

你正在执行 `spec-flow-kit` 的需求分析命令。

## 目标

从用户的自然语言需求创建一个新的 feature 工作区，生成 `requirements.md`，初始化 feature 状态，并默认将该 feature 设置为 active feature。

## 输入

用户参数：`$ARGUMENTS`

如果参数为空，先询问用户要实现或变更的需求，不要直接生成空 feature。

## 必须遵守

- 默认使用中文编写 Markdown 产物。
- 不修改业务代码。
- 不运行 Bash。
- 不覆盖已有 feature 目录。
- 如果需求不清楚，先提出澄清问题，绝不瞎猜。
- 新 feature 创建后，应更新 `state.json` 的 `activeFeature` 和 `features` 索引。
- 新需求足够明确时，`requirements-ready` gate 可标记为 `passed`；不明确时标记为 `blocked`。

## Feature ID 规则

根据需求生成稳定、可读的 feature ID：

```text
<DOMAIN>-<SHORT-NAME>-<NNN>
```

示例：

```text
AUTH-LOCK-001
PAYMENT-REFUND-001
PROFILE-AVATAR-001
```

如果无法判断领域，使用：

```text
FEATURE-<SHORT-NAME>-001
```

## 执行步骤

1. 确认 `.spec-flow-kit/` 已存在；如果不存在，提示先运行 `/sfk-init`。
2. 读取：
   - `.spec-flow-kit/state.json`
   - `.spec-flow-kit/project-profile.yaml`
   - `.spec-flow-kit/rules.yaml`
3. 分析用户需求，提炼：
   - 摘要。
   - 目标。
   - 非目标。
   - 用户故事。
   - 功能需求。
   - 非功能需求。
   - 验收标准。
   - 边界情况。
   - 风险和假设。
   - 待澄清问题。
4. 创建：

```text
.spec-flow-kit/features/<FEATURE-ID>/
  requirements.md
  status.json
  traceability.md
  traceability.json
  evidence.jsonl
  runs.jsonl
  reports/
```

5. 更新 `.spec-flow-kit/state.json`：
   - `activeFeature` 设置为新 feature。
   - `features.<FEATURE-ID>` 增加索引。
6. 更新 `.spec-flow-kit/gates.json` 中的 `requirements-ready`。
7. 追加一条 evidence：
   - 类型为 `claude-inferred` 或 `user-confirmed`，取决于是否经过用户确认。

## 输出要求

最后输出中文摘要：

```text
需求分析结果

Feature: <FEATURE-ID>
状态: requirements_ready / blocked

已生成：
- requirements.md
- status.json
- traceability.json

待澄清：
- ...

下一步：
- /sfk-design <FEATURE-ID>
```
