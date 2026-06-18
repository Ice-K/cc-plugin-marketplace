---
description: 同步规则索引和规则文件列表
argument-hint: [--check|--apply]
---

# /sfk-rules-sync

你正在执行 `spec-flow-kit` 的规则同步命令。

## 目标

扫描 `.spec-flow-kit/rules/*.md`，检查并同步 `.spec-flow-kit/rules.yaml` 与 `.spec-flow-kit/project-profile.yaml` 中的 `rules.files`，让后续 design、plan、development、verify、status 和 audit 能读取一致的规则来源。

## 输入

用户参数：`$ARGUMENTS`

支持：

```text
/sfk-rules-sync
/sfk-rules-sync --check
/sfk-rules-sync --apply
```

模式说明：

1. 无参数：默认执行检查，输出差异和建议；如需要写入，先说明将修改的文件并请求用户确认。
2. `--check`：只读检查，不写入文件。
3. `--apply`：允许同步 `rules.yaml` 和 `project-profile.yaml`，但仍不修改 `rules/*.md` 正文。

## 前置条件

- `.spec-flow-kit/` 已初始化。
- `.spec-flow-kit/project-profile.yaml` 存在。
- `.spec-flow-kit/rules.yaml` 存在。
- `.spec-flow-kit/rules/` 存在。

如果前置条件不满足，提示先运行 `/sfk-init` 或手动补齐缺失文件。

## 必须遵守

- 默认使用中文输出。
- JSON / YAML 字段名保持英文。
- 不修改业务代码。
- 不运行 Bash。
- 不无提示覆盖用户手写的 `rules/*.md`。
- 不自动删除规则正文文件。
- 不自动删除 `project-profile.yaml` 中用户手动添加且文件仍存在的 `rules.files` 条目。
- 对文件已不存在的 `rules.files` 条目，先列为候选移除项；只有 `--apply` 或用户确认后才移除。
- 新发现规则文件默认写入 `rules.yaml` 时使用 `level: recommended`、`status: proposed`、`enforcement.mode: advisory`。
- 不自动把新发现规则升级为 `active` 或 `strict`。
- 保留用户已有的 strict / active 配置；不要把用户已确认的严格规则降级。
- 不把 Claude 推断当成用户确认。
- secrets、token、private key、credentials 不应写入规则索引、报告或命令输出。

## 读取文件

必须读取：

- `.spec-flow-kit/project-profile.yaml`
- `.spec-flow-kit/rules.yaml`
- `.spec-flow-kit/rules/*.md`

按需读取：

- `.spec-flow-kit/state.json`
- `.spec-flow-kit/gates.json`

## 检查内容

### rules.files 同步状态

检查：

- `project-profile.yaml` 中 `rules.files` 指向的文件是否存在。
- `.spec-flow-kit/rules/*.md` 是否都被 `rules.files` 引用。
- `rules.files` 是否存在重复条目。
- `rules.files` 是否使用项目相对路径，例如 `.spec-flow-kit/rules/coding-style.md`。

### rules.yaml 索引状态

检查：

- `rules.yaml` 是否包含 `version`、`priority`、`rules`。
- `rules[]` 是否包含必需字段：
  - `id`
  - `title`
  - `level`
  - `source`
  - `scope`
  - `appliesTo`
  - `enforcement.mode`
  - `status`
- `rules[].source` 指向的文件是否存在。
- 是否存在未索引的规则文件。
- 是否存在已删除但仍被 `rules.yaml` 引用的 source。
- 是否存在可能失效的 `sourceLines`。
- 是否存在非 schema 枚举值。

### 新发现规则候选默认值约束

新建候选规则时默认使用：

```yaml
level: recommended
scope: project
appliesTo:
  - design
  - development
  - verification
enforcement:
  mode: advisory
status: proposed
```

Rule ID 建议格式：

```text
RULE-<CATEGORY>-<NUMBER>
```

如果无法从规则正文可靠提取标题，使用文件名生成候选标题，并将该项列入“需要用户确认”。

## 执行步骤

1. 判断运行模式：默认 / `--check` / `--apply`。
2. 检查 `.spec-flow-kit/`、`project-profile.yaml`、`rules.yaml` 和 `rules/` 是否存在。
3. 扫描 `.spec-flow-kit/rules/*.md`。
4. 读取并分析 `project-profile.yaml` 的 `rules.files`。
5. 读取并分析 `rules.yaml` 的 `rules[]`。
6. 生成差异清单：
   - 新增规则文件。
   - 缺失规则文件。
   - 未被 `rules.files` 引用的规则文件。
   - 已不存在但仍被引用的规则文件。
   - 未被 `rules.yaml` 索引的规则文件。
   - `rules.yaml` 中 source 不存在的规则。
   - 需要用户确认的字段。
7. 如果是 `--check`：只输出检查结果，不写入。
8. 如果是无参数：输出建议变更；如需要写入，先请求用户确认。
9. 如果是 `--apply`：
   - 更新 `project-profile.yaml` 中的 `rules.files`。
   - 更新 `rules.yaml` 中的 `rules[]`。
   - 对新发现规则使用 `status: proposed` 和 `enforcement.mode: advisory`。
   - 保留用户已有的 level、scope、appliesTo、status、enforcement 配置，除非这些值不符合 schema。
10. 更新 `gates.json` 中的 `rules-ready`：
    - 同步完成且无阻塞缺口时标记 `passed`。
    - 存在缺失文件、冲突或需要用户确认时标记 `blocked`。
    - 检查失败或文件格式无法解析时标记 `failed`。
11. 输出中文摘要和下一步建议。

## 写入范围

`--apply` 或用户确认后，只允许修改：

```text
.spec-flow-kit/project-profile.yaml
.spec-flow-kit/rules.yaml
.spec-flow-kit/gates.json
```

不允许修改：

```text
.spec-flow-kit/rules/*.md
业务代码
测试代码
部署脚本
```

## 输出要求

```text
规则同步结果

Mode: check / apply
Gate: rules-ready = passed / blocked / failed

扫描到的规则文件：
- .spec-flow-kit/rules/coding-style.md

rules.files：
- 已引用：N
- 待新增：N
- 待移除：N
- 重复项：N

rules.yaml：
- 已索引规则：N
- 待新增候选规则：N
- source 缺失：N
- sourceLines 可能失效：N

已更新：
- project-profile.yaml: yes / no
- rules.yaml: yes / no
- gates.json: yes / no

需要用户确认：
- ...

下一步：
- /sfk-status
```
