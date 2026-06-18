#!/usr/bin/env node
import { mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const pluginRoot = path.join(root, 'plugins', 'spec-flow-kit');
const fixtureRoot = path.join(tmpdir(), `sfk-hooks-smoke-${process.pid}`);
const specRoot = path.join(fixtureRoot, '.spec-flow-kit');
const featureDir = path.join(specRoot, 'features', 'AUTH-LOCK-001');

function writeJson(filePath, value) {
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function setupFixture({ gateMode = 'advisory' } = {}) {
  mkdirSync(featureDir, { recursive: true });
  mkdirSync(path.join(specRoot, 'rules'), { recursive: true });
  mkdirSync(path.join(fixtureRoot, 'src'), { recursive: true });
  mkdirSync(path.join(fixtureRoot, 'tests'), { recursive: true });

  writeJson(path.join(specRoot, 'state.json'), {
    version: 1,
    activeFeature: 'AUTH-LOCK-001',
    gateMode,
    workspace: { root: '.', gitBranch: 'main', gitRef: 'abc123' },
    features: {
      'AUTH-LOCK-001': {
        path: '.spec-flow-kit/features/AUTH-LOCK-001',
        stage: 'development_ready',
        branch: 'main',
        lastUpdatedAt: null,
      },
    },
    updatedAt: null,
  });

  writeJson(path.join(specRoot, 'gates.json'), {
    version: 1,
    mode: gateMode,
    gates: {
      'requirements-ready': { status: 'passed', evidence: [], updatedAt: null },
      'design-ready': { status: 'passed', evidence: [], updatedAt: null },
      'plan-ready': { status: 'passed', evidence: [], updatedAt: null },
      'development-ready': { status: 'passed', evidence: [], updatedAt: null },
      'verification-passed': { status: 'pending', evidence: [], updatedAt: null },
    },
  });

  writeFileSync(path.join(specRoot, 'project-profile.yaml'), 'version: 1\nrules:\n  files:\n    - .spec-flow-kit/rules/coding-style.md\n');
  writeFileSync(path.join(specRoot, 'rules', 'coding-style.md'), '# Coding style\n');
  writeFileSync(path.join(specRoot, 'rules.yaml'), `version: 1\nrules:\n  - id: RULE-SEC-001\n    title: Do not write secrets\n    level: required\n    source: .spec-flow-kit/rules/coding-style.md\n    scope: project\n    appliesTo:\n      - development\n      - verification\n      - audit\n    enforcement:\n      mode: advisory\n    status: active\n`);

  writeJson(path.join(featureDir, 'status.json'), {
    version: 1,
    featureId: 'AUTH-LOCK-001',
    stage: 'development_ready',
    gates: {
      'requirements-ready': 'passed',
      'design-ready': 'passed',
      'plan-ready': 'passed',
      'development-ready': 'passed',
      'verification-passed': 'pending',
    },
    blockers: [],
    nextAction: '/sfk-verify AUTH-LOCK-001',
    updatedAt: null,
  });

  writeJson(path.join(featureDir, 'traceability.json'), {
    version: 1,
    featureId: 'AUTH-LOCK-001',
    links: [
      {
        requirementId: 'REQ-001',
        designIds: ['DES-001'],
        taskIds: ['TASK-001'],
        code: ['src/auth.js'],
        tests: [],
        evidence: [],
        status: 'partial',
      },
    ],
  });
  writeJson(path.join(featureDir, 'waivers.json'), { version: 1, waivers: [] });
  writeFileSync(path.join(featureDir, 'evidence.jsonl'), JSON.stringify({ id: 'EV-001', type: 'claude-inferred' }) + '\n');
  writeFileSync(path.join(featureDir, 'test-plan.md'), '# Test plan\n');
  writeFileSync(path.join(fixtureRoot, 'src', 'auth.js'), 'export const ok = true;\n');
  writeFileSync(path.join(fixtureRoot, 'tests', 'auth.test.js'), 'test("ok", () => {});\n');
}

function runHook(relativeScript, input) {
  const result = spawnSync(process.execPath, [path.join(pluginRoot, 'hooks', relativeScript)], {
    cwd: fixtureRoot,
    input: JSON.stringify(input),
    encoding: 'utf8',
  });
  return result;
}

function parseHookJson(stdout) {
  if (!stdout.trim()) return null;
  return JSON.parse(stdout);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

setupFixture({ gateMode: 'advisory' });

const stop = runHook('stop-summary.js', { cwd: fixtureRoot });
assert(stop.status === 0, 'stop-summary should exit 0');
assert(parseHookJson(stop.stdout)?.hookSpecificOutput?.additionalContext?.includes('AUTH-LOCK-001'), 'stop-summary should mention active feature');

// Regression: a Stop hook must not block the turn from ending on recursive
// triggers. When Claude Code re-invokes the hook it sets stop_hook_active=true;
// the hook must return success with NO additionalContext so the turn can end.
const stopReentrant = runHook('stop-summary.js', { cwd: fixtureRoot, stop_hook_active: true });
assert(stopReentrant.status === 0, 'stop-summary should exit 0 when stop_hook_active is true');
assert(parseHookJson(stopReentrant.stdout) == null, 'stop-summary must emit no JSON when stop_hook_active is true');

// Regression for /sfk-init completion: when initialization has created a
// workspace but no feature exists yet, Stop must stay silent. Emitting
// additionalContext here makes Claude Code continue the turn after /sfk-init's
// final "下一步" summary, which looks like the next-step hint was handled as
// follow-up input.
writeJson(path.join(specRoot, 'state.json'), {
  version: 1,
  activeFeature: null,
  gateMode: 'advisory',
  workspace: { root: '.', gitBranch: 'main', gitRef: 'abc123' },
  features: {},
  updatedAt: null,
});
const stopNoFeatureFirst = runHook('stop-summary.js', { cwd: fixtureRoot });
assert(stopNoFeatureFirst.status === 0, 'stop-summary should exit 0 when no active feature is selected');
assert(parseHookJson(stopNoFeatureFirst.stdout) == null, 'stop-summary must emit no JSON when no active feature is selected');
const stopNoFeatureReentrant = runHook('stop-summary.js', { cwd: fixtureRoot, stop_hook_active: true });
assert(parseHookJson(stopNoFeatureReentrant.stdout) == null, 'stop-summary must emit no JSON when stop_hook_active is true even with no active feature');

// Restore the active-feature fixture so the PostToolUse assertions below still hold.
writeJson(path.join(specRoot, 'state.json'), {
  version: 1,
  activeFeature: 'AUTH-LOCK-001',
  gateMode: 'advisory',
  workspace: { root: '.', gitBranch: 'main', gitRef: 'abc123' },
  features: {
    'AUTH-LOCK-001': {
      path: '.spec-flow-kit/features/AUTH-LOCK-001',
      stage: 'development_ready',
      branch: 'main',
      lastUpdatedAt: null,
    },
  },
  updatedAt: null,
});

const postEdit = runHook('post-edit-trace.js', {
  cwd: fixtureRoot,
  tool_name: 'Edit',
  tool_input: { file_path: path.join(fixtureRoot, 'src', 'untracked.js') },
});
assert(postEdit.status === 0, 'post-edit-trace should exit 0');
assert(parseHookJson(postEdit.stdout)?.hookSpecificOutput?.additionalContext?.includes('not currently listed in traceability.json'), 'post-edit-trace should flag untraced file');

const rules = runHook('rules-compliance-check.js', {
  cwd: fixtureRoot,
  tool_name: 'Edit',
  tool_input: { file_path: path.join(fixtureRoot, 'src', 'auth.js') },
});
assert(rules.status === 0, 'rules-compliance-check should exit 0');
assert(parseHookJson(rules.stdout)?.hookSpecificOutput?.additionalContext?.includes('RULE-SEC-001'), 'rules-compliance-check should mention relevant required rule');

setupFixture({ gateMode: 'strict' });
writeJson(path.join(specRoot, 'gates.json'), {
  version: 1,
  mode: 'strict',
  gates: {
    'requirements-ready': { status: 'passed', evidence: [], updatedAt: null },
    'design-ready': { status: 'blocked', evidence: [], updatedAt: null },
    'plan-ready': { status: 'passed', evidence: [], updatedAt: null },
  },
});

const preEditBlocked = runHook('pre-edit-gate.js', {
  cwd: fixtureRoot,
  tool_name: 'Edit',
  tool_input: { file_path: path.join(fixtureRoot, 'src', 'auth.js') },
});
assert(preEditBlocked.status === 2, 'pre-edit-gate should block in strict mode when design-ready is blocked');
assert(parseHookJson(preEditBlocked.stdout)?.decision === 'block', 'pre-edit-gate should emit block decision');

setupFixture({ gateMode: 'strict' });
const preTest = runHook('pre-test-gate.js', {
  cwd: fixtureRoot,
  tool_name: 'Bash',
  tool_input: { command: 'npm test' },
});
assert(preTest.status === 0, 'pre-test-gate should allow test command when plan-ready and test-plan exist');

const preDeploy = runHook('pre-deploy-gate.js', {
  cwd: fixtureRoot,
  tool_name: 'Bash',
  tool_input: { command: 'npm run deploy' },
});
assert(preDeploy.status === 2, 'pre-deploy-gate should block deployment-like commands by default');
assert(parseHookJson(preDeploy.stdout)?.decision === 'block', 'pre-deploy-gate should emit block decision');

console.log('spec-flow-kit hook smoke tests passed.');
