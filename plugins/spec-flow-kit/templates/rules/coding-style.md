# 编码风格规则

## 目的

描述项目特定的代码风格、错误处理、日志和可维护性规则。

## 命名

- 函数：TODO
- 类 / 类型：TODO
- 文件：TODO

## 错误处理

- 不要静默吞掉错误，除非有明确理由。
- 面向用户的失败信息应尽可能可操作。

## 日志

- 不要记录 secrets、token、password、private key 或 credentials。
- 如果项目已有结构化日志，关键业务路径优先使用结构化日志。

## 安全

- 在边界处校验不可信输入。
- 避免将敏感数据写入 `.spec-flow-kit/` reports 或 evidence 文件。

## 执行方式

默认等级：强制（required）  
默认状态：active  
默认执行模式：strict

等级说明：

- 强制（required）：必须满足，在 strict 模式下可作为阻断依据。
- 推荐（recommended）：建议遵守，通常形成改进建议。
- 参考（informational）：提供上下文，不应作为阻断依据。
