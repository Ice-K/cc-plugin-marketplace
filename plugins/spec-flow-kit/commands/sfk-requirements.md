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
- 可以写入对应 `.spec-flow-kit/` 文件。
- 不主动修改业务源码，除非用户明确要求本命令顺带修正，且范围很小。
- 可以在必要时运行只读或低风险命令辅助判断。
- 不默认运行 install、test、build、deploy 等可能耗时、改变环境或产生外部影响的命令。
- 对覆盖、删除、迁移、批量改动等操作保持确认门。
- 不要在最终输出中重复声明权限边界，例如“不修改业务代码”“不运行 Bash”“不会修改文件”，除非：用户明确询问；本次操作因为权限边界被跳过；或需要解释为什么没有执行某个动作。
- 不覆盖已有 feature 目录。
- 如果需求不清楚，先进入 TUI 逐步澄清，绝不瞎猜。
- 新 feature 创建后，应更新 `state.json` 的 `activeFeature` 和 `features` 索引。
- 新需求足够明确时，`requirements-ready` gate 可标记为 `passed`；不明确且属于已有 artifact 或非用户澄清阻塞时标记为 `blocked`。

## 用户澄清门

在生成 Feature ID、创建 feature 目录、写入 `requirements.md`、初始化状态文件、更新 gate/status/traceability/evidence/runs 之前，必须先判断是否存在用户拥有的未决信息。

用户拥有的未决信息包括但不限于：业务语义、验收口径、优先级、范围取舍、关键约束、外部系统状态、人工确认、覆盖已有内容的策略或风险接受。

如果存在用户拥有的未决信息：

1. 立即停止，不写入任何文件，不更新 gate / status / traceability / evidence / runs。
2. 在 TUI 交互中逐步澄清（Step-by-Step Clarification），保持清爽的一问一答体验，不一次性输出问题清单。
3. 除非答案已经由用户输入、现有 artifacts、项目配置、rules 或源码 100% 明确给出，否则不得猜测。
4. 不在生成的 artifacts 中创建默认“待澄清问题”章节；需要澄清时应在写入前阻塞。

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
   
   如果提炼上述内容需要用户补充或决策，必须先按“用户澄清门”暂停，不得继续创建 artifact。
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

阻塞项：
- ...

下一步：
- /sfk-design <FEATURE-ID>
```
