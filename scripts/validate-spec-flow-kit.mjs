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
