---
description: 初始化 spec-flow-kit 工作区
argument-hint: [项目说明]
---

# /sfk-init

你正在执行 `spec-flow-kit` 的初始化命令。

## 目标

在当前项目中初始化 `.spec-flow-kit/` 工作区。新建文件时必须以插件 `templates/` 中对应文件为基准创建完整内容；已有文件时必须保留用户内容，并只按模板补齐缺失结构。

## 输入

用户参数：`$ARGUMENTS`

参数可为空。若用户提供项目说明，应将其作为 project profile 的辅助上下文。

## 必须遵守

- 默认使用中文编写 Markdown 产物。
- JSON / JSONL / YAML 字段名保持英文。
- 不修改业务代码。
- 不运行安装、测试、构建或部署命令。
- 不无提示覆盖用户已有 `.spec-flow-kit/` 文件。
- 如果发现已有 `.spec-flow-kit/`，先报告现状，并按“用户澄清门”逐步澄清用户要合并、补齐、跳过还是覆盖。
- 自动发现的规则只能先作为 `level: recommended`、`status: proposed`、`enforcement.mode: advisory` 的候选项，不得自动升级为 active / strict。

## 用户澄清门

在创建或补齐 `.spec-flow-kit/` 文件、修改 `project-profile.yaml`、`rules.yaml`、`gates.json` 或覆盖/合并已有内容之前，必须先判断是否存在用户拥有的未决信息。

用户拥有的未决信息包括但不限于：已有工作区处理方式、覆盖策略、规则升级/降级意图、项目事实确认、自动发现结果是否采纳或风险接受。

如果存在用户拥有的未决信息：

1. 立即停止，不写入任何文件，不更新 gate / status / traceability / evidence / runs。
2. 在 TUI 交互中逐步澄清（Step-by-Step Clarification），保持清爽的一问一答体验，不一次性输出问题清单。
3. 除非答案已经由用户输入、现有 artifacts、项目配置、rules 或源码 100% 明确给出，否则不得猜测。
4. 不在生成的 artifacts 中创建默认“待澄清问题”章节；需要澄清时应在写入前阻塞。

## 模板来源

创建或补齐基础文件时，以插件内置模板作为结构基准：

```text
plugins/spec-flow-kit/templates/flow.yaml
plugins/spec-flow-kit/templates/state.json
plugins/spec-flow-kit/templates/gates.json
plugins/spec-flow-kit/templates/project-profile.yaml
plugins/spec-flow-kit/templates/rules.yaml
plugins/spec-flow-kit/templates/rules/engineering-structure.md
plugins/spec-flow-kit/templates/rules/development-process.md
plugins/spec-flow-kit/templates/rules/coding-style.md
plugins/spec-flow-kit/templates/rules/testing-rules.md
```

- 文件不存在：按对应模板创建完整内容。
- 文件已存在：不得盲目覆盖；按模板检查并补齐缺失字段、缺失列表项或缺失说明。
- `project-profile.yaml` 中自动探测结果只填充空值、`null`、`unknown`，不得覆盖用户已有配置。
- `rules.yaml` 中插件内置模板规则默认 `level: required`、`status: active`、`enforcement.mode: strict`。
- 自动发现的新规则候选仍默认 `level: recommended`、`status: proposed`、`enforcement.mode: advisory`。

## 执行步骤

1. 检查当前目录是否已经存在 `.spec-flow-kit/`。
2. 探测项目基本信息：
   - 项目名称。
   - 项目目录结构
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
4. 按“模板来源”创建或补齐以下文件；新建时复制完整模板，补齐时只补缺失项，不覆盖用户已有值：

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
   - 哪些文件按模板新建。
   - 哪些文件按模板补齐。
   - 哪些已有字段因用户已有值而保留。
   - 自动探测到了哪些命令。
   - 哪些字段仍为 `unknown` 或需要后续人工复核。
   - 下一步建议。

## 输出要求

最后输出中文摘要，格式如下：

```text
spec-flow-kit 初始化结果

已创建：
- ...

已保留：
- ...

需后续复核：
- ...

下一步：
- 完善 rules/ 中的规则
- /sfk-requirements "你的需求"
```