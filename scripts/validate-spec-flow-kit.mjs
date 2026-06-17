#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const pluginRoot = join(root, 'plugins', 'spec-flow-kit');
const errors = [];

const TEMPLATE_EXPLANATION_EXPECTATIONS = {
  'templates/gates.json': {
    topComment: [
      '文件用途：记录 spec-flow-kit 全局 gate 状态',
      'mode 固定值：advisory、strict',
      'advisory：只提示风险或缺口，不阻断命令',
      'strict：允许 hook 或命令根据 gate 状态阻断高风险操作，必须由用户显式启用',
      'status 固定值：pending、passed、failed、blocked、waived',
      'evidence 用于记录证据引用，不应包含密钥、令牌或大段日志',
      'pending：尚未评估或证据未齐。',
      'passed：已有证据表明 gate 已通过。',
      'failed：已有证据表明 gate 未通过。',
      'blocked：因前置条件或关键输入缺失而无法继续。',
      'waived：有明确豁免记录，暂不按失败处理。',
    ],
  },
  'templates/state.json': {
    topComment: [
      '文件用途：记录 spec-flow-kit 全局状态、active feature、gate 模式和 feature 索引',
      'activeFeature 为 null 时，命令需要显式 FEATURE-ID 或提示用户运行 /sfk-use',
      'gateMode 固定值：advisory、strict',
      'advisory：默认提示模式，只报告风险或缺口。',
      'strict：严格 gate 模式，必须由用户显式启用。',
      'workspace.gitBranch 和 workspace.gitRef 只是元数据，不会自动切换分支',
      'features 条目结构：path、stage、branch、lastUpdatedAt',
      'state.json 通常由 /sfk-init、/sfk-requirements 和 /sfk-use 维护；只有状态异常时才建议人工修正。',
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
  },
  'templates/project-profile.yaml': {
    topComment: [
      'typescript：TypeScript 项目。通常会有 tsconfig、typecheck 或构建步骤。',
      'python：Python 项目。常见于脚本、服务或自动化工具。',
      'go：Go 项目。通常以 go.mod 和 go test 为主。',
      'java：Java 项目。常见于 Maven 或 Gradle 构建。',
      'unknown：暂时无法自动判断，保留给用户确认。',
      'pnpm：Node.js 项目使用 pnpm 管理依赖。',
      'npm：Node.js 项目使用 npm 管理依赖。',
      'yarn：Node.js 项目使用 yarn 管理依赖。',
      'pip：Python 项目使用 pip 管理依赖。',
      'uv：Python 项目使用 uv 管理依赖或虚拟环境。',
      'go：Go 工具链直接管理依赖与构建。',
      'maven：Java 项目使用 Maven 管理依赖与构建。',
      'unknown：暂时无法自动判断，保留给用户确认。',
    ],
  },
  'templates/rules.yaml': {
    topComment: [
      'feature：仅对当前 feature 生效的临时或局部规则。',
      'project：当前仓库或项目范围内的规则。',
      'team：团队共享的工程规则。',
      'organization：组织级统一规则。',
      'plugin-default：插件自带的默认规则。',
    ],
  },
};

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

function getTopCommentBlock(text, relativePath) {
  const lines = text.split(/\r?\n/);
  const commentLines = [];
  let seenComment = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!seenComment) {
      if (!trimmed) continue;
      if (trimmed.startsWith('#') || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
        seenComment = true;
      } else {
        error(`plugins/spec-flow-kit/${relativePath} must start with a template explanation comment block before data lines`);
        return '';
      }
    }

    if (!trimmed) {
      if (seenComment) break;
      continue;
    }

    if (trimmed.startsWith('#') || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
      commentLines.push(line);
      continue;
    }

    break;
  }

  if (!commentLines.length) {
    error(`plugins/spec-flow-kit/${relativePath} is missing a template explanation comment block`);
    return '';
  }

  return commentLines.join('\n');
}

function assertTemplateExplanations(relativePath, expectation) {
  const text = readText(relativePath);
  const topComment = getTopCommentBlock(text, relativePath);
  for (const expectedText of expectation.topComment ?? []) {
    if (!topComment.includes(expectedText)) {
      error(`plugins/spec-flow-kit/${relativePath} top comment is missing template explanation: ${expectedText}`);
    }
  }
}

function validateCommands() {
  for (const command of EXPECTED_COMMANDS) {
    const relativePath = `commands/${command}.md`;
    assertFile(relativePath);
    assertFrontmatter(relativePath, ['description', 'argument-hint']);
    assertMentioned('README.md', `/${command}`);
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

function validateSchemasAndTemplates() {
  for (const schema of EXPECTED_SCHEMAS) assertFile(`schemas/${schema}`);
  for (const template of EXPECTED_TEMPLATES) assertFile(`templates/${template}`);

  for (const schema of EXPECTED_SCHEMAS) readJson(`schemas/${schema}`);
  for (const template of ['state.json', 'gates.json', 'traceability.json', 'status.json', 'waivers.json']) readJson(`templates/${template}`);
  for (const [templatePath, expectation] of Object.entries(TEMPLATE_EXPLANATION_EXPECTATIONS)) {
    assertTemplateExplanations(templatePath, expectation);
  }
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
