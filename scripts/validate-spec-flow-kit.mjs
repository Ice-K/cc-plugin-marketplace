#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const pluginRoot = join(root, 'plugins', 'spec-flow-kit');
const errors = [];

const EXPECTED_COMMANDS = [
  'sfk-init',
  'sfk-requirements',
  'sfk-use',
  'sfk-design',
  'sfk-plan',
  'sfk-development',
  'sfk-verify',
  'sfk-rules-sync',
  'sfk-audit',
  'sfk-next',
  'sfk-deliver',
  'sfk-deploy',
  'sfk-status',
];

const EXPECTED_AGENTS = [
  'requirements-analyst',
  'system-designer',
  'verification-auditor',
];

const EXPECTED_SKILLS = [
  'sdd-core',
  'traceability-evidence',
  'rules-governance',
];

const EXPECTED_HOOKS = [
  'stop-summary.js',
  'post-edit-trace.js',
  'rules-compliance-check.js',
  'pre-edit-gate.js',
  'pre-test-gate.js',
  'pre-deploy-gate.js',
];

const EXPECTED_SCHEMAS = [
  'flow.schema.json',
  'state.schema.json',
  'gates.schema.json',
  'traceability.schema.json',
  'evidence.schema.json',
  'feature-status.schema.json',
  'project-profile.schema.json',
  'rules.schema.json',
  'waivers.schema.json',
];

const EXPECTED_TEMPLATES = [
  'flow.yaml',
  'state.json',
  'gates.json',
  'project-profile.yaml',
  'rules.yaml',
  'requirements.md',
  'design.md',
  'adr.md',
  'tasks.md',
  'test-plan.md',
  'verification.md',
  'traceability.md',
  'traceability.json',
  'status.json',
  'waivers.json',
  'evidence.jsonl',
  'runs.jsonl',
];

