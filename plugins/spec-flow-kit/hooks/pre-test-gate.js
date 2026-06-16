import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const TEST_LIKE_PATTERN = /(?:^|\s)(npm|pnpm|yarn|bun|pytest|python -m pytest|go test|cargo test|mvn test|gradle test|dotnet test|jest|vitest|playwright)(?:\s|$)/i;
const PASSING_GATE_STATUSES = new Set(['passed', 'waived']);

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
      data += chunk;
    });
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', () => resolve(''));
  });
}

function parseJson(text) {
  if (!text || !text.trim()) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function readJsonIfExists(filePath) {
  if (!existsSync(filePath)) return null;
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function isStrict(state, gates) {
  return state?.gateMode === 'strict' || gates?.mode === 'strict';
}

function gateStatus(gates, name) {
  return gates?.gates?.[name]?.status ?? 'pending';
}

function isTestCommand(input) {
  if (input?.tool_name !== 'Bash') return false;
  const command = input?.tool_input?.command;
  return typeof command === 'string' && TEST_LIKE_PATTERN.test(command);
}

function safeFeatureDir(projectRoot, state, featureId) {
  const specRoot = path.join(projectRoot, '.spec-flow-kit');
  const fallback = path.join(specRoot, 'features', featureId);
  const configuredPath = state?.features?.[featureId]?.path;
  if (typeof configuredPath !== 'string' || !configuredPath.trim()) return fallback;

  const resolved = path.resolve(projectRoot, configuredPath);
  const expectedRoot = path.resolve(specRoot, 'features');
  const relative = path.relative(expectedRoot, resolved);
  return relative && !relative.startsWith('..') && !path.isAbsolute(relative) ? resolved : fallback;
}

function block(reason) {
  process.stdout.write(JSON.stringify({ decision: 'block', reason }));
  process.exit(2);
}

async function main() {
  try {
    const input = parseJson(await readStdin());
    if (!input || !isTestCommand(input)) return;

    const projectRoot = typeof input.cwd === 'string' ? input.cwd : process.cwd();
    const specRoot = path.join(projectRoot, '.spec-flow-kit');
    const state = readJsonIfExists(path.join(specRoot, 'state.json'));
    const gates = readJsonIfExists(path.join(specRoot, 'gates.json'));
    if (!isStrict(state, gates)) return;

    const activeFeature = typeof state?.activeFeature === 'string' && state.activeFeature.trim()
      ? state.activeFeature.trim()
      : null;
    if (!activeFeature) block('spec-flow-kit strict gate: no active feature is selected before running tests.');

    if (!PASSING_GATE_STATUSES.has(gateStatus(gates, 'plan-ready'))) {
      block(`spec-flow-kit strict gate: plan-ready must be passed or waived before running tests for ${activeFeature}.`);
    }

    const featureDir = safeFeatureDir(projectRoot, state, activeFeature);
    if (!existsSync(path.join(featureDir, 'test-plan.md'))) {
      block(`spec-flow-kit strict gate: missing test-plan.md for ${activeFeature}. Run /sfk-design or update the test plan before running tests.`);
    }
  } catch {
    // Strict hook should not block on internal parsing errors.
  }
}

await main();
