---
description: 生成 feature 交付准备材料和风险说明
argument-hint: "[FEATURE-ID]"
---

# /sfk-deliver

你正在执行 `spec-flow-kit` 的交付准备命令。

## 目标

基于已完成或接近完成的 feature artifacts，生成交付准备材料：release notes、delivery plan、rollback plan 和 risk review。此命令只生成交付文档，不执行发布、部署或生产操作。

## 输入

用户参数：`$ARGUMENTS`

支持：

```text
/sfk-deliver
/sfk-deliver <FEATURE-ID>
```

Feature 解析顺序：

1. 显式 `<FEATURE-ID>`。
2. `state.json` 中的 `activeFeature`。
3. 如果没有 active feature，提示运行 `/sfk-use <FEATURE-ID>`。

## 前置条件

建议满足：

- `requirements-ready` 为 `passed` 或 `waived`。
- `design-ready` 为 `passed` 或 `waived`。
- `plan-ready` 为 `passed` 或 `waived`。
- `development-ready` 为 `passed` 或 `waived`。
- `verification-passed` 最好为 `passed`；如果不是，交付材料必须明确标注验证缺口。

## 必须遵守

- 不执行 deploy、release、publish、tag、production、数据迁移或破坏性命令。
- 不伪造测试结果、CI 结果、用户确认或命令输出。
- 不把 Claude 推断当成 actual evidence。
- 不输出 secrets、token、password、private key、credentials。
- 默认使用中文编写 Markdown 产物。
- 如果验证缺口存在，必须在 risk review 和 delivery plan 中明确标记。

## 用户澄清门

在生成或更新 release notes、delivery plan、rollback plan、risk review、status、gate、evidence 或 runs 之前，必须先判断是否存在用户拥有的未决信息。

用户拥有的未决信息包括但不限于：交付范围、发布目标、目标读者、负责人/审批人、Go / No-Go 口径、已知限制、回滚责任、外部确认或风险接受。

如果存在用户拥有的未决信息：

1. 立即停止，不写入任何文件，不更新 gate / status / traceability / evidence / runs。
2. 在 TUI 交互中逐步澄清（Step-by-Step Clarification），保持清爽的一问一答体验，不一次性输出问题清单。
3. 除非答案已经由用户输入、现有 artifacts、项目配置、rules、源码或真实 evidence 100% 明确给出，否则不得猜测。
4. 不在生成的 artifacts 中创建默认“待澄清问题”章节；需要澄清时应在写入前阻塞。

客观 verification 缺口可以写入风险材料；但如果缺口处理方式本身需要用户决策，必须先逐步澄清。

## 读取文件

按需读取：

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
- `.spec-flow-kit/features/<FEATURE-ID>/traceability.json`
- `.spec-flow-kit/features/<FEATURE-ID>/evidence.jsonl`
- `.spec-flow-kit/features/<FEATURE-ID>/status.json`
- `.spec-flow-kit/features/<FEATURE-ID>/waivers.json`（如果存在）
- 按 `rules.yaml` 过滤出的适用于 `delivery` 阶段的唯一 `source` 文件（规范化路径并去重，每个文件最多读取一次）

## 运行时规则加载协议

当前阶段：`delivery`。

1. 读取 `.spec-flow-kit/rules.yaml`。
2. 选择 `status: active` 且 `appliesTo` 包含 `delivery` 的规则。
3. 从选中规则提取 `source`，规范化为项目相对路径并去重。
4. 每个唯一 `source` 文件最多读取一次。
5. `required + strict` 规则必须纳入 risk review 的 Go / No-Go 或风险缺口。
6. 缺失 source 必须写入 risk-review.md。

## 写入文件

创建或更新：

```text
.spec-flow-kit/features/<FEATURE-ID>/release-notes.md
.spec-flow-kit/features/<FEATURE-ID>/delivery-plan.md
.spec-flow-kit/features/<FEATURE-ID>/rollback-plan.md
.spec-flow-kit/features/<FEATURE-ID>/risk-review.md
```

如果文件已存在，不要盲目覆盖用户手写内容；先读取并保留有价值的手写部分，或在输出中说明需要人工合并。

## 文档要求

### release-notes.md

包含：

- Feature 摘要。
- 用户可见变化。
- 非目标。
- 兼容性影响。
- 验证摘要。
- 已知限制。

### delivery-plan.md

包含：

- 交付范围。
- 前置检查。
- 验证要求。
- 交付步骤（文档化，不执行）。
- 负责人/确认项占位。
- Go / No-Go 条件。

### rollback-plan.md

包含：

- 回滚触发条件。
- 回滚策略。
- 数据或配置影响。
- 验证回滚成功的方法。
- 需要人工确认的步骤。

### risk-review.md

包含：

- 功能风险。
- 测试风险。
- 安全/隐私风险。
- 运维/发布风险。
- 未关闭 traceability/evidence/rule/waiver 缺口。

## 状态更新

如果交付材料生成成功，可在 `status.json` 中把 `nextAction` 设置为：

```text
/sfk-deploy <FEATURE-ID>
```

不要把任何 deploy gate 标记为 passed；部署准备由 `/sfk-deploy` 生成 runbook。