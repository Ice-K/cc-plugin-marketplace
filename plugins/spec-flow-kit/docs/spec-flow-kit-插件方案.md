# spec-flow-kit 最终实施方案

## 0. 文档目的

本文用于指导 `spec-flow-kit` 插件从方案到落地实现。

它同时保留两层内容：

1. **最终愿景**：`spec-flow-kit` 最终要成为 Claude Code 的本地交付治理框架。
2. **落地路径**：第一版先实现轻量、稳定、可验证的 SDD 工作区，再逐步演进到完整治理能力。

核心原则：

> 愿景不降级，MVP 要收敛；先把文件协议、命令契约、Traceability、Evidence 和 Status 做扎实，再扩展严格 Gate、Hooks、Agents、Delivery、Deploy 和 MCP 状态服务。

文档语言规则：

> 面向用户、项目协作者和交付审计的 Markdown 文档默认使用中文编写；JSON / JSONL / YAML 等机器可读文件的字段名保持英文，说明文字可按需使用中文。

---

## 1. 产品愿景

`spec-flow-kit` 是一个面向 Claude Code 的本地 SDD（Spec-Driven Development，规范驱动开发）交付治理插件。

它借鉴 Harness 体系中的核心子系统设计思想，将软件开发流程抽象为可编排、可追踪、可门禁、可验证、可审计的本地工作流。

一句话定位：

> `spec-flow-kit` 是 Claude Code 的本地交付治理框架，让 Claude Code 以可追踪、可门禁、可验证的方式完成软件交付。

它不应只是“SDD 文档生成器”，而应逐步演进为：

> AI 开发流程治理系统。

它要解决的问题包括：

- 需求是否明确？
- 设计是否覆盖需求？
- 任务是否绑定到具体需求和设计决策？
- 代码是否对应具体任务？
- 代码是否遵循项目工程结构、开发流程和编码规范？
- 单元测试是否覆盖验收标准？
- CI 是否验证过关键路径？
- 交付和部署是否有计划与回滚方案？
- 最终验收是否有证据？

---

## 2. 核心价值

`spec-flow-kit` 的核心价值不是“生成更多文档”，而是把 AI 开发过程中的关键判断变成可追踪、可检查、可恢复的本地资产。

最重要的能力是：

1. **Traceability Matrix**：需求到设计、任务、代码、测试、CI、验证证据的追踪矩阵。
2. **Quality Gates**：阶段门禁，防止跳过需求、设计、测试、验证直接推进。
3. **Evidence-based Delivery**：证据化交付，每个完成结论都有测试、CI、验证报告或人工确认支撑。
4. **Custom Rules Governance**：用户自定义规则治理，确保 AI 开发过程遵循项目自己的工程结构、开发流程、编码规范、测试规范和安全规范。

价值判断：

| 产品形态 | 价值判断 |
| --- | --- |
| 只做 SDD 文档生成 | 价值较低 |
| 做 SDD + 任务拆分 + 开发辅助 | 中等价值 |
| 做 SDD + Gate + Traceability + Evidence | 中高价值 |
| 做成 Claude Code 的本地交付治理框架 | 高价值 |
| 做成企业级 AI SDLC 治理框架 | 很高价值，但实现难度高 |

---

## 3. Claude Code 插件实现边界

`spec-flow-kit` 不是传统意义上的独立 pipeline runtime。它通过 Claude Code 插件能力组合实现本地治理：

- **Slash Commands**：用户显式触发阶段动作，是 MVP 的主入口。
- **Files / Schemas**：`.spec-flow-kit/` 是稳定状态协议和证据存储目录。
- **Agents**：承担专业分析或审计角色，但不直接拥有流程状态。
- **Skills**：沉淀方法论、模板、检查清单，不承担复杂状态管理。
- **Hooks**：提供可选的提示型或严格型治理检查，MVP 默认不阻断。
- **Local Commands**：在用户授权下运行测试、lint、typecheck、build 等命令，并记录 evidence。
- **MCP / External Integrations**：作为后续增强，不作为 MVP 核心依赖。

因此，第一版不承诺“全自动 pipeline engine”。第一版目标是：

> 通过 slash commands + 文件协议 + advisory gates + traceability/evidence，让 Claude Code 可以稳定地围绕一个 feature 完成 SDD 闭环。

---

## 4. 三层产品路线

### 4.1 Vision Track：最终愿景

最终形态：

```text
spec-flow-kit
  = Flow Orchestration
  + Spec & Context Management
  + Role-based Execution Agents
  + Local Tool / Environment Connectors
  + Quality Gates
  + Traceability Matrix
  + Evidence-based Verification
  + Rules Governance
  + Audit Trail
```

最终目标是让 Claude Code 从“聊天式代码生成工具”升级为：

> 可追踪、可审计、可恢复、可验证的软件交付协作者。

### 4.2 MVP Track：第一版落地

第一版只做轻量 SDD 工作区：

- 初始化 `.spec-flow-kit/`。
- 生成需求、设计、任务、测试计划。
- 维护 traceability。
- 记录 evidence。
- 查看 status。
- 对照验收标准执行 verify。

MVP 不做：

- 完整 CD。
- 生产部署。
- 自动全流程 `/flow run`。
- 本地 MCP 状态服务。
- 企业级策略引擎。
- 默认阻断型 hooks。

### 4.3 Evolution Track：后续演进

后续逐步扩展：

1. Delivery readiness。
2. Deploy runbook。
3. Advisory hooks。
4. Strict gates。
5. Audit / waiver。
6. Local MCP state service。
7. 企业级规则治理。

---

## 5. 五层架构

`spec-flow-kit` 长期采用五层架构：

```text
第 1 层：Flow Orchestration Layer
流程编排层

第 2 层：Spec & Context Layer
规范与上下文层

第 3 层：Execution Layer
执行代理层

第 4 层：Integration & Environment Layer
集成与环境层

第 5 层：Governance & Verification Layer
治理与验证层
```

对应职责：

| 层级 | Harness 思想 | spec-flow-kit 中的职责 |
| --- | --- | --- |
| 1. 流程编排层 | Pipeline / Stage / Step | 把 SDD 生命周期编排成可推进的阶段 |
| 2. 规范与上下文层 | Service / Artifact / Input Set / Execution Context | 管理需求、设计、任务、测试计划、验证证据、追踪矩阵和用户自定义规范 |
| 3. 执行代理层 | Delegate / Runner / Task Executor | 用 Claude Code commands / agents 执行需求分析、设计、开发、测试、验证 |
| 4. 集成与环境层 | Connector / Environment / Artifact | 连接 Git、本地命令、测试框架、CI 脚本、部署脚本、MCP 工具和规则源 |
| 5. 治理与验证层 | Gate / Approval / Policy / Verification / Audit Trail | 做阶段门禁、规则检查、质量检查、审计、验收和证据沉淀 |