const TEMPLATE_EXPLANATION_EXPECTATIONS = {
  'templates/flow.yaml': {
    topComment: [
      '文件用途：定义 spec-flow-kit 默认 SDD 阶段流转',
      'stages[].id 固定阶段：init、requirements、use、design、plan、development、verification、status',
      'gate: null 表示该阶段是查询或辅助阶段，不需要 gate',
      'next: null 表示流程终点',
      '修改阶段顺序、gate 名称或 command 时，需要同步 gates.json 和相关 /sfk-* 命令预期',
    ],
  },
  'templates/project-profile.yaml': {
    topComment: [
      'project.type 建议值：unknown、web-api、frontend-app、fullstack-app、cli、library、service、monorepo、other',
      'unknown：尚未确认项目类型。',
      'web-api：后端 HTTP/API 服务。',
      'frontend-app：前端应用。',
      'fullstack-app：同时包含前端和后端的应用。',
      'cli：命令行工具。',
      'library：库或 SDK。',
      'service：后台服务、worker 或 daemon。',
      'monorepo：多包或多项目仓库。',
      'other：不属于以上类型。',
      'project.language 建议值：unknown、javascript、typescript、python、go、java、rust、csharp、other',
      'unknown：尚未确认主要语言。',
      'javascript：JavaScript 项目。',
      'typescript：TypeScript 项目。',
      'python：Python 项目。',
      'go：Go 项目。',
      'java：Java 项目。',
      'rust：Rust 项目。',
      'csharp：C# / .NET 项目。',
      'other：主要语言不在上述列表中。',
      'project.packageManager 建议值：unknown、pnpm、npm、yarn、bun、pip、uv、poetry、go、maven、gradle、cargo、dotnet、other',
      'unknown：尚未确认包管理器。',
      'pnpm：Node.js 项目使用 pnpm 管理依赖。',
      'npm：Node.js 项目使用 npm 管理依赖。',
      'yarn：Node.js 项目使用 yarn 管理依赖。',
      'bun：JavaScript/TypeScript 项目使用 bun 管理依赖或执行脚本。',
      'pip：Python 项目使用 pip 管理依赖。',
      'uv：Python 项目使用 uv 管理依赖或虚拟环境。',
      'poetry：Python 项目使用 Poetry 管理依赖和打包。',
      'go：Go 工具链直接管理依赖与构建。',
      'maven：Java 项目使用 Maven 管理依赖与构建。',
      'gradle：Java/JVM 项目使用 Gradle 管理依赖与构建。',
      'cargo：Rust 项目使用 Cargo 管理依赖与构建。',
      'dotnet：.NET CLI 管理依赖、构建与测试。',
      'other：其他包管理或构建工具。',
      'requiresApproval: true 表示执行前必须获得用户显式确认',
      'production.deploy: manual 表示只生成部署说明或 runbook，不自动部署',
    ],
  },
  'templates/rules.yaml': {
    topComment: [
      'priority 固定优先级：feature > project > team > organization > plugin-default',
      'rules[].level 固定值：required、recommended、informational',
      'rules[].scope 固定值：feature、project、team、organization、plugin-default',
      'feature：仅对当前 feature 生效的临时或局部规则。',
      'project：当前仓库或项目范围内的规则。',
      'team：团队共享的工程规则。',
      'organization：组织级统一规则。',
      'plugin-default：插件自带的默认规则。',
      'rules[].appliesTo 建议值：requirements、design、plan、development、verification、audit、delivery、deploy',
      'rules[].enforcement.mode 固定值：advisory、strict',
      'rules[].status 固定值：proposed、active、deprecated',
      '自动发现的规则默认保持 status: proposed 和 enforcement.mode: advisory',
    ],
  },
  'templates/gates.json': {
    fields: {
      _comment: [
        '文件用途：记录 spec-flow-kit 全局 gate 状态',
        'mode 固定值：advisory、strict',
        'advisory：只提示风险或缺口，不阻断命令',
        'strict：允许 hook 或命令根据 gate 状态阻断高风险操作，必须由用户显式启用',
        'status 固定值：pending、passed、failed、blocked、waived',
        'pending：尚未评估。',
        'passed：已通过。',
        'failed：评估失败。',
        'blocked：存在阻塞项，不能进入下一阶段。',
        'waived：通过显式豁免继续推进。',
        'evidence 用于记录证据引用，不应包含密钥、令牌或大段日志',
      ],
    },
  },
  'templates/state.json': {
    fields: {
      _comment: [
        '文件用途：记录 spec-flow-kit 全局状态、active feature、gate 模式和 feature 索引',
        'activeFeature 为 null 时，命令需要显式 FEATURE-ID 或提示用户运行 /sfk-use',
        'gateMode 固定值：advisory、strict',
        'advisory：默认提示模式，只报告风险或缺口。',
        'strict：严格 gate 模式，必须由用户显式启用。',
        'workspace.gitBranch 和 workspace.gitRef 只是元数据，不会自动切换分支',
        'features 条目结构：path、stage、branch、lastUpdatedAt',
        'state.json 通常由 /sfk-init、/sfk-requirements 和 /sfk-use 维护；只有状态异常时才建议人工修正。',
        'stage 可使用完整词汇：draft、requirements、requirements_ready、design、design_ready、plan、development、development_in_progress、development_ready、verification、verification_passed、verification_blocked、verification_failed、delivery、completed、blocked。',
        'draft：feature 已登记，但需求尚未整理完成。',
        'requirements：正在编写或补充 requirements。',
        'requirements_ready：requirements 已完成，可进入 design。',
        'design：正在编写或补充 design。',
        'design_ready：design 已完成，可进入 plan。',
        'plan：正在编写或补充 tasks、test-plan 等计划内容。',
        'development：泛指开发阶段；用于只需要粗粒度阶段标记的兼容场景。',
        'development_in_progress：正在实现代码、测试或联调。',
        'development_ready：开发产出已就绪，可进入 verification。',
        'verification：正在执行验证、补证据或修复验证问题。',
        'verification_passed：验证通过，可进入 delivery 或归档。',
        'verification_blocked：验证被阻塞，需先清除阻塞项。',
        'verification_failed：验证明确失败，需修复后重新验证。',
        'delivery：正在整理交付、发布或变更说明。',
        'completed：feature 生命周期已完成。',
        'blocked：feature 在当前阶段整体受阻，无法继续推进。',
      ],
      featuresComment: [
        'Feature 索引。创建 feature 后会按 FEATURE-ID 增加条目，例如 AUTH-LOCK-001。',
        '每个条目应包含 path、stage、branch 和 lastUpdatedAt',
        'stage 可使用完整词汇：draft、requirements、requirements_ready、design、design_ready、plan、development、development_in_progress、development_ready、verification、verification_passed、verification_blocked、verification_failed、delivery、completed、blocked。',
      ],
    },
  },
};

