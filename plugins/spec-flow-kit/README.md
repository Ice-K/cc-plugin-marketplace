# spec-flow-kit

Claude Code 的本地规范驱动交付治理插件。

## 状态

实验性 / 开发中。本插件目前包含 manifest、实施方案、MVP templates、schemas、完整 MVP slash command prompt flow、MVP agents、MVP skills、可选提示型 hooks，以及可选本地 MCP 状态服务。

当前实施方案见：[`docs/spec-flow-kit-插件方案.md`](docs/spec-flow-kit-%E6%8F%92%E4%BB%B6%E6%96%B9%E6%A1%88.md)。

## 愿景

`spec-flow-kit` 旨在帮助 Claude Code 从临时代码助手，演进为可追踪、证据化的软件交付协作者。

长期目标包括：

- 支持规范驱动的 feature 工作流。
- 生成并维护需求、设计、任务和验证产物。
- 建立从需求到代码、测试和 evidence 的追踪关系。
- 提供提示型质量 gate，并在后续支持严格 gate。
- 支持项目自定义规则治理。
- 生成本地验证报告和审计记录。

第一版会保持收敛：通过 slash commands 和 `.spec-flow-kit/` 本地文件协议，提供轻量 SDD 工作区。

## 计划命令命名

插件采用“短命令输入 + 插件归属显示”的命名方式。

| 用户输入 | 插件归属显示 | 用途 |
| --- | --- | --- |
| `/sfk-init` | `/spec-flow-kit:sfk-init` | 初始化 `.spec-flow-kit/` 工作区 |
| `/sfk-requirements` | `/spec-flow-kit:sfk-requirements` | 从自然语言需求创建 feature requirements，并默认激活该 feature |
| `/sfk-use` | `/spec-flow-kit:sfk-use` | 切换 active feature |
| `/sfk-design` | `/spec-flow-kit:sfk-design` | 创建设计、ADR 和测试计划 |
| `/sfk-plan` | `/spec-flow-kit:sfk-plan` | 拆分任务并初始化 traceability |
| `/sfk-development` | `/spec-flow-kit:sfk-development` | 实现任务并更新 traceability |
| `/sfk-verify` | `/spec-flow-kit:sfk-verify` | 验证验收标准并记录 evidence |
| `/sfk-rules-sync` | `/spec-flow-kit:sfk-rules-sync` | 同步规则索引和规则文件列表 |
| `/sfk-audit` | `/spec-flow-kit:sfk-audit` | 审计 traceability、evidence、rules、gate 和 waiver 缺口 |
| `/sfk-next` | `/spec-flow-kit:sfk-next` | 推荐当前 feature 的下一步动作 |
| `/sfk-deliver` | `/spec-flow-kit:sfk-deliver` | 生成交付准备材料、release notes、风险说明和回滚计划 |
| `/sfk-deploy` | `/spec-flow-kit:sfk-deploy` | 生成部署 runbook、环境检查和回滚步骤 |
| `/sfk-status` | `/spec-flow-kit:sfk-status` | 查看当前 feature 状态、gate、缺口和下一步 |

后续可选增加本地 MCP 状态服务和企业级治理集成。

## 计划生成的本地工作区

MVP 会生成并维护如下文件：

```text
.spec-flow-kit/
├── flow.yaml
├── state.json
├── gates.json
├── project-profile.yaml
├── rules.yaml
├── rules/
│   ├── engineering-structure.md
│   ├── development-process.md
│   ├── coding-style.md
│   └── testing-rules.md
└── features/
    └── <FEATURE-ID>/
        ├── requirements.md
        ├── design.md
        ├── adr.md
        ├── tasks.md
        ├── test-plan.md
        ├── verification.md
        ├── traceability.md
        ├── traceability.json
        ├── evidence.jsonl
        ├── waivers.json
        ├── status.json
        ├── runs.jsonl
        └── reports/
```

Markdown 文件面向人阅读，默认使用中文。JSON / JSONL / YAML 文件面向工具、gate、状态检查、traceability 和 evidence 验证，字段名保持英文。YAML 模板使用中文注释说明配置含义；JSON 模板使用 `_comment` 或 `*Comment` 字段提供中文说明。

## 澄清优先策略

所有会创建、更新、追加或补齐正式 artifact 的命令都必须先判断是否存在用户拥有的未决信息。如果继续执行需要业务语义、验收口径、范围取舍、外部系统状态、人工确认、覆盖策略、规则升级/降级意图、部署授权或风险接受，命令应在写入前暂停，并在 TUI 交互中逐步澄清（Step-by-Step Clarification）。

澄清期间不得写入 `requirements.md`、`design.md`、`tasks.md`、traceability、status、gates、evidence 或 runs，也不得用默认“待澄清问题”章节代替对话澄清。正式 Markdown artifact 应只记录已经足够明确、可进入下一阶段的信息。

## 安全边界

计划默认策略保持保守：