---

## 6. 总体工作流

长期完整工作流：

```text
规范加载
  → 需求分析
  → 系统设计
  → 任务拆分
  → 代码开发与单元测试
  → 持续集成
  → 持续交付准备
  → 部署准备 / 部署
  → 测试验证
  → 审计完成
```

MVP 工作流：

```text
init
  → requirements
  → use
  → design
  → plan
  → development
  → verify
  → status
```

推荐状态机：

```text
draft
→ initialized
→ rules_ready
→ requirements_ready
→ design_ready
→ plan_ready
→ development_in_progress
→ development_ready
→ verification_passed
→ completed
```

后续扩展状态：

```text
unit_tests_passed
→ ci_passed
→ delivery_ready
→ deployment_ready
→ audit_passed
```

---

## 7. 命令命名规范

`spec-flow-kit` 采用“短命令输入 + 插件归属显示 + 文件名直接映射”的命名策略。

### 7.1 用户实际输入

```text
/sfk-init
/sfk-requirements
/sfk-use
/sfk-design
/sfk-plan
/sfk-development
/sfk-verify
/sfk-status
```

### 7.2 文档和帮助中的完整归属显示

```text
/spec-flow-kit:sfk-init
/spec-flow-kit:sfk-requirements
/spec-flow-kit:sfk-use
/spec-flow-kit:sfk-design
/spec-flow-kit:sfk-plan
/spec-flow-kit:sfk-development
/spec-flow-kit:sfk-verify
/spec-flow-kit:sfk-status
```

含义：

- `sfk` 是 `spec-flow-kit` 的短前缀。
- 用户日常使用 `/sfk-*` 短命令。
- 文档、帮助信息、审计日志中可以使用 `/spec-flow-kit:sfk-*` 表示插件归属。
- 命令文件直接位于 `commands/sfk-*.md`，避免命令映射歧义。

### 7.3 MVP 命令表

| 用户输入 | 完整归属显示 | 用途 | MVP |
| --- | --- | --- | --- |
| `/sfk-init` | `/spec-flow-kit:sfk-init` | 初始化 `.spec-flow-kit/` 工作区 | 是 |
| `/sfk-requirements` | `/spec-flow-kit:sfk-requirements` | 从自然语言生成需求文档并默认激活该 feature | 是 |
| `/sfk-use` | `/spec-flow-kit:sfk-use` | 切换 active feature | 是 |
| `/sfk-design` | `/spec-flow-kit:sfk-design` | 生成系统设计、ADR、测试计划 | 是 |
| `/sfk-plan` | `/spec-flow-kit:sfk-plan` | 拆分任务并初始化追踪关系 | 是 |
| `/sfk-development` | `/spec-flow-kit:sfk-development` | 按任务实现并更新 traceability | 是 |
| `/sfk-verify` | `/spec-flow-kit:sfk-verify` | 验证验收标准并记录 evidence | 是 |
| `/sfk-status` | `/spec-flow-kit:sfk-status` | 查看 feature 状态、gate、缺口和下一步 | 是 |
| `/sfk-audit` | `/spec-flow-kit:sfk-audit` | 全量审计 traceability、evidence、rules | 后续 |
| `/sfk-next` | `/spec-flow-kit:sfk-next` | 推荐下一步动作 | 后续 |
| `/sfk-deliver` | `/spec-flow-kit:sfk-deliver` | 生成交付准备材料 | 后续 |
| `/sfk-deploy` | `/spec-flow-kit:sfk-deploy` | 生成部署 runbook 或执行受控部署 | 后续 |

---

## 8. 目标项目文件协议

插件在目标项目中生成 `.spec-flow-kit/` 目录。

MVP 推荐结构：

```text
<target-project>/
  .spec-flow-kit/
    flow.yaml
    state.json
    gates.json
    project-profile.yaml
    rules.yaml

    rules/
      engineering-structure.md
      development-process.md
      coding-style.md
      testing-rules.md

    features/
      <FEATURE-ID>/
        requirements.md
        design.md
        adr.md
        tasks.md
        test-plan.md
        verification.md
        traceability.md
        traceability.json
        evidence.jsonl
        status.json
        runs.jsonl
        reports/
          unit.md
          ci.md
          verification.md
```

后续扩展结构：

```text
.spec-flow-kit/
  schemas/
    flow.schema.json
    state.schema.json
    gates.schema.json
    feature-status.schema.json
    traceability.schema.json
    evidence.schema.json
    rules.schema.json

  features/<FEATURE-ID>/
    ci-plan.md
    delivery-plan.md
    deploy-plan.md
    rollback-plan.md
    release-notes.md
    risk-review.md
    reports/
      e2e.md
      audit.md
```

文件职责：

| 文件 | 作用 |
| --- | --- |
| `flow.yaml` | SDD flow 定义，描述阶段、命令、gate 和后续步骤 |
| `state.json` | 全局状态，记录 active feature、feature index、当前阶段、gate 模式 |
| `gates.json` | 全局 gate 状态摘要 |
| `project-profile.yaml` | 项目语言、包管理器、测试命令、构建命令、环境信息 |
| `rules.yaml` | 结构化用户规则索引和适用范围 |
| `rules/*.md` | 工程结构、开发流程、编码、测试等项目规则 |
| `requirements.md` | 需求、用户故事、验收标准、边界条件、非目标、风险 |
| `design.md` | 系统设计、接口设计、数据设计、错误处理、安全影响 |
| `adr.md` | 关键架构决策记录 |
| `tasks.md` | 可执行任务拆分 |
| `test-plan.md` | 单元测试、集成测试、E2E、UAT 策略 |
| `verification.md` | 验收结论 |
| `traceability.md` | 面向人的追踪矩阵 |
| `traceability.json` | 面向工具的追踪矩阵 |
| `evidence.jsonl` | 命令执行、人工确认、验证结论等证据记录 |
| `status.json` | 当前 feature 状态 |
| `runs.jsonl` | 每次 `/sfk-*` 命令运行记录 |
| `reports/*.md` | 面向人的阶段报告 |

---

## 9. Feature Workspace Management

`spec-flow-kit` 必须支持多个 feature 并存，并允许用户在 feature 之间切换。

### 9.1 多 feature 并存

