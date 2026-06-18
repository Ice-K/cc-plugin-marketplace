# 开发流程规则

## 目的

描述 feature 工作如何从需求推进到验证。

## Feature 工作流

- 在设计和实现前，先创建或选择一个 feature。
- 当任务、代码、测试或 evidence 发生变化时，保持 `traceability.json` 更新。
- 在验证前使用 `/sfk-status` 检查缺口。

## 分支和 worktree 策略

- feature 可以记录当前 branch 和 git ref 作为元数据。
- spec-flow-kit 不会自动切换 branch 或 worktree。
- 如果 active feature 记录的 branch 与当前 branch 不一致，strict 模式下应作为阻断项或要求用户确认后继续。

## Commit 策略

- TODO：定义 commit 是否必须包含 feature ID 或 task ID。

## 执行方式

默认等级：强制（required）  
默认状态：active  
默认执行模式：strict

等级说明：

- 强制（required）：必须满足，在 strict 模式下可作为阻断依据。
- 推荐（recommended）：建议遵守，通常形成改进建议。
- 参考（informational）：提供上下文，不应作为阻断依据。
