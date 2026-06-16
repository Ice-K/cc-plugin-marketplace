import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const DEPLOY_PATTERN = /\b(deploy|release|publish|production|kubectl\s+apply|terraform\s+apply|serverless\s+deploy|vercel\s+--prod|gh\s+release)\b/i;
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

function gateStatus(gates, name) {
  return gates?.gates?.[name]?.status ?? 'pending';
}

function isDeployCommand(input) {
  if (input?.tool_name !== 'Bash') return false;
  const command = input?.tool_input?.command;
  return typeof command === 'string' && DEPLOY_PATTERN.test(command);
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
    if (!input || !isDeployCommand(input)) return;

    const projectRoot = typeof input.cwd === 'string' ? input.cwd : process.cwd();
    const specRoot = path.join(projectRoot, '.spec-flow-kit');
    const state = readJsonIfExists(path.join(specRoot, 'state.json'));
    const gates = readJsonIfExists(path.join(specRoot, 'gates.json'));

    const activeFeature = typeof state?.activeFeature === 'string' && state.activeFeature.trim()
      ? state.activeFeature.trim()
      : null;
    if (!activeFeature) {
      block('spec-flow-kit deploy gate: no active feature is selected. Deployment-like commands require an active feature and explicit user confirmation.');
    }

    if (!PASSING_GATE_STATUSES.has(gateStatus(gates, 'verification-passed'))) {
      block(`spec-flow-kit deploy gate: verification-passed must be passed or waived before deployment-like commands for ${activeFeature}.`);
    }

    const featureDir = safeFeatureDir(projectRoot, state, activeFeature);
    const deployPlanExists = existsSync(path.join(featureDir, 'deploy-plan.md'));
    const rollbackPlanExists = existsSync(path.join(featureDir, 'rollback-plan.md'));
    if (!deployPlanExists || !rollbackPlanExists) {
      block(`spec-flow-kit deploy gate: deploy-plan.md and rollback-plan.md are required before deployment-like commands for ${activeFeature}. Run /sfk-deploy ${activeFeature} first.`);
    }

    block('spec-flow-kit deploy gate: deployment-like commands require explicit current-turn user confirmation. By default /sfk-deploy only generates runbooks.');
  } catch {
    block('spec-flow-kit deploy gate: deployment-like command blocked because the deploy gate could not verify readiness safely.');
  }
}

await main();