每个 feature 拥有独立目录：

```text
.spec-flow-kit/features/
  AUTH-LOCK-001/
  PAYMENT-REFUND-002/
  PROFILE-AVATAR-003/
```

每个 feature 独立维护：

```text
requirements.md
design.md
tasks.md
traceability.json
evidence.jsonl
status.json
runs.jsonl
```

全局 `state.json` 只保存 feature 索引、active feature、workspace 信息和默认 gate 模式，不保存所有 feature 的完整详细状态。

### 9.2 activeFeature

`state.json` 应记录当前 active feature：

```json
{
  "version": 1,
  "activeFeature": "AUTH-LOCK-001",
  "gateMode": "advisory",
  "workspace": {
    "root": ".",
    "gitBranch": "feature/auth-lock",
    "gitRef": "abc1234"
  },
  "features": {
    "AUTH-LOCK-001": {
      "path": ".spec-flow-kit/features/AUTH-LOCK-001",
      "stage": "development_ready",
      "branch": "feature/auth-lock",
      "lastUpdatedAt": "2026-06-16T10:20:30Z"
    },
    "PAYMENT-REFUND-002": {
      "path": ".spec-flow-kit/features/PAYMENT-REFUND-002",
      "stage": "design_ready",
      "branch": "feature/payment-refund",
      "lastUpdatedAt": "2026-06-16T11:00:00Z"
    }
  }
}
```

### 9.3 Feature 参数解析优先级

所有需要 feature 上下文的命令按以下顺序解析目标 feature：

```text
1. 显式参数 <FEATURE-ID>
2. state.json 中的 activeFeature
3. 如果没有 activeFeature，提示用户选择或运行 /sfk-use <FEATURE-ID>
```

示例：

```text
/sfk-design AUTH-LOCK-001
```

优先使用显式 feature。

```text
/sfk-design
```

如果存在 active feature，则使用 active feature。

如果没有 active feature，应输出：

```text
No active feature selected.

Available features:
  AUTH-LOCK-001        development_ready
  PAYMENT-REFUND-002   design_ready

Run /sfk-use <FEATURE-ID> or pass a feature ID explicitly.
```

### 9.4 `/sfk-use`

完整显示：`/spec-flow-kit:sfk-use`

职责：

- 切换当前 active feature。
- 显示被切换 feature 的阶段、gate、阻塞项和下一步建议。
- 在切换前执行 advisory checks。

输入：

```text
/sfk-use <FEATURE-ID>
```

读取：

- `.spec-flow-kit/state.json`
- `.spec-flow-kit/features/<FEATURE-ID>/status.json`
- `.spec-flow-kit/features/<FEATURE-ID>/traceability.json`
- `.spec-flow-kit/features/<FEATURE-ID>/evidence.jsonl`

写入：

- `.spec-flow-kit/state.json`
- 可选追加 `.spec-flow-kit/features/<FEATURE-ID>/runs.jsonl`

权限边界：

- 不修改业务代码。
- 不运行 Bash。
- 不切换 Git branch。

切换前 advisory checks：

- 当前 feature 是否有未完成 gate。
- 当前 feature 是否存在 untraced changes。
- 当前工作区是否有未提交变更。
- 当前工作区分支是否与目标 feature 的记录分支不同。

MVP 中这些检查只提示，不阻断。

### 9.5 `/sfk-status --all`

`/sfk-status` 默认显示 active feature。

```text
/sfk-status
```

`/sfk-status <FEATURE-ID>` 显示指定 feature。

```text
/sfk-status AUTH-LOCK-001
```

`/sfk-status --all` 显示所有 feature 摘要。

```text
/sfk-status --all
```

输出示例：

```text
Active feature: AUTH-LOCK-001

Features:
  AUTH-LOCK-001        development_ready   active
  PAYMENT-REFUND-002   design_ready           blocked: missing error handling design
  PROFILE-AVATAR-003   requirements_ready     next: /sfk-design PROFILE-AVATAR-003
```

### 9.6 Feature 与 Git branch / worktree 的关系

`spec-flow-kit` 不强制一个 feature 对应一个 Git branch，也不自动切换 branch。

推荐规则：

- feature 可以记录创建时或最近更新时的 branch 和 git ref。
- branch / worktree 信息只是 metadata。
- 如果当前 branch 与 feature 记录的 branch 不一致，`/sfk-use` 和 `/sfk-status` 只提示。
- 是否切换 branch 由用户决定。
- 多 worktree 场景下，state 应记录 workspace root 和 git branch，避免读错 feature 状态。

---

## 10. Flow、Gate、Traceability、Evidence

### 10.1 Flow

Flow 是 SDD 生命周期定义。

MVP 示例：

```yaml
name: default-sdd-flow
version: 1

stages:
  - id: init
    name: 初始化
    command: /sfk-init
    gate: initialized

  - id: requirements
    name: 需求分析
    command: /sfk-requirements
    gate: requirements-ready

  - id: design
    name: 系统设计
    command: /sfk-design
    gate: design-ready

  - id: plan
    name: 任务拆分
    command: /sfk-plan
    gate: plan-ready

  - id: development
    name: 代码实现
    command: /sfk-development
    gate: development-ready

  - id: verification
    name: 验证
    command: /sfk-verify
    gate: verification-passed
```

### 10.2 Gate

Gate 是阶段推进条件。

状态建议：

```text
pending
passed
blocked
failed
waived
```

Gate 模式：

```text
advisory：只提示，不阻断。MVP 默认。
strict：可阻断高风险操作。后续显式启用。
```

示例：

```json
{
  "mode": "advisory",
  "gates": {
    "requirements-ready": {
      "status": "passed",
      "evidence": ["EV-REQ-001"],
      "updatedAt": "2026-06-16T10:20:30Z"
    },
    "design-ready": {
      "status": "blocked",
      "reason": "缺少错误处理设计和回滚影响分析",
      "requiredActions": [
        "补充错误处理设计",
        "补充回滚影响分析"
      ],
      "updatedAt": "2026-06-16T10:25:00Z"
    }
  }
}
```

### 10.3 Traceability

Traceability 是需求、设计、任务、代码、测试和证据之间的追踪关系。

面向人的 `traceability.md` 示例：

```markdown
# Traceability Matrix

| Requirement | Design Decision | Task | Code | Test | Evidence | Status |
|---|---|---|---|---|---|---|
| REQ-001 | DES-001 | TASK-001 | src/auth/lockout.ts | tests/auth/lockout.test.ts | EV-UNIT-001 | PASS |
| REQ-002 | DES-003 | TASK-004 | src/auth/unlock.ts | 缺失 | 无 | BLOCKED |
```

