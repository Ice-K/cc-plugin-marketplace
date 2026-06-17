# spec-flow-kit 初始化模板说明增强设计

日期：2026-06-17

## 背景

`/sfk-init` 初始化后的 `flow.yaml`、`gates.json`、`project-profile.yaml`、`rules.yaml`、`state.json` 需要更详细的自解释说明。用户希望说明直接写在初始化文件本身，不新增说明文档。其中 YAML 文件的说明集中写在文件最上方；有固定取值的字段必须列出全部取值及含义。

## 目标

- 增强 5 个初始化模板的可读性和可维护性。
- 让用户打开文件顶部或 comment 字段即可理解文件用途、字段含义、维护方式和固定取值。
- 保持现有协议字段、默认值和命令行为不变。
- 遵守 rules-governance：自动发现规则保持 `proposed` 和 `advisory`，不自动变为 strict。

## 非目标

- 不新增 `.spec-flow-kit/README.md`。
- 不修改业务代码。
- 不改变 `/sfk-init` 的执行流程。
- 不改变协议版本。
- 不把规则自动升级为 strict。

## 设计

### YAML 模板

`flow.yaml`、`project-profile.yaml`、`rules.yaml` 的详细说明集中放在文件顶部，避免在每个字段旁边堆叠大量注释。已有少量字段内联注释可保留或简化，但主要说明应位于顶部。

顶部说明应覆盖：

- 文件用途。
- 哪些命令会读取或维护该文件。
- 用户通常什么时候需要手动修改。
- 固定取值字段的完整枚举及解释。
- 与其他初始化文件的关系。

#### `flow.yaml`

顶部说明列出：

- `stages[].id`：阶段标识，默认包括 `init`、`requirements`、`use`、`design`、`plan`、`development`、`verification`、`status`。
- `stages[].command`：阶段对应 slash command。
- `stages[].gate`：阶段完成条件；`null` 表示查询型阶段不需要 gate。
- `stages[].next`：推荐下一阶段；`null` 表示流程终点。

说明应强调用户通常不需要修改流程；如果调整阶段顺序或 gate 名称，需要同步相关命令预期和 `gates.json`。

#### `project-profile.yaml`

顶部说明列出固定取值建议：

- `project.type`：`unknown`、`web-api`、`frontend-app`、`fullstack-app`、`cli`、`library`、`service`、`monorepo`、`other`。
- `project.language`：`unknown`、`javascript`、`typescript`、`python`、`go`、`java`、`rust`、`csharp`、`other`。
- `project.packageManager`：`unknown`、`pnpm`、`npm`、`yarn`、`bun`、`pip`、`uv`、`poetry`、`go`、`maven`、`gradle`、`cargo`、`dotnet`、`other`。
- `environments.*.requiresApproval`：`true` 表示执行前需要用户显式确认；`false` 表示仍由命令策略决定，但不额外要求环境级确认。
- `production.deploy` 默认 `manual`，表示只生成 runbook，不自动部署。

说明应强调 `/sfk-init` 只探测和填补空值，不自动运行安装、测试、构建或部署命令。

#### `rules.yaml`

顶部说明列出固定取值：

- `priority` 项：`feature`、`project`、`team`、`organization`、`plugin-default`，从高到低处理冲突。
- `rules[].level`：`required`、`recommended`、`informational`。
- `rules[].scope`：`feature`、`project`、`team`、`organization`、`plugin-default`。
- `rules[].appliesTo`：`requirements`、`design`、`plan`、`development`、`verification`、`audit`、`delivery`、`deploy`。
- `rules[].enforcement.mode`：`advisory`、`strict`。
- `rules[].status`：`proposed`、`active`、`deprecated`。

说明应明确：`rules/*.md` 是规则正文，`rules.yaml` 是结构化索引；自动发现的规则默认 `proposed` + `advisory`；strict 必须由用户明确启用。

### JSON 模板

JSON 不能使用 `#` 注释，因此保留合法 `_comment` / `*_comment` 字段。说明应集中在顶层 `_comment` 和必要的局部 comment 字段，避免对每个普通字段都创建镜像说明字段。

#### `gates.json`

顶层 `_comment` 应列出：

- 文件用途：记录全局 gate 状态。
- `mode` 固定取值：
  - `advisory`：只提示风险或缺口，不阻断命令。
  - `strict`：允许 hook 或命令根据 gate 状态阻断高风险操作，必须由用户显式启用。
- gate `status` 固定取值：
  - `pending`：尚未评估。
  - `passed`：已通过。
  - `failed`：评估失败。
  - `blocked`：存在阻塞项，不能进入下一阶段。
  - `waived`：通过显式豁免继续推进。
- `evidence` 用于记录证据引用，不应包含密钥或大段日志。
- `updatedAt` 通常由工具维护。

#### `state.json`

顶层 `_comment` 应列出：

- 文件用途：记录全局状态、active feature、gate 模式和 feature 索引。
- `activeFeature`：当前默认 feature；为 `null` 时命令需要显式 feature 或提示用户选择。
- `gateMode` 固定取值：
  - `advisory`：默认提示模式。
  - `strict`：严格 gate 模式，必须由用户显式启用。
- `workspace.gitBranch` / `workspace.gitRef` 是元数据，不会自动切换分支。
- `features` 条目结构：`path`、`stage`、`branch`、`lastUpdatedAt`。
- feature `stage` 建议取值：`requirements`、`design`、`plan`、`development`、`verification`、`delivery`、`completed`、`blocked`。
- `updatedAt` 通常由工具维护。

## 测试和验证

- 检查 5 个模板仍为合法 YAML / JSON。
- 运行现有 spec-flow-kit smoke 测试，确保 MCP 和模板读取逻辑不受说明字段影响。
- 人工检查固定取值说明是否完整、中文清晰且不与 rules-governance 冲突。

## 风险

- JSON comment 字段会增加文件体积，但保持合法 JSON 且不改变现有工具读取路径。
- 如果未来枚举取值扩展，需要同步更新顶部说明。
