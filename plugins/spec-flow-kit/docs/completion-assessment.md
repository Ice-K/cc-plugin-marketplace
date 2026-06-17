# spec-flow-kit 完成度检查报告

检查日期：2026-06-17  
检查对象：`plugins/spec-flow-kit`  
当前阶段判断：实验性 MVP 基本完成，接近 Beta，但尚未达到稳定 v1.0。

## 1. 总体结论

现阶段 `spec-flow-kit` 的完成度可按不同目标阶段理解：

| 目标阶段 | 完成度估算 | 结论 |
| --- | ---: | --- |
| 实验性 MVP 插件 | 85%–90% | 已基本达到；核心文件协议、命令、hooks、MCP、schema、验证脚本齐全。 |
| 可公开试用 Beta 插件 | 75%–80% | 接近；还需要端到端 dogfood 测试和生成物一致性校验。 |
| 稳定 v1.0 插件 | 60%–70% | 尚未达到；需要实战打磨、严格模式产品化、跨文件校验和更完整文档。 |
| 企业级 AI SDLC 治理框架 | 35%–45% | 仍是长期目标；企业治理、外部系统集成和组织级策略尚未实现。 |

一句话判断：

> `spec-flow-kit` 已经是一个结构完整、可安装、可本地实验使用的 Claude Code 插件 MVP；下一阶段重点应从“补齐文件”转向“真实端到端使用验证、生成物校验和产品化体验”。

## 2. 本次执行的校验

本次完成度检查前已执行完整本地验证：

```text
npm run validate
```

结果：通过。

覆盖内容：

- marketplace 结构校验；
- `spec-flow-kit` 结构校验；
- MCP state server smoke test；
- hook smoke test；
- Claude Code plugin validate。

同时执行严格 Claude 插件校验：

```text
npm run validate:claude:strict
```

结果：通过。

## 3. 已完成能力

### 3.1 Marketplace 基础

当前仓库已经是有效的 Claude Code plugin marketplace：

- 根 marketplace manifest 存在；
- `spec-flow-kit` 已注册为 marketplace 插件；
- Claude 官方插件校验通过；
- README 中包含安装、验证、结构和 marketplace 命令说明。

完成度判断：90%–95%。

### 3.2 插件骨架

`spec-flow-kit` 当前包含：

- `.claude-plugin/plugin.json`；
- slash commands；
- agents；
- skills；
- hooks；
- schemas；
- templates；
- MCP state server；
- README 和方案文档。

插件结构已经比较完整，结构校验脚本会检查 commands、agents、skills、hooks、schemas、templates 和 MCP 入口。

完成度判断：约 90%。

### 3.3 Slash commands

当前已有 13 个命令：

```text
/sfk-init
/sfk-requirements
/sfk-use
/sfk-design
/sfk-plan
/sfk-development
/sfk-verify
/sfk-rules-sync
/sfk-audit
/sfk-next
/sfk-deliver
/sfk-deploy
/sfk-status
```

这些命令覆盖了从初始化、需求、设计、计划、开发、验证，到规则同步、审计、交付和部署 runbook 的完整路径。

需要注意：这些命令目前是 prompt-only workflow commands，不是传统 CLI runtime。它们依赖 Claude Code 按命令说明读取、写入和维护 `.spec-flow-kit/` 文件协议。

完成度判断：80%–85%。

### 3.4 文件协议、模板和 schema

当前已经包含：

- `flow.yaml`；
- `state.json`；
- `gates.json`；
- `project-profile.yaml`；
- `rules.yaml`；
- requirements / design / ADR / tasks / test-plan / verification 模板；
- traceability / evidence / status / waivers / runs 模板；
- 对应 JSON schemas。

完成度判断：约 85%。

不足：模板仍保留大量 `TODO` 占位，这是模板本身可以接受，但说明还需要通过真实项目使用来继续精炼。

### 3.5 Hooks

当前已有：

- `stop-summary.js`；
- `post-edit-trace.js`；
- `rules-compliance-check.js`；
- `pre-edit-gate.js`；
- `pre-test-gate.js`；
- `pre-deploy-gate.js`；
- `hooks.json`。

hook smoke test 已覆盖：

- stop summary 能读取 active feature；
- post edit 能提示未追踪文件；
- rules compliance 能提示相关规则；
- strict mode 下 pre-edit 能阻断；
- pre-test 能在满足条件时放行测试命令；
- pre-deploy 默认阻断 deploy-like 命令。

当前 `hooks.json` 默认只注册 advisory hooks，strict gate 脚本存在但未默认启用。这符合安全边界，但也意味着 strict mode 还需要进一步产品化。

完成度判断：75%–80%。

### 3.6 MCP 状态服务

当前 MCP server 暴露以下工具：

```text
sfk.get_state
sfk.get_current_stage
sfk.get_traceability
sfk.update_gate
sfk.record_evidence
sfk.next_action
```