面向工具的 `traceability.json` 示例：

```json
{
  "featureId": "AUTH-LOCK-001",
  "version": 1,
  "links": [
    {
      "requirementId": "REQ-001",
      "designIds": ["DES-001"],
      "taskIds": ["TASK-001"],
      "code": ["src/auth/lockout.ts"],
      "tests": ["tests/auth/lockout.test.ts"],
      "evidence": ["EV-UNIT-001"],
      "status": "pass"
    }
  ]
}
```

### 10.4 Evidence

Evidence 用于回答：

> 为什么我们相信这个需求已经完成？

Evidence 不能只是自然语言报告，必须记录来源和可信度。

Evidence 类型：

| 类型 | 含义 |
| --- | --- |
| `actual-command` | 实际运行本地命令产生的证据 |
| `external-ci` | 外部 CI 状态或报告 |
| `user-confirmed` | 用户人工确认 |
| `manual-review` | 人工评审结果 |
| `claude-inferred` | Claude 根据文件内容推断，可信度最低 |

`evidence.jsonl` 示例：

```json
{"id":"EV-UNIT-001","featureId":"AUTH-LOCK-001","stage":"verification","type":"actual-command","command":"pnpm test auth","exitCode":0,"timestamp":"2026-06-16T10:20:30Z","gitRef":"abc1234","generatedBy":"claude","summary":"Auth lockout unit tests passed."}
```

`/sfk-verify` 输出必须区分：

```text
✅ 已验证：有 actual-command 或 external-ci 证据
🟡 用户确认：有 user-confirmed 证据
🟠 Claude 推断：只有 claude-inferred 证据
❌ 缺证据：没有可用证据
```

---

## 11. Rules Governance

Rules 是用户自定义规则集合，用于约束需求、设计、实现、测试、CI、交付和部署。

推荐规则文件：

```text
.spec-flow-kit/rules/
  engineering-structure.md
  development-process.md
  coding-style.md
  testing-rules.md
  architecture-rules.md
  security-rules.md
  documentation-rules.md
  review-checklist.md
```

规则可以来自：

- `CLAUDE.md`
- `README.md`
- `CONTRIBUTING.md`
- `.editorconfig`
- ESLint / Prettier / Ruff / Checkstyle 配置
- 测试配置
- 架构文档
- 用户手动补充

但自动导入的规则不能直接变成强制规则。导入流程必须分为：

```text
Discover → Propose → User Confirm → Activate
```

建议 `rules.yaml` 结构：

```yaml
version: 1
priority:
  - feature
  - project
  - team
  - organization
  - plugin-default

rules:
  - id: STD-CODE-001
    title: 禁止吞掉异常
    level: required
    source: CONTRIBUTING.md
    sourceLines: "42-50"
    scope: project
    appliesTo:
      - development
      - testing
    enforcement:
      mode: advisory
    status: active
```

规则优先级：

```text
feature > project > team > organization > plugin default
```

规则强度：

```text
required：必须满足，可用于 gate
recommended：建议满足，默认只提示
informational：上下文信息，不作为检查条件
```

### 11.1 Rules 维护模型

`rules/*.md` 与 `rules.yaml` 的职责不同：

```text
rules/*.md = 用户可编辑的规则正文
rules.yaml = 插件维护为主的规则索引和执行元数据
```

推荐策略：

- 用户可以自由新增、删除或修改 `rules/*.md`。
- 插件绝不无提示覆盖用户手写的 `rules/*.md`。
- `/sfk-design`、`/sfk-plan`、`/sfk-development`、`/sfk-verify` 和 `/sfk-audit` 按阶段读取相关规则。
- 插件检测 `rules/*.md` 的新增、删除或修改，并提示 `rules.yaml` 是否需要同步。
- 新提取的规则默认写入 `rules.yaml` 时使用 `status: proposed`。
- 用户确认后，规则才应变为 `status: active`。
- 规则不应自动变成 `strict`；严格执行必须由用户显式确认。

`rules.yaml` 推荐由插件维护为主，用户可手动修正。插件主要维护：

```text
id
title
source
sourceLines
appliesTo
status
```

用户主要确认：

```text
level: required | recommended | informational
enforcement.mode: advisory | strict
status: proposed | active | deprecated
```

### 11.2 `/sfk-rules-sync` 后续命令

`/sfk-rules-sync` 是后续计划命令，不进入 MVP 第一批核心命令。

完整显示：`/spec-flow-kit:sfk-rules-sync`

职责：

- 扫描 `.spec-flow-kit/rules/*.md`。
- 发现未索引规则文件。
- 发现已删除但仍在 `rules.yaml` 中引用的规则。
- 发现 `sourceLines` 可能失效的规则。
- 从规则正文提取候选结构化规则。
- 更新 `rules.yaml`，新规则默认 `status: proposed`。
- 同步更新 `project-profile.yaml` 中的 `rules.files`，确保新增、删除或重命名的规则文件能被后续命令加载。
- 输出需要用户确认的规则列表。

安全边界：

- 不修改业务代码。
- 不运行 Bash。
- 不自动把规则改为 `strict`。
- 不无提示覆盖用户手写的 `rules/*.md`。
- 不删除 `project-profile.yaml` 中用户手动添加但仍存在的规则文件引用；只提示并请求确认。

MVP 中如果暂不实现该命令，`/sfk-status` 和 `/sfk-audit` 应至少提示：

```text
发现 rules/*.md 与 rules.yaml 或 project-profile.yaml 中的 rules.files 可能不同步。
后续可运行 /sfk-rules-sync 同步规则索引和规则文件列表。
```

### 11.3 Project Profile 维护模型

`project-profile.yaml` 是项目画像和命令配置。

推荐策略：

- `/sfk-init` 自动探测并生成 `project-profile.yaml`。
- 用户可以手动维护 `project-profile.yaml`。
- 插件只自动填补空值，不静默覆盖已有用户配置。
- 用户显式配置优先级高于插件探测结果。
- 高风险环境命令必须用户确认。
- production 默认 `deploy: manual`，不自动执行。
- 当 `/sfk-rules-sync` 发现规则文件新增、删除或重命名时，应同步维护 `rules.files`。
- `rules.files` 是后续命令加载规则正文的入口，必须与实际 `rules/*.md` 文件保持一致。
- 对于用户手动添加且文件仍存在的 `rules.files` 条目，插件不应自动删除。
- 对于文件已不存在的 `rules.files` 条目，插件应提示用户确认后再移除。