function error(message) {
  errors.push(message);
}

function assertFile(relativePath) {
  const filePath = join(pluginRoot, relativePath);
  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    error(`Missing file: plugins/spec-flow-kit/${relativePath}`);
  }
}

function readText(relativePath) {
  const filePath = join(pluginRoot, relativePath);
  if (!existsSync(filePath)) return '';
  return readFileSync(filePath, 'utf8');
}

function readJson(relativePath) {
  const filePath = join(pluginRoot, relativePath);
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch (parseError) {
    error(`Invalid JSON in plugins/spec-flow-kit/${relativePath}: ${parseError.message}`);
    return null;
  }
}

function assertFrontmatter(relativePath, requiredKeys) {
  const text = readText(relativePath);
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!match) {
    error(`Missing YAML frontmatter: plugins/spec-flow-kit/${relativePath}`);
    return;
  }

  for (const key of requiredKeys) {
    const pattern = new RegExp(`^${key}:\\s*\\S`, 'm');
    if (!pattern.test(match[1])) error(`Missing frontmatter key "${key}" in plugins/spec-flow-kit/${relativePath}`);
  }
}

function assertMentioned(relativePath, expectedText) {
  const text = readText(relativePath);
  if (!text.includes(expectedText)) {
    error(`plugins/spec-flow-kit/${relativePath} does not mention ${expectedText}`);
  }
}

function getTopCommentBlock(text, relativePath) {
  const lines = text.split(/\r?\n/);
  const block = [];
  for (const line of lines) {
    if (line.startsWith('#') || line.trim() === '') {
      block.push(line);
      continue;
    }
    break;
  }

  if (block.length === 0) {
    error(`plugins/spec-flow-kit/${relativePath} is missing a top comment block`);
  }
  return block.join('\n');
}

const UNIFIED_OUTPUT_RULE = '不要在最终输出中重复声明权限边界';

