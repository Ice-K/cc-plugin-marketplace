---
description: 初始化 spec-flow-kit 工作区
argument-hint: [项目说明]
---

# /sfk-init

你正在执行 `spec-flow-kit` 的初始化命令。

## 目标

在当前项目中初始化 `.spec-flow-kit/` 工作区，生成本地 SDD 文件协议所需的基础文件和规则模板。

## 输入

用户参数：`$ARGUMENTS`

参数可为空。若用户提供项目说明，应将其作为 project profile 的辅助上下文。

## 必须遵守

- 默认使用中文编写 Markdown 产物。
- JSON / JSONL / YAML 字段名保持英文。
- 不修改业务代码。
- 不运行安装、测试、构建或部署命令。
- 不无提示覆盖用户已有 `.spec-flow-kit/` 文件。
- 如果发现已有 `.spec-flow-kit/`，先报告现状，并询问用户要合并、补齐、跳过还是覆盖。
- 自动发现的规则只能先作为 `proposed` 或 advisory，不得自动变成 strict。

## 执行步骤

1. 检查当前目录是否已经存在 `.spec-flow-kit/`。
2. 探测项目基本信息：
   - 项目名称。
   - 项目类型。
   - 主要语言。
   - 包管理器。
   - 可能的 lint / typecheck / test / build 命令。
3. 只读检查常见项目文件：
   - `README.md`
   - `CONTRIBUTING.md`
   - `CLAUDE.md`
   - `package.json`
   - `pyproject.toml`
   - `go.mod`
   - `pom.xml`
   - `Makefile`
   - `.editorconfig`
   - lint / format / test 配置
4. 创建或补齐以下文件：

```text
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
```

5. `project-profile.yaml` 中只自动填补空值，不覆盖用户已有配置。
6. `rules.yaml` 中自动发现的规则默认使用：

```yaml
status: proposed
enforcement:
  mode: advisory
```

7. 输出初始化结果，包括：
   - 创建了哪些文件。
   - 跳过了哪些已有文件。
   - 自动探测到了哪些命令。
   - 哪些字段需要用户手动确认。
   - 下一步建议。

## 输出要求

最后输出中文摘要，格式如下：

```text
spec-flow-kit 初始化结果

已创建：
- ...

已保留：
- ...

需要用户确认：
- ...

下一步：
- 完善 rules/ 中的规则
- /sfk-requirements "你的需求"
```