- 默认不执行部署命令。
- 内置规则模板默认使用 `required / active / strict`，用于提供明确的 SDD 约束。
- 自动发现的新规则候选默认使用 `recommended / proposed / advisory`，用户确认后才升级为 active 或 strict。
- hooks 引入时默认先作为提示型检查；strict gate 脚本已提供，但是否阻断取决于用户配置和当前 gate/rule 状态。
- Verification evidence 必须区分真实命令输出和 Claude 推断。
- secrets、token、private key、credentials 不应写入 reports 或 evidence 文件。
- 如果未来支持生产部署，默认只生成 runbook；除非用户显式确认，否则不执行。

## 可选提示型 Hooks

本插件包含三个默认 advisory hook 脚本，以及若干 strict-mode gate 脚本（默认不阻断）：

- `Stop`: 读取当前 `.spec-flow-kit/` 状态，并输出 active feature 的 stage、gate、traceability 和 evidence 摘要。
- `PostToolUse` for `Edit|Write|NotebookEdit`: 在文件编辑后提示是否需要维护 traceability，并提示 active required/strict rules 可能需要复核。

这些 hooks 只读、非阻断、不自动写入文件、不运行测试或部署命令，也不会把 Claude 推断写成 actual evidence。Hook 输出只包含安全元数据和建议，不打印文件内容、evidence command、secret、token、private key 或 credentials。

## 可选本地 MCP 状态服务

本插件提供一个可选 stdio MCP server：`spec-flow-kit`，配置见 `.mcp.json`，入口为 `mcp/sfk-state-server.js`。

它暴露只读状态查询和受控状态写入工具：

- `sfk.get_state`
- `sfk.get_current_stage`
- `sfk.get_traceability`
- `sfk.update_gate`
- `sfk.record_evidence`
- `sfk.next_action`

MCP 工具只操作当前工作目录下的 `.spec-flow-kit/` 文件协议；`sfk.record_evidence` 不应被用于记录伪造命令输出或 secrets。

## 当前结构

```text
spec-flow-kit/
├── .claude-plugin/
│   └── plugin.json
├── .mcp.json
├── commands/
│   ├── sfk-init.md
│   ├── sfk-requirements.md
│   ├── sfk-use.md
│   ├── sfk-design.md
│   ├── sfk-plan.md
│   ├── sfk-development.md
│   ├── sfk-verify.md
│   ├── sfk-rules-sync.md
│   ├── sfk-audit.md
│   ├── sfk-next.md
│   ├── sfk-deliver.md
│   ├── sfk-deploy.md
│   └── sfk-status.md
├── agents/
│   ├── requirements-analyst.md
│   ├── system-designer.md
│   └── verification-auditor.md
├── skills/
│   ├── sdd-core/
│   │   └── SKILL.md
│   ├── traceability-evidence/
│   │   └── SKILL.md
│   └── rules-governance/
│       └── SKILL.md
├── hooks/
│   ├── hooks.json
│   ├── stop-summary.js
│   ├── post-edit-trace.js
│   ├── rules-compliance-check.js
│   ├── pre-edit-gate.js
│   ├── pre-test-gate.js
│   └── pre-deploy-gate.js
├── mcp/
│   └── sfk-state-server.js
├── schemas/
├── templates/
├── docs/
│   └── spec-flow-kit-插件方案.md
└── README.md
```

组件目录仍在开发中。

## 实施优先级

1. 对齐插件 metadata 和文档。✅
2. 添加 `.spec-flow-kit/` 的 MVP templates 和 schemas。✅
3. 实现 `/sfk-init`、`/sfk-requirements`、`/sfk-use`、`/sfk-design`、`/sfk-plan` 和 `/sfk-status`。✅
4. 实现 `/sfk-development` 和 `/sfk-verify`，支持 traceability 和 evidence 更新。✅
5. 添加可选提示型 hooks。✅
6. 实现 `/sfk-rules-sync`，同步规则索引和规则文件列表。✅
7. 添加 MVP agents：`requirements-analyst`、`system-designer`、`verification-auditor`。✅
8. 添加 MVP skills：`sdd-core`、`traceability-evidence`、`rules-governance`。✅
9. 增加 audit、strict gate 脚本、waiver 协议、delivery readiness 和 deployment runbook 命令。✅
10. 添加可选本地 MCP 状态服务。✅
11. 后续增加企业级治理集成。

## 说明

- MVP 核心 commands 已实现为 prompt 文件：`/sfk-init`、`/sfk-requirements`、`/sfk-use`、`/sfk-design`、`/sfk-plan`、`/sfk-development`、`/sfk-verify`、`/sfk-rules-sync`、`/sfk-status`。
- `/sfk-rules-sync` 是规则索引同步命令，负责检查和维护 `rules.yaml` 与 `project-profile.yaml` 中的 `rules.files`。
- `/sfk-development` 和 `/sfk-verify` 是 prompt-only workflow；它们依赖项目本地文件协议、traceability schema、evidence schema 和真实命令/CI/用户确认 evidence。
- MVP agents 已实现：`requirements-analyst`、`system-designer`、`verification-auditor`。
- MVP skills 已实现：`sdd-core`、`traceability-evidence`、`rules-governance`。
- hooks 已提供可选提示型 MVP：`stop-summary.js`、`post-edit-trace.js` 和 `rules-compliance-check.js`；strict gate 脚本已提供但默认不阻断。
- MCP server 已提供可选本地状态服务：`spec-flow-kit`。