const COMMAND_BOUNDARY_EXPECTATIONS = {
  'sfk-status': [
    '默认只读，不主动修改源码或 `.spec-flow-kit/` artifact。',
    '不主动运行 Bash；如需运行命令，应说明目的，并在安全命令白名单或用户确认范围内执行。',
  ],
  'sfk-next': [
    '默认只读，不主动修改源码或 `.spec-flow-kit/` artifact。',
    '不主动运行 Bash；如需运行命令，应说明目的，并在安全命令白名单或用户确认范围内执行。',
  ],
  'sfk-audit': [
    '默认只读，不主动修改源码或 `.spec-flow-kit/` artifact。',
    '不主动运行 Bash；如需运行命令，应说明目的，并在安全命令白名单或用户确认范围内执行。',
  ],
  'sfk-init': [
    '可以写入对应 `.spec-flow-kit/` 文件。',
    '可以在必要时运行只读或低风险命令辅助判断。',
  ],
  'sfk-requirements': [
    '可以写入对应 `.spec-flow-kit/` 文件。',
    '可以在必要时运行只读或低风险命令辅助判断。',
  ],
  'sfk-design': [
    '可以写入对应 `.spec-flow-kit/` 文件。',
    '可以在必要时运行只读或低风险命令辅助判断。',
  ],
  'sfk-plan': [
    '可以写入对应 `.spec-flow-kit/` 文件。',
    '可以在必要时运行只读或低风险命令辅助判断。',
  ],
  'sfk-rules-sync': [
    '可以写入对应 `.spec-flow-kit/` 文件。',
    '可以在必要时运行只读或低风险命令辅助判断。',
  ],
  'sfk-use': [
    '可以写入对应 `.spec-flow-kit/` 文件。',
    '可以在必要时运行只读或低风险命令辅助判断。',
  ],
  'sfk-verify': [
    '可以读取源码、测试、配置和 `.spec-flow-kit/` artifact。',
    '可以运行 lint、typecheck、test、build，优先使用 `project-profile.yaml` 或项目已有脚本。',
  ],
  'sfk-development': [
    '可以修改业务代码和测试代码。',
    '修改范围必须绑定目标 feature 和选定 task。',
  ],
  'sfk-deliver': [
    '默认生成交付说明、风险说明、runbook、环境检查和回滚步骤。',
    '不真正执行部署、发布、生产变更或数据迁移。',
  ],
  'sfk-deploy': [
    '默认生成交付说明、风险说明、runbook、环境检查和回滚步骤。',
    '不真正执行部署、发布、生产变更或数据迁移。',
  ],
};

const DISALLOWED_BROAD_BOUNDARY_PATTERNS = [
  /^- 不修改业务代码。$/m,
  /^- 默认不运行 Bash。$/m,
  /^- 不运行 Bash。$/m,
];

function validateCommandPermissionBoundaries(command, relativePath) {
  const text = readText(relativePath);
  for (const expectedText of COMMAND_BOUNDARY_EXPECTATIONS[command] ?? []) {
    if (!text.includes(expectedText)) {
      error(`plugins/spec-flow-kit/${relativePath} is missing permission boundary text: ${expectedText}`);
    }
  }

  if (!text.includes(UNIFIED_OUTPUT_RULE)) {
    error(`plugins/spec-flow-kit/${relativePath} is missing unified output rule: ${UNIFIED_OUTPUT_RULE}`);
  }

  for (const pattern of DISALLOWED_BROAD_BOUNDARY_PATTERNS) {
    if (pattern.test(text)) {
      error(`plugins/spec-flow-kit/${relativePath} still contains broad permission boundary pattern: ${pattern}`);
    }
  }
}

function validateCommands() {
  for (const command of EXPECTED_COMMANDS) {
    const relativePath = `commands/${command}.md`;
    assertFile(relativePath);
    assertFrontmatter(relativePath, ['description', 'argument-hint']);
    assertMentioned('README.md', `/${command}`);
    validateCommandPermissionBoundaries(command, relativePath);
  }
}

function validateAgents() {
  for (const agent of EXPECTED_AGENTS) {
    const relativePath = `agents/${agent}.md`;
    assertFile(relativePath);
    assertFrontmatter(relativePath, ['name', 'description']);
    assertMentioned('README.md', agent);
  }
}

function validateSkills() {
  for (const skill of EXPECTED_SKILLS) {
    const relativePath = `skills/${skill}/SKILL.md`;
    assertFile(relativePath);
    assertFrontmatter(relativePath, ['name', 'description']);
    assertMentioned('README.md', skill);
  }
}