优先级：

```text
用户显式配置 > 插件探测 > 插件默认
```

如果 `/sfk-verify` 需要运行测试但 `commands.unitTest` 为空，应提示用户配置或本次提供命令，而不是编造 evidence。

---

## 12. 插件自身目录结构

推荐插件结构：

```text
spec-flow-kit/
  README.md
  .claude-plugin/
    plugin.json

  commands/
    sfk-init.md
    sfk-requirements.md
    sfk-use.md
    sfk-design.md
    sfk-plan.md
    sfk-development.md
    sfk-verify.md
    sfk-status.md
    # future:
    sfk-audit.md
    sfk-rules-sync.md
    sfk-next.md
    sfk-deliver.md
    sfk-deploy.md

  skills/
    sdd-core/
      SKILL.md
    traceability-evidence/
      SKILL.md
    rules-governance/
      SKILL.md
    # future:
    tdd-unit-testing/
      SKILL.md
    ci-quality-gates/
      SKILL.md
    delivery-readiness/
      SKILL.md
    deployment-runbook/
      SKILL.md

  agents/
    requirements-analyst.md
    system-designer.md
    verification-auditor.md
    # future:
    development-engineer.md
    unit-test-engineer.md
    ci-engineer.md
    delivery-engineer.md
    deployment-planner.md
    rules-advisor.md

  hooks/
    stop-summary.js
    post-edit-trace.js
    # future strict/advisory hooks:
    pre-edit-gate.js
    pre-test-gate.js
    pre-deploy-gate.js
    rules-compliance-check.js

  schemas/
    flow.schema.json
    state.schema.json
    gates.schema.json
    traceability.schema.json
    evidence.schema.json
    project-profile.schema.json
    rules.schema.json

  templates/
    flow.yaml
    state.json
    gates.json
    project-profile.yaml
    requirements.md
    design.md
    adr.md
    tasks.md
    test-plan.md
    verification.md
    traceability.md
    traceability.json
    rules.yaml
    rules/
      engineering-structure.md
      development-process.md
      coding-style.md
      testing-rules.md

  docs/
    spec-flow-kit-插件方案.md
    architecture.md
    commands.md
    mvp-roadmap.md
    rules-model.md
```

---

## 13. MVP 命令契约

所有命令遵循统一流程：

```text
1. 读取当前 .spec-flow-kit 状态。
2. 检查前置 gate。
3. 执行本阶段任务。
4. 写入或更新产物。
5. 更新 traceability / evidence / status / gates。
6. 输出当前状态、阻塞项和下一步建议。
```

### 13.1 `/sfk-init`

完整显示：`/spec-flow-kit:sfk-init`

职责：

- 初始化 `.spec-flow-kit/` 目录。
- 探测项目语言、框架、包管理器、测试框架、构建命令。
- 发现已有规则源，例如 `CLAUDE.md`、`README.md`、`CONTRIBUTING.md`、`.editorconfig`、lint 配置、测试配置、架构文档。
- 生成 `flow.yaml`、`state.json`、`gates.json`、`project-profile.yaml`、`rules.yaml` 和 rules 模板。

输入：

- 可选项目说明。
- 当前工作目录。

读取：

- 项目根目录文件。
- 包管理器配置。
- 测试 / lint / build 配置。
- 已有规范文档。

写入：

- `.spec-flow-kit/flow.yaml`
- `.spec-flow-kit/state.json`
- `.spec-flow-kit/gates.json`
- `.spec-flow-kit/project-profile.yaml`
- `.spec-flow-kit/rules.yaml`
- `.spec-flow-kit/rules/*.md`

权限边界：

- 不修改业务代码。
- 不运行安装、测试、构建或部署命令。
- 不把自动发现的规范直接设为 strict。

失败行为：

- 如果 `.spec-flow-kit/` 已存在，不直接覆盖；先报告现状并询问是否合并或更新。
- 如果无法识别测试命令，在 `project-profile.yaml` 中标记为 `unknown`。

### 13.2 `/sfk-requirements`

完整显示：`/spec-flow-kit:sfk-requirements`

职责：

- 从自然语言需求生成 feature 目录。
- 创建 feature index 记录，并默认将新 feature 设置为 active feature。
- 生成需求文档。
- 提炼用户故事、功能需求、非功能需求、验收标准、边界条件、非目标、风险。
- 如果需求不清楚，先提出澄清问题。

输入：

```text
/sfk-requirements "增加用户登录失败 5 次后锁定账户 15 分钟"
```

读取：

- `.spec-flow-kit/state.json`
- `.spec-flow-kit/project-profile.yaml`
- `.spec-flow-kit/rules.yaml`

写入：

- `.spec-flow-kit/features/<FEATURE-ID>/requirements.md`
- `.spec-flow-kit/features/<FEATURE-ID>/status.json`
- `.spec-flow-kit/features/<FEATURE-ID>/evidence.jsonl`
- `.spec-flow-kit/state.json`
- `.spec-flow-kit/gates.json`

权限边界：

- 不修改业务代码。
- 不运行 Bash。

Gate：

- 生成 `requirements-ready`。
- 需求不清楚时为 `blocked`。
- 需求足够明确时为 `passed`。

### 13.3 `/sfk-use`

完整显示：`/spec-flow-kit:sfk-use`

职责：

- 切换当前 active feature。
- 支持多个 feature 之间快速切换。
- 输出目标 feature 的当前阶段、gate 状态、阻塞项和下一步建议。
- 切换前执行 advisory checks，但 MVP 不阻断。

输入：

```text
/sfk-use <FEATURE-ID>
```

读取：

- `.spec-flow-kit/state.json`
- `.spec-flow-kit/features/<FEATURE-ID>/status.json`
- `.spec-flow-kit/features/<FEATURE-ID>/traceability.json`
- `.spec-flow-kit/features/<FEATURE-ID>/evidence.jsonl`

写入：

- `.spec-flow-kit/state.json`
- 可选追加 `.spec-flow-kit/features/<FEATURE-ID>/runs.jsonl`

权限边界：

- 不修改业务代码。
- 不运行 Bash。
- 不切换 Git branch 或 worktree。

失败行为：

- 如果 feature 不存在，显示可用 feature 列表。
- 如果当前工作区有未提交变更或 untraced changes，只提示，不阻断。

### 13.4 `/sfk-design`

完整显示：`/spec-flow-kit:sfk-design`

职责：

