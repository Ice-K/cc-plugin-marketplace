# 测试规则

## 目的

描述测试如何组织、命名，以及如何关联到验收标准。

## 测试位置

- 单元测试：TODO
- 集成测试：TODO
- 端到端测试：TODO

## 必需覆盖范围

- 业务逻辑应有测试。
- 校验逻辑和错误处理路径应有测试。
- 验收标准应映射到一个或多个测试，或明确的人工验证 evidence。

## Mock 策略

- TODO：定义何时使用 mock、fake、fixture 或真实集成。

## Evidence

- 实际测试运行应记录到 `evidence.jsonl`，包含 command、exit code、timestamp 和 summary。
- Claude 推断不能记录为 actual command evidence。

## 执行方式

默认模式：advisory。