function validateHooks() {
  const hooksJson = readJson('hooks/hooks.json');
  for (const hook of EXPECTED_HOOKS) {
    assertFile(`hooks/${hook}`);
  }

  const hooksText = JSON.stringify(hooksJson ?? {});
  for (const hook of ['stop-summary.js', 'post-edit-trace.js', 'rules-compliance-check.js']) {
    if (!hooksText.includes(hook)) error(`hooks/hooks.json does not register advisory hook ${hook}`);
  }

  for (const strictHook of ['pre-edit-gate.js', 'pre-test-gate.js', 'pre-deploy-gate.js']) {
    assertMentioned('README.md', strictHook);
  }
}

function validateTemplateExplanations() {
  for (const [templatePath, expectation] of Object.entries(TEMPLATE_EXPLANATION_EXPECTATIONS)) {
    const text = readText(templatePath);
    if (Array.isArray(expectation.topComment)) {
      const topComment = getTopCommentBlock(text, templatePath);
      for (const expectedText of expectation.topComment) {
        if (!topComment.includes(expectedText)) {
          error(`plugins/spec-flow-kit/${templatePath} top comment is missing template explanation: ${expectedText}`);
        }
      }
    }

    if (expectation.fields && typeof expectation.fields === 'object') {
      const parsed = readJson(templatePath);
      for (const [field, expectedTexts] of Object.entries(expectation.fields)) {
        const fieldText = parsed?.[field];
        if (typeof fieldText !== 'string') {
          error(`plugins/spec-flow-kit/${templatePath} is missing string explanation field: ${field}`);
          continue;
        }
        for (const expectedText of expectedTexts) {
          if (!fieldText.includes(expectedText)) {
            error(`plugins/spec-flow-kit/${templatePath} ${field} is missing template explanation: ${expectedText}`);
          }
        }
      }
    }
  }
}

function validateSchemasAndTemplates() {
  for (const schema of EXPECTED_SCHEMAS) assertFile(`schemas/${schema}`);
  for (const template of EXPECTED_TEMPLATES) assertFile(`templates/${template}`);

  for (const schema of EXPECTED_SCHEMAS) readJson(`schemas/${schema}`);
  for (const template of ['state.json', 'gates.json', 'traceability.json', 'status.json', 'waivers.json']) readJson(`templates/${template}`);
  validateTemplateExplanations();
}

function validateMcp() {
  assertFile('.mcp.json');
  assertFile('mcp/sfk-state-server.js');

  const mcp = readJson('.mcp.json');
  const server = mcp?.['spec-flow-kit'];
  if (!server) error('.mcp.json must define a spec-flow-kit server');
  if (server?.command !== 'node') error('.mcp.json spec-flow-kit server must use node command');
  if (!Array.isArray(server?.args) || !server.args.includes('${CLAUDE_PLUGIN_ROOT}/mcp/sfk-state-server.js')) {
    error('.mcp.json spec-flow-kit server must point to ${CLAUDE_PLUGIN_ROOT}/mcp/sfk-state-server.js');
  }

  for (const tool of ['sfk.get_state', 'sfk.get_current_stage', 'sfk.get_traceability', 'sfk.update_gate', 'sfk.record_evidence', 'sfk.next_action']) {
    assertMentioned('mcp/sfk-state-server.js', tool);
    assertMentioned('README.md', tool);
  }
}

function validateNoStaleGitkeep() {
  for (const directory of ['agents', 'skills', 'hooks']) {
    const dirPath = join(pluginRoot, directory);
    if (!existsSync(dirPath)) continue;
    const entries = readdirSync(dirPath);
    if (entries.length > 1 && entries.includes('.gitkeep')) {
      error(`Remove stale plugins/spec-flow-kit/${directory}/.gitkeep now that the directory has real content`);
    }
  }
}

validateCommands();
validateAgents();
validateSkills();
validateHooks();
validateSchemasAndTemplates();
validateMcp();
validateNoStaleGitkeep();

if (errors.length > 0) {
  console.error(`spec-flow-kit validation failed with ${errors.length} error(s):`);
  for (const validationError of errors) console.error(`- ${validationError}`);
  process.exit(1);
}

console.log('spec-flow-kit structure is valid.');
