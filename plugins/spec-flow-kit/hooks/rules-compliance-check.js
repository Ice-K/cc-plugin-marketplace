import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const SENSITIVE_PATH_PATTERN = /(^|[\\/])\.env(\.|$)|secret|credential|token|private[-_]?key|id_rsa|id_dsa|id_ecdsa|id_ed25519/i;
const RULE_SCOPES = new Set(['development', 'verification', 'audit']);

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

function sanitizeLine(value, maxLength = 180) {
  if (typeof value !== 'string') return null;
  const normalized = value.replace(/[\r\n\t]+/g, ' ').trim();
  if (!normalized) return null;
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength - 1)}…` : normalized;
}

function emitAdditionalContext(text) {
  if (!text) return;
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PostToolUse',
      additionalContext: text,
    },
  }));
}

function safeFeatureDir(projectRoot, state, featureId) {
  const specRoot = path.join(projectRoot, '.spec-flow-kit');
  const fallback = path.join(specRoot, 'features', featureId);
  const configuredPath = state?.features?.[featureId]?.path;

  if (typeof configuredPath !== 'string' || !configuredPath.trim()) return fallback;

  const resolved = path.resolve(projectRoot, configuredPath);
  const expectedRoot = path.resolve(specRoot, 'features');
  const relative = path.relative(expectedRoot, resolved);

  if (relative && !relative.startsWith('..') && !path.isAbsolute(relative)) {
    return resolved;
  }

  return fallback;
}

function normalizeRelativePath(projectRoot, rawPath) {
  const resolved = path.isAbsolute(rawPath) ? path.resolve(rawPath) : path.resolve(projectRoot, rawPath);
  const relative = path.relative(projectRoot, resolved);
  return relative.split(path.sep).join('/') || '.';
}

function extractPath(input) {
  const toolInput = input?.tool_input;
  if (!toolInput || typeof toolInput !== 'object') return null;

  for (const key of ['file_path', 'path', 'notebook_path']) {
    if (typeof toolInput[key] === 'string' && toolInput[key].trim()) return toolInput[key];
  }

  return null;
}

function rulesRelevantToStage(rulesYamlText) {
  const relevant = [];
  const lines = rulesYamlText.split(/\r?\n/);
  let current = null;
  let inAppliesTo = false;

  for (const line of lines) {
    const idMatch = line.match(/^\s*-\s+id:\s*(\S+)/);
    if (idMatch) {
      if (current) relevant.push(current);
      current = { id: idMatch[1], applies: [], level: null, mode: null, status: null };
      inAppliesTo = false;
      continue;
    }

    if (!current) continue;

    const levelMatch = line.match(/^\s+level:\s*(\S+)/);
    if (levelMatch) current.level = levelMatch[1];

    const modeMatch = line.match(/^\s+mode:\s*(\S+)/);
    if (modeMatch) current.mode = modeMatch[1];

    const statusMatch = line.match(/^\s+status:\s*(\S+)/);
    if (statusMatch) current.status = statusMatch[1];

    if (/^\s+appliesTo:\s*$/.test(line)) {
      inAppliesTo = true;
      continue;
    }

    if (inAppliesTo) {
      const appliesMatch = line.match(/^\s+-\s+(\S+)/);
      if (appliesMatch) current.applies.push(appliesMatch[1]);
      else if (/^\s+\S/.test(line)) inAppliesTo = false;
    }
  }

  if (current) relevant.push(current);

  return relevant.filter((rule) => (
    rule.status === 'active'
    && (rule.level === 'required' || rule.mode === 'strict')
    && rule.applies.some((stage) => RULE_SCOPES.has(stage))
  ));
}

async function main() {
  try {
    const input = parseJson(await readStdin());
    if (!input) return;

    const rawPath = extractPath(input);
    if (!rawPath) return;

    const projectRoot = typeof input.cwd === 'string' ? input.cwd : process.cwd();
    const specRoot = path.join(projectRoot, '.spec-flow-kit');
    const state = readJsonIfExists(path.join(specRoot, 'state.json'));
    if (!state) return;

    const relativePath = normalizeRelativePath(projectRoot, rawPath);
    if (relativePath.startsWith('.spec-flow-kit/')) return;

    const activeFeature = typeof state.activeFeature === 'string' && state.activeFeature.trim()
      ? state.activeFeature.trim()
      : null;
    if (!activeFeature) return;

    const rulesPath = path.join(specRoot, 'rules.yaml');
    if (!existsSync(rulesPath)) return;

    const rulesText = readFileSync(rulesPath, 'utf8');
    const relevantRules = rulesRelevantToStage(rulesText);
    if (relevantRules.length === 0 && !SENSITIVE_PATH_PATTERN.test(relativePath)) return;

    const featureDir = safeFeatureDir(projectRoot, state, activeFeature);
    const waivers = readJsonIfExists(path.join(featureDir, 'waivers.json'));
    const approvedWaiverCount = Array.isArray(waivers?.waivers)
      ? waivers.waivers.filter((waiver) => waiver?.status === 'approved').length
      : 0;

    const lines = [
      'spec-flow-kit rules compliance advisory:',
      `Edited file: ${SENSITIVE_PATH_PATTERN.test(relativePath) ? 'a sensitive-looking file path' : sanitizeLine(relativePath)}`,
      `Active feature: ${sanitizeLine(activeFeature, 80)}`,
      '',
      'Review whether this change affects active required or strict rules before marking development or verification complete.',
    ];

    if (relevantRules.length > 0) {
      lines.push('', 'Relevant active required/strict rules:');
      for (const rule of relevantRules.slice(0, 8)) {
        lines.push(`- ${sanitizeLine(rule.id, 80)} (${rule.level ?? 'unknown'}, ${rule.mode ?? 'advisory'})`);
      }
      if (relevantRules.length > 8) lines.push(`- ...and ${relevantRules.length - 8} more`);
    }

    if (approvedWaiverCount > 0) {
      lines.push('', `Approved waivers found: ${approvedWaiverCount}. Confirm this edit remains within waiver scope.`);
    }

    if (SENSITIVE_PATH_PATTERN.test(relativePath)) {
      lines.push('', 'Sensitive path reminder: do not write secrets, tokens, private keys, or credentials into reports, evidence, traceability, or runs.');
    }

    lines.push('', `Suggested next step: /sfk-audit ${activeFeature}`);
    emitAdditionalContext(lines.join('\n'));
  } catch {
    // Advisory hook: never block PostToolUse.
  }
}

await main();