MCP smoke test 已通过，说明最小状态查询与工具列表能力可用。

完成度判断：70%–75%。

不足：

- 写入操作尚未强制 schema 校验；
- `record_evidence` 仅追加 JSONL，不校验 evidence schema；
- `update_gate` 对 gate/status 允许值约束较弱；
- 没有并发锁、冲突检测和完整 feature lifecycle 操作。

## 4. 当前主要缺口

### 4.1 缺少真实端到端 dogfood 测试

当前测试主要是结构校验和 smoke test，还缺少一个真实 fixture 项目端到端流程：

```text
安装插件
→ /sfk-init
→ /sfk-requirements
→ /sfk-design
→ /sfk-plan
→ /sfk-development
→ /sfk-verify
→ /sfk-status
→ /sfk-audit
```

应检查最终 `.spec-flow-kit/` 产物是否完整、一致、符合 schema，且 traceability/evidence 是否可信。

这是从“结构完整”进入“真实可用”的最大缺口。

### 4.2 Prompt-only 命令稳定性需要实战验证

命令说明已经比较完整，但 prompt-only workflow 的可靠性取决于 Claude 执行时是否稳定遵守约束，例如：

- 不覆盖用户已有文件；
- gate 状态更新一致；
- `traceability.md` 和 `traceability.json` 同步；
- evidence 不被伪造；
- 多 feature 切换可靠；
- `runs.jsonl` 持续维护；
- 失败和阻塞状态记录清晰。

这些需要在真实项目中反复 dogfood 后调优 prompt。

### 4.3 Schema 存在，但运行时强校验不足

当前 schema 文件存在并可解析，但还需要增强：

- 对模板实例运行 schema validation；
- 对 MCP 写入结果运行 schema validation；
- 对 `/sfk-*` 生成的 `.spec-flow-kit/` 工作区做整体校验；
- 对 `evidence.jsonl` 每一行做 schema 校验；
- 对 `status.json`、`gates.json`、`traceability.json` 做跨文件一致性校验。

建议后续增加类似：

```text
npm run validate:spec-flow-kit:fixtures
npm run smoke:spec-flow-kit:e2e
```

### 4.4 Strict mode 尚未完整产品化

strict gate 脚本已经存在，并且 smoke test 证明能够阻断。但用户体验还需要补齐：

- 如何启用 strict mode；
- 如何安装或注册 strict hooks；
- 如何创建 waiver；
- 如何临时 bypass；
- strict hooks 的错误信息和恢复路径；
- 团队共享配置方式。

### 4.5 企业级治理仍是长期方向

当前已经覆盖本地治理 MVP，但企业级能力仍未完成，例如：

- GitHub/GitLab CI 状态读取；
- Jira/Linear ticket 关联；
- PR review evidence；
- 组织级 rules；
- policy-as-code；
- 审计报告导出；
- 多人协作冲突处理；
- 跨仓库或多 worktree 状态治理。

## 5. 分模块完成度估算

| 模块 | 完成度 | 判断 |
| --- | ---: | --- |
| Marketplace 结构 | 90%–95% | 已通过 Claude strict validate。 |
| 插件 manifest / 文档 | 85%–90% | 可读性较好，但 README 仍有“计划/开发中”措辞。 |
| Slash commands | 80%–85% | 数量齐全，prompt-only；需实战验证。 |
| Templates / Schemas | 85% | 文件齐全，需实例校验增强。 |
| Agents / Skills | 75%–80% | MVP 足够，后续专业角色还未扩展。 |
| Hooks | 75%–80% | advisory 可用，strict 未完整产品化。 |
| MCP state server | 70%–75% | MVP 可用，写入校验、并发和生命周期能力较弱。 |
| 测试 / CI | 80% | 结构和 smoke 足够，缺端到端 dogfood。 |
| 发布就绪 | 70%–75% | 可以实验发布，不建议标记 stable。 |

## 6. 推荐下一步

优先级建议：

1. 增加端到端 dogfood fixture。
2. 增加 `.spec-flow-kit/` 生成物 schema 校验。
3. 增强 evidence / traceability / gates 的跨文件一致性检查。
4. 补充 strict mode 启用、waiver 和恢复路径文档。
5. 在真实项目中完整跑一次 `/sfk-*` 工作流，根据结果调优 prompt。
6. 将 README 中仍偏“计划中”的措辞改成更准确的 MVP / Beta 状态说明。

## 7. 阶段判断

```text
插件骨架：已完成
MVP 功能：基本完成
实验性可用：已达到
Beta：接近，但还需要端到端 dogfood 测试
Stable / v1.0：尚未达到
企业级治理框架：仍是长期目标
```

最终结论：

> 当前最值得投入的是端到端 dogfood 测试和生成物强校验。完成这两项后，`spec-flow-kit` 可以比较有底气地从 experimental MVP 推进到 beta。
