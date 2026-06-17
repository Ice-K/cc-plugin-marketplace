import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const VALID_TRACE_STATUSES = ['pending', 'pass', 'partial', 'blocked', 'failed'];
const VALID_EVIDENCE_TYPES = ['actual-command', 'external-ci', 'user-confirmed', 'manual-review', 'claude-inferred'];

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
  if (!existsSync(filePath)) return { value: null, warning: null };
  try {
    return { value: JSON.parse(readFileSync(filePath, 'utf8')), warning: null };
  } catch {
    return { value: null, warning: `${path.basename(filePath)} could not be parsed` };
  }
}

function readEvidenceCounts(filePath) {
  const counts = Object.fromEntries(VALID_EVIDENCE_TYPES.map((type) => [type, 0]));
  if (!existsSync(filePath)) return { counts, warnings: [] };

  const warnings = [];
  const lines = readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const record = JSON.parse(line);
      if (VALID_EVIDENCE_TYPES.includes(record?.type)) {
        counts[record.type] += 1;
      }
    } catch {
      warnings.push('evidence.jsonl contains an invalid JSON line');
    }
  }

  return { counts, warnings: [...new Set(warnings)] };
}

function safeFeatureDir(projectRoot, state, featureId) {
  const workspaceRoot = path.join(projectRoot, '.spec-flow-kit');
  const fallback = path.join(workspaceRoot, 'features', featureId);
  const configuredPath = state?.features?.[featureId]?.path;

  if (typeof configuredPath !== 'string' || !configuredPath.trim()) return fallback;

  const resolved = path.resolve(projectRoot, configuredPath);
  const expectedRoot = path.resolve(workspaceRoot, 'features');
  const relative = path.relative(expectedRoot, resolved);

  if (relative && !relative.startsWith('..') && !path.isAbsolute(relative)) {
    return resolved;
  }

  return fallback;
}

function countTraceability(traceability) {
  const links = Array.isArray(traceability?.links) ? traceability.links : [];
  const gaps = { design: 0, task: 0, code: 0, tests: 0, evidence: 0 };
  const statuses = Object.fromEntries(VALID_TRACE_STATUSES.map((status) => [status, 0]));

  for (const link of links) {
    if (!Array.isArray(link?.designIds) || link.designIds.length === 0) gaps.design += 1;
    if (!Array.isArray(link?.taskIds) || link.taskIds.length === 0) gaps.task += 1;
    if (!Array.isArray(link?.code) || link.code.length === 0) gaps.code += 1;
    if (!Array.isArray(link?.tests) || link.tests.length === 0) gaps.tests += 1;
    if (!Array.isArray(link?.evidence) || link.evidence.length === 0) gaps.evidence += 1;
    if (VALID_TRACE_STATUSES.includes(link?.status)) statuses[link.status] += 1;
  }

  return { linkCount: links.length, gaps, statuses };
}