- 基于 requirements、项目结构和 rules 生成系统设计。
- 分析接口、数据、错误处理、安全、可观测性、迁移和部署影响。
- 生成 ADR 和测试策略。

输入：

```text
/sfk-design <FEATURE-ID>
```

前置条件：

- `requirements-ready` 为 `passed` 或 `waived`。

读取：

- `requirements.md`
- `project-profile.yaml`
- `rules.yaml`
- 相关源码结构，只读分析。

写入：

- `design.md`
- `adr.md`
- `test-plan.md`
- `status.json`
- `gates.json`
- `evidence.jsonl`

权限边界：

- 不修改业务代码。
- 默认不运行 Bash。

Gate：

- 输出 `design-ready`。
- 缺少关键设计时标记 `blocked`。

### 13.5 `/sfk-plan`

完整显示：`/spec-flow-kit:sfk-plan`

职责：

- 将需求和设计拆分为可执行任务。
- 每个任务绑定 requirement 和 design decision。
- 初始化 `traceability.md` 和 `traceability.json`。
- 标注每个任务适用的工程结构、编码规范、测试规范和开发流程约束。

输入：

```text
/sfk-plan <FEATURE-ID>
```

前置条件：

- `requirements-ready` 为 `passed` 或 `waived`。
- `design-ready` 为 `passed` 或 `waived`。

读取：

- `requirements.md`
- `design.md`
- `adr.md`
- `test-plan.md`
- `rules.yaml`

写入：

- `tasks.md`
- `traceability.md`
- `traceability.json`
- `status.json`
- `gates.json`
- `evidence.jsonl`

权限边界：

- 不修改业务代码。
- 不运行 Bash。

Gate：

- 输出 `plan-ready`。

### 13.6 `/sfk-development`

完整显示：`/spec-flow-kit:sfk-development`

职责：

- 检查 requirements/design/plan/rules gate。
- 按任务实现代码。
- 遵循工程结构、编码规范、错误处理、日志、安全和测试规范。
- 生成或更新单元测试。
- 更新 traceability。
- 标记不符合规范或无法自动判断的代码变更。

输入：

```text
/sfk-development <FEATURE-ID>
/sfk-development <FEATURE-ID> --task TASK-003
```

前置条件：

- `requirements-ready` 为 `passed` 或 `waived`。
- `design-ready` 为 `passed` 或 `waived`。
- `plan-ready` 为 `passed` 或 `waived`。

读取：

- `requirements.md`
- `design.md`
- `tasks.md`
- `test-plan.md`
- `traceability.json`
- `rules.yaml`
- 相关源码和测试文件。

写入：

- 业务代码。
- 测试代码。
- `traceability.md`
- `traceability.json`
- `status.json`
- `evidence.jsonl`

权限边界：

- 可以修改业务代码和测试代码。
- 默认不自动运行 install、deploy、生产相关命令。
- 运行测试命令前应说明将运行的命令；是否需要确认由当前 Claude Code 权限模式决定。

Gate：

- 输出 `development-ready` 或 `development-in-progress`。
- 若有未追踪变更，状态标为 `blocked` 或 `needs-traceability`。

### 13.7 `/sfk-verify`

完整显示：`/spec-flow-kit:sfk-verify`

职责：

- 对照验收标准判断需求是否满足。
- 检查 traceability 是否完整。
- 运行或建议运行测试、lint、typecheck、build。
- 记录实际命令 evidence。
- 输出通过、部分通过、缺证据、失败的需求列表。

输入：

```text
/sfk-verify <FEATURE-ID>
```

读取：

- `requirements.md`
- `design.md`
- `tasks.md`
- `test-plan.md`
- `traceability.json`
- `evidence.jsonl`
- `project-profile.yaml`
- `rules.yaml`

写入：

- `verification.md`
- `reports/unit.md`
- `reports/ci.md`
- `reports/verification.md`
- `evidence.jsonl`
- `status.json`
- `gates.json`

权限边界：

- 可以运行本地测试、lint、typecheck、build 命令。
- 不执行 deploy。
- 不把 Claude 推断当作 actual evidence。

Gate：

- 输出 `verification-passed`、`failed` 或 `blocked`。

### 13.8 `/sfk-status`

完整显示：`/spec-flow-kit:sfk-status`

职责：

- 查看当前 feature 状态。
- 查看 gate 阻塞原因。
- 查看 traceability 缺口。
- 查看 evidence 可信度。
- 推荐下一步。

输入：

```text
/sfk-status
/sfk-status <FEATURE-ID>
/sfk-status --all
```

读取：

- `.spec-flow-kit/state.json`
- `.spec-flow-kit/gates.json`
- `features/<FEATURE-ID>/status.json`
- `traceability.json`
- `evidence.jsonl`

写入：

- 默认不写入。
- 可选追加 `runs.jsonl` 记录状态查询。

权限边界：

- 不修改业务代码。
- 不运行 Bash。

输出格式：

```text
Feature: AUTH-LOCK-001
Stage: development_ready
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
Next:
  Run /sfk-verify AUTH-LOCK-001
```

---

## 14. Agents 设计

### 14.1 MVP agents

MVP 只保留少量高价值 agents：

| Agent | 职责 |
| --- | --- |
| `requirements-analyst` | 需求澄清、用户故事、验收标准、边界条件、风险 |
| `system-designer` | 系统架构、接口、数据模型、错误处理、安全影响、ADR |
| `verification-auditor` | 验收验证、traceability 检查、evidence 可信度审计 |

### 14.2 后续 agents

后续再扩展：

| Agent | 职责 |
| --- | --- |
| `development-engineer` | 按任务实现代码，保持与需求、设计和编码规范一致 |
| `unit-test-engineer` | 生成、补齐、修复单元测试，并遵循测试规范 |
| `ci-engineer` | 识别并运行 CI 检查，分析失败原因 |
| `delivery-engineer` | 生成 release notes、交付计划、风险说明 |
| `deployment-planner` | 生成部署步骤、环境检查、回滚方案 |
| `rules-advisor` | 导入、整理、解释和冲突消解用户规则 |

设计原则：

- Command 负责流程编排和状态写回。
- Agent 负责专业分析或执行建议。
- Agent 不直接拥有全局状态管理权。
- Agent 输出应由 command 主流程审查后写回 `.spec-flow-kit/`。
- Governance / verification agent 不直接实现业务代码。

---

## 15. Skills 设计

### 15.1 MVP skills

MVP skills 保持少而清晰：