function sanitizeLine(value, maxLength = 160) {
  if (typeof value !== 'string') return null;
  const normalized = value.replace(/[\r\n\t]+/g, ' ').trim();
  if (!normalized) return null;
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength - 1)}…` : normalized;
}

function formatCounts(counts) {
  return Object.entries(counts)
    .map(([key, value]) => `${key}=${value}`)
    .join(', ');
}

function emitAdditionalContext(text) {
  if (!text) return;
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'Stop',
      additionalContext: text,
    },
  }));
}

function buildNextAction(featureId, status) {
  const nextAction = sanitizeLine(status?.nextAction);
  if (nextAction) return nextAction;

  const gateStatus = status?.gates ?? {};
  if (gateStatus['verification-passed'] === 'passed') return `/sfk-status ${featureId}`;
  if (gateStatus['development-ready'] === 'passed') return `/sfk-verify ${featureId}`;
  if (gateStatus['plan-ready'] === 'passed') return `/sfk-development ${featureId}`;
  if (gateStatus['design-ready'] === 'passed') return `/sfk-plan ${featureId}`;
  if (gateStatus['requirements-ready'] === 'passed') return `/sfk-design ${featureId}`;
  return `/sfk-status ${featureId}`;
}

async function main() {
  try {
    const input = parseJson(await readStdin());
    if (!input) return;

    // Claude Code re-invokes a Stop hook (setting stop_hook_active=true) when a
    // prior hook output caused the turn to continue. On these recursive triggers
    // the hook MUST return success with no additionalContext — otherwise the same
    // non-empty advisory is fed back every iteration and the turn can never end
    // (loops until the harness's CLAUDE_CODE_STOP_HOOK_BLOCK_CAP aborts it).
    if (input.stop_hook_active) return;

    const projectRoot = typeof input.cwd === 'string' ? input.cwd : process.cwd();
    const specRoot = path.join(projectRoot, '.spec-flow-kit');
    const statePath = path.join(specRoot, 'state.json');
    if (!existsSync(statePath)) return;

    const { value: state, warning: stateWarning } = readJsonIfExists(statePath);
    if (!state) {
      if (stateWarning) emitAdditionalContext(`spec-flow-kit advisory summary:\n- ${stateWarning}`);
      return;
    }

    const activeFeature = sanitizeLine(state.activeFeature, 80);
    if (!activeFeature) {
      emitAdditionalContext('spec-flow-kit advisory summary:\nNo active feature is selected. If you are working on a spec-flow-kit feature, run /sfk-use <FEATURE-ID> or /sfk-status --all.');
      return;
    }

    const featureDir = safeFeatureDir(projectRoot, state, activeFeature);
    const gatesResult = readJsonIfExists(path.join(specRoot, 'gates.json'));
    const statusResult = readJsonIfExists(path.join(featureDir, 'status.json'));
    const traceResult = readJsonIfExists(path.join(featureDir, 'traceability.json'));
    const evidenceResult = readEvidenceCounts(path.join(featureDir, 'evidence.jsonl'));

    const gates = gatesResult.value;
    const status = statusResult.value;
    const traceability = countTraceability(traceResult.value);
    const gateSummary = status?.gates && typeof status.gates === 'object'
      ? status.gates
      : Object.fromEntries(Object.entries(gates?.gates ?? {}).map(([gate, value]) => [gate, value?.status ?? 'unknown']));
    const blockerCount = Array.isArray(status?.blockers) ? status.blockers.length : 0;
    const stage = sanitizeLine(status?.stage || state.features?.[activeFeature]?.stage || 'unknown', 80);
    const gateMode = sanitizeLine(gates?.mode || state.gateMode || 'advisory', 40);
    const warnings = [gatesResult.warning, statusResult.warning, traceResult.warning, ...evidenceResult.warnings].filter(Boolean);

    const lines = [
      'spec-flow-kit advisory summary:',
      `Feature: ${activeFeature}`,
      `Stage: ${stage}`,
      `Gate mode: ${gateMode}`,
      '',
      'Gates:',
    ];

    const gateEntries = Object.entries(gateSummary);
    if (gateEntries.length === 0) {
      lines.push('- no gate summary found');
    } else {
      for (const [gate, gateStatus] of gateEntries) {
        lines.push(`- ${gate}: ${sanitizeLine(String(gateStatus), 40) ?? 'unknown'}`);
      }
    }

    lines.push(
      '',
      'Traceability:',
      `- links: ${traceability.linkCount}`,
      `- gaps: ${formatCounts(traceability.gaps)}`,
      `- statuses: ${formatCounts(traceability.statuses)}`,
      '',
      'Evidence:',
      `- ${formatCounts(evidenceResult.counts)}`,
      '',
      `Blockers: ${blockerCount}`,
      `Next: ${buildNextAction(activeFeature, status)}`,
    );

    if (warnings.length > 0) {
      lines.push('', 'Warnings:');
      for (const warning of [...new Set(warnings)]) lines.push(`- ${warning}`);
    }

    emitAdditionalContext(lines.join('\n'));
  } catch {
    // Advisory hook: never block Stop.
  }
}

await main();