| Skill | 用途 |
| --- | --- |
| `sdd-core` | 需求、设计、计划的核心 SDD 方法论和模板 |
| `traceability-evidence` | 追踪矩阵、证据记录、验证报告模板 |
| `rules-governance` | 用户规则导入、分层、冲突消解和适用范围判断 |

### 15.2 后续 skills

| Skill | 用途 |
| --- | --- |
| `tdd-unit-testing` | 根据验收标准生成和补齐单测 |
| `ci-quality-gates` | lint/test/build/typecheck 策略和 CI 失败诊断 |
| `delivery-readiness` | release notes、交付计划、风险评估 |
| `deployment-runbook` | 部署步骤、环境确认、回滚方案 |

设计原则：

- Skills 沉淀方法论、模板、检查清单。
- Skills 不承担复杂状态管理。
- 大模板和 schema 应作为 skill 附属文件，避免一次性塞进上下文。

---

## 16. Hooks 设计

Hooks 是治理层的重要实现，但 MVP 不默认启用阻断型 hooks。

### 16.1 MVP hooks

| Hook | Claude Code 事件 | Matcher | 默认模式 | 是否阻断 | 作用 |
| --- | --- | --- | --- | --- | --- |
| `stop-summary.js` | Stop | all | advisory | 否 | 会话结束时输出当前阶段、已通过 gate、阻塞项、规范违规项和下一步建议 |
| `post-edit-trace.js` | PostToolUse | Edit / Write / NotebookEdit | advisory | 否 | 代码修改后提示是否需要关联 feature/task/requirement |

MVP hook 注册文件：

```text
plugins/spec-flow-kit/hooks/hooks.json
```

注册约定：

- `Stop` 事件执行 `node "${CLAUDE_PLUGIN_ROOT}/hooks/stop-summary.js"`。
- `PostToolUse` 事件使用 matcher `Edit|Write|NotebookEdit`，执行 `node "${CLAUDE_PLUGIN_ROOT}/hooks/post-edit-trace.js"`。
- hooks 通过 stdout 返回 `hookSpecificOutput.additionalContext`，只向 Claude 上下文追加提示。
- hooks 正常和可恢复异常路径都应使用 exit code `0`。
- MVP hooks 不使用 exit code `2`，不输出 `decision: "block"`，不自动写入文件。
- hooks 只读取 `.spec-flow-kit/` 的 state、gates、status、traceability 和 evidence 摘要，不读取 transcript 或源码内容。
- hooks 不输出文件内容、evidence command、secret、token、private key 或 credentials。

### 16.2 后续 hooks

| Hook | Claude Code 事件 | Matcher | 默认模式 | 是否阻断 | 作用 |
| --- | --- | --- | --- | --- | --- |
| `pre-edit-gate.js` | PreToolUse | Edit / Write / NotebookEdit | strict only | 可选 | 没有需求或设计时阻止大规模代码修改 |
| `pre-test-gate.js` | PreToolUse | Bash | strict only | 可选 | 测试前检查是否有 test-plan 和任务映射 |
| `pre-deploy-gate.js` | PreToolUse | Bash | strict only | 是 | 部署前检查 CI、交付计划、回滚方案和环境确认 |
| `rules-compliance-check.js` | PostToolUse / Stop | edit tools / all | advisory 或 strict | 可选 | 检查代码、测试、文档或交付物是否违反用户规则 |

Hook 设计要求：

- 必须说明触发事件、matcher、输入 JSON、输出行为、退出码语义。
- 默认 advisory，不阻断用户。
- strict mode 必须由用户显式启用。
- hooks 不应读取或输出 secrets。
- hooks 不应自动运行部署命令。

---

## 17. Integration & Environment

不接 Harness API 的情况下，集成层抽象为本地开发环境和工具连接。

建议文件：

```text
.spec-flow-kit/project-profile.yaml
```

示例：

```yaml
version: 1
project:
  name: my-service
  type: web-api
  language: typescript
  packageManager: pnpm

commands:
  install: pnpm install
  lint: pnpm lint
  typecheck: pnpm typecheck
  unitTest: pnpm test
  build: pnpm build
  e2e: pnpm test:e2e

rules:
  files:
    - .spec-flow-kit/rules/engineering-structure.md
    - .spec-flow-kit/rules/development-process.md
    - .spec-flow-kit/rules/coding-style.md
    - .spec-flow-kit/rules/testing-rules.md

environments:
  local:
    run: pnpm dev
    verify: pnpm test

  staging:
    deploy: ./scripts/deploy-staging.sh
    verify: ./scripts/smoke-staging.sh
    requiresApproval: true

  production:
    deploy: manual
    requiresApproval: true
    rollback: ./scripts/rollback-prod.sh
```

可集成对象：

- Git。
- 本地 shell 命令。
- 包管理器。
- 测试框架。
- 构建工具。
- 部署脚本。
- 用户自定义规则源。
- Playwright MCP。
- Context7 MCP。
- 代码索引工具 ccc。
- 可选 GitHub / GitLab CI 状态。

MVP 只要求识别本地测试、lint、typecheck、build 命令。

---

## 18. MVP 范围

### 18.1 MVP 目标

第一版目标：

> 跑通本地 SDD flow + traceability + advisory gates + evidence + verification。

### 18.2 MVP 命令

```text
/sfk-init
/sfk-requirements
/sfk-use
/sfk-design
/sfk-plan
/sfk-development
/sfk-verify
/sfk-status
```

### 18.3 MVP agents

```text
requirements-analyst
system-designer
verification-auditor
```

### 18.4 MVP skills

```text
sdd-core
traceability-evidence
rules-governance
```

### 18.5 MVP hooks

默认不启用阻断 hooks。可选提供：

```text
stop-summary.js
post-edit-trace.js
```

### 18.6 MVP 成功标准

1. 用户可以从自然语言需求生成 feature spec。
2. 用户可以初始化 `.spec-flow-kit/` 工作区。
3. 用户可以导入或定义工程结构、开发流程、编码、测试等自定义规范。
4. 用户可以基于需求和规范生成设计、ADR、测试计划。
5. 用户可以将设计拆分为任务。
6. 每个任务可以追踪到 requirement 和 design decision。
7. 代码和测试可以追踪到任务和需求。
8. 实际运行的测试、lint、typecheck、build 可以沉淀为 evidence。
9. `/sfk-verify` 能指出哪些需求通过、部分通过、失败或缺少证据。
10. `/sfk-use` 能在多个 feature 之间切换 active feature，并在切换前提示未提交变更、未追踪变更和分支不一致风险。
11. `/sfk-status` 能清楚说明当前阶段、阻塞项、traceability 缺口和下一步。
12. `/sfk-status --all` 能列出所有 feature 的阶段、阻塞状态和 active feature。

---

## 19. 后续路线图

### Milestone 1：SDD 本地闭环

目标：完成需求、feature 切换、设计、任务、实现、验证的本地流程。

交付：

```text
/sfk-init
/sfk-requirements
/sfk-use
/sfk-design
/sfk-plan
/sfk-development
/sfk-verify
/sfk-status
```

### Milestone 2：质量检查增强

目标：补齐单测、lint、typecheck、build 的稳定 evidence 记录。

交付：

```text
/sfk-verify 增强
reports/unit.md
reports/ci.md
evidence.jsonl actual-command records
```

### Milestone 3：交付准备

目标：补齐持续交付准备能力。

交付：

```text
/sfk-deliver
release-notes.md
delivery-plan.md
rollback-plan.md
risk-review.md
```

### Milestone 4：部署 Runbook

目标：支持 local/staging 部署脚本编排，production 默认 runbook 模式。

交付：

```text
/sfk-deploy
deploy-plan.md
rollback-plan.md
pre-deploy-gate.js
```

约束：

- production 默认只生成 runbook。
- 实际部署必须显式确认。

### Milestone 5：治理增强

目标：增强 hooks、gate、audit 和 rules 同步。

交付：

```text
/sfk-audit
/sfk-rules-sync
strict gate mode
waiver mechanism
untraced change detection
rules compliance check
```

### Milestone 6：本地 MCP 状态服务

目标：为 agents 提供统一状态查询和更新接口。

可能工具：

```text
sfk.get_state
sfk.get_current_stage
sfk.get_traceability
sfk.update_gate
sfk.record_evidence
sfk.next_action
```

---

## 20. 安全与权限边界

`spec-flow-kit` 涉及 hooks、Bash、CI、部署、规范扫描和证据记录，必须明确安全边界。

默认策略：

- 默认不执行部署。
- 默认不启用阻断型 hooks。
- 默认不上传代码、报告或 evidence。
- 默认不读取 secrets 文件。
- 默认不把 token、password、private key 写入 reports。
- production deploy 永远只生成 runbook，除非用户显式确认并授权执行。
- 自动发现的 rules 默认是 proposed，不直接变成 strict required。
- Claude 推断不能伪装成实际运行 evidence。

README 和 marketplace 描述必须明确：

- 插件会创建 `.spec-flow-kit/`。
- 插件可能读取项目文档和配置来生成 project profile。
- 插件可能在用户授权下运行测试、lint、typecheck、build。
- 插件 hooks 默认 advisory。
- 用户可以禁用 hooks 或 strict mode。

---

## 21. 产品风险与规避策略

### 风险 1：太像文档生成器

规避：

- 聚焦 traceability、gate、evidence。
- 每个文档都必须服务于阶段推进和验证。
- Markdown 给人看，JSON / JSONL 给工具判断。

### 风险 2：流程太重

规避：

- 支持轻量命令。
- 小改动允许通过 advisory gates。
- 大需求走完整 SDD flow。
- 不在 MVP 提供自动全流程 `/flow run`。

### 风险 3：Gate 过于强硬影响开发体验

规避：

- MVP 默认 advisory。
- gate 支持 `waived`。
- strict mode 后续显式启用。

### 风险 4：Traceability 维护成本高

规避：

- 先做任务级半自动维护。
- 修改代码后由 `post-edit-trace` 提示补充映射。
- `/sfk-status` 和 `/sfk-audit` 自动发现缺口。

### 风险 5：Evidence 被编造

规避：

- evidence 必须记录 type。
- actual evidence 必须有 command、exitCode、timestamp。
- Claude 推断只能标为 `claude-inferred`。
- `/sfk-verify` 明确区分已验证、用户确认、Claude 推断和缺证据。

### 风险 6：上下文膨胀

规避：

- rules 分层加载。
- 每个命令只加载必要文件。
- 大文档维护摘要。
- skills 使用 progressive disclosure。

### 风险 7：多 worktree / 多会话状态冲突

规避：

- state 记录 workspace root、git branch、git ref、active feature、last updated。
- runs.jsonl 记录每次命令运行。
- 冲突时优先提示用户，不自动覆盖。

---

## 22. 实施优先级

### P0：插件骨架和文档对齐

- `.claude-plugin/plugin.json`
- README
- 命令命名规范
- 目录结构
- 安全边界说明

### P1：MVP 文件协议和模板

- `flow.yaml`
- `state.json`
- `gates.json`
- `project-profile.yaml`
- `rules.yaml`
- feature templates
- feature index / activeFeature
- `traceability.json`
- `evidence.jsonl`

### P2：核心命令

- `/sfk-init`
- `/sfk-requirements`
- `/sfk-use`
- `/sfk-design`
- `/sfk-plan`
- `/sfk-status`

### P3：实现与验证

- `/sfk-development`
- `/sfk-verify`
- evidence 记录
- traceability 更新

### P4：轻量治理

- `stop-summary.js`
- `post-edit-trace.js`
- advisory gate checks

### P5：增强治理

- `/sfk-audit`
- `/sfk-rules-sync`
- strict mode
- waiver mechanism
- rules compliance check

### P6：交付与部署

- `/sfk-deliver`
- `/sfk-deploy`
- deploy runbook
- pre-deploy gate

### P7：本地 MCP 状态服务

- `sfk.get_state`
- `sfk.update_gate`
- `sfk.record_evidence`
- `sfk.next_action`

---

## 23. 推荐产品口号

中文：

> Claude Code 的本地交付治理框架。

或者：

> 让 Claude Code 以可追踪、可门禁、可验证的方式完成软件交付。

英文：

> A local delivery harness for Claude Code.

或者：

> Spec-driven delivery orchestration for Claude Code.

---

## 24. 最终结论

`spec-flow-kit` 值得做，但它的核心价值不在于“结合 Harness 和 SDD”这个概念本身，而在于解决 AI 编程真实落地时的治理问题。

最终愿景仍然是：

> 成为 Claude Code 的本地交付治理框架。

但落地路径应该是：

```text
第一版：slash commands + 文件协议 + traceability + evidence + status/verify
第二版：agents/skills + advisory hooks + audit
第三版：strict gates + waiver + delivery/deploy runbook
第四版：local MCP state service + enterprise governance
```

如果 MVP 能把 `Flow + Gate + Traceability + Evidence + Verification` 做扎实，这个插件在团队开发、交付型项目和企业级 AI SDLC 治理场景中会有较高价值。
