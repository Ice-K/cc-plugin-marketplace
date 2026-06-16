import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const EDIT_TOOLS = new Set(['Edit', 'Write', 'NotebookEdit']);
const SENSITIVE_PATH_PATTERN = /(^|[\\/])\.env(\.|$)|secret|credential|token|private[-_]?key|id_rsa|id_dsa|id_ecdsa|id_ed25519/i;

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

function extractEditedPath(input) {
  const toolInput = input?.tool_input;
  if (!toolInput || typeof toolInput !== 'object') return null;

  for (const key of ['file_path', 'path', 'notebook_path']) {
    if (typeof toolInput[key] === 'string' && toolInput[key].trim()) {
      return toolInput[key];
    }
  }

  return null;
}

function normalizeRelativePath(projectRoot, rawPath) {
  const resolved = path.isAbsolute(rawPath) ? path.resolve(rawPath) : path.resolve(projectRoot, rawPath);
  const relative = path.relative(projectRoot, resolved);
  const normalized = relative.split(path.sep).join('/');
  return normalized || '.';
}

function normalizeTracePath(value) {
  if (typeof value !== 'string') return null;
  return value.replace(/\\/g, '/').replace(/^\.\//, '').trim();
}

function isInsideSpecFlowKit(relativePath) {
  return relativePath === '.spec-flow-kit' || relativePath.startsWith('.spec-flow-kit/');
}

function isSensitivePath(relativePath) {
  return SENSITIVE_PATH_PATTERN.test(relativePath);
}

function displayPath(relativePath) {
  return isSensitivePath(relativePath) ? 'a sensitive-looking file path' : relativePath;
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

function findTraceMatches(traceability, relativePath) {
  const links = Array.isArray(traceability?.links) ? traceability.links : [];
  const normalizedEditedPath = normalizeTracePath(relativePath);
  const matches = [];

  for (const link of links) {
    const code = Array.isArray(link?.code) ? link.code.map(normalizeTracePath).filter(Boolean) : [];
    const tests = Array.isArray(link?.tests) ? link.tests.map(normalizeTracePath).filter(Boolean) : [];
    const evidence = Array.isArray(link?.evidence) ? link.evidence : [];
    const inCode = code.includes(normalizedEditedPath);
    const inTests = tests.includes(normalizedEditedPath);

    if (inCode || inTests) {
      matches.push({
        requirementId: typeof link.requirementId === 'string' ? link.requirementId : 'unknown requirement',
        inCode,
        inTests,
        hasTests: tests.length > 0,
        hasEvidence: evidence.length > 0,
      });
    }
  }

  return matches;
}

function buildUntracedMessage(featureId, relativePath) {
  const shownPath = displayPath(relativePath);
  const lines = [
    'spec-flow-kit traceability advisory:',
    `The edited file ${shownPath} is not currently listed in traceability.json for active feature ${featureId}.`,
    '',
    'If this edit belongs to the active feature, update:',
    '- traceability.json / traceability.md: add the path under code or tests for the relevant requirement/task.',
    '- evidence.jsonl only after real validation evidence exists.',
    '',
    `Suggested next step: /sfk-development ${featureId}`,
    'Do not record actual-command evidence unless the command was actually run.',
  ];

  if (isSensitivePath(relativePath)) {
    lines.push('Do not write secrets, tokens, private keys, or credentials into traceability, evidence, runs, or reports.');
  }

  return lines.join('\n');
}

function buildMissingCoverageMessage(featureId, relativePath, matches) {
  const shownPath = displayPath(relativePath);
  const missingTests = matches.filter((match) => match.inCode && !match.hasTests);
  const missingEvidence = matches.filter((match) => !match.hasEvidence);

  if (missingTests.length === 0 && missingEvidence.length === 0) return null;

  const requirementIds = [...new Set([...missingTests, ...missingEvidence].map((match) => match.requirementId))].join(', ');
  const lines = [
    'spec-flow-kit traceability advisory:',
    `The edited file ${shownPath} is linked to ${requirementIds || 'the active feature'}, but coverage is incomplete.`,
    '',
  ];

  if (missingTests.length > 0) {
    lines.push('- One or more linked code entries have no tests in traceability.json yet.');
  }

  if (missingEvidence.length > 0) {
    lines.push('- One or more linked entries have no evidence in traceability.json yet.');
  }

  lines.push(
    '',
    'Before marking development or verification complete:',
    '- add or link tests in traceability.json / traceability.md when applicable;',
    '- add evidence only from actual commands, CI, manual review, or explicit user confirmation;',
    `- run /sfk-verify ${featureId} when ready.`,
  );

  if (isSensitivePath(relativePath)) {
    lines.push('Do not write secrets, tokens, private keys, or credentials into traceability, evidence, runs, or reports.');
  }

  return lines.join('\n');
}

async function main() {
  try {
    const input = parseJson(await readStdin());
    if (!input) return;

    const toolName = input.tool_name;
    if (!EDIT_TOOLS.has(toolName)) return;

    const rawPath = extractEditedPath(input);
    if (!rawPath) return;

    const projectRoot = typeof input.cwd === 'string' ? input.cwd : process.cwd();
    const specRoot = path.join(projectRoot, '.spec-flow-kit');
    const statePath = path.join(specRoot, 'state.json');
    if (!existsSync(statePath)) return;

    const relativePath = normalizeRelativePath(projectRoot, rawPath);
    if (isInsideSpecFlowKit(relativePath)) return;

    const state = readJsonIfExists(statePath);
    if (!state) return;

    const featureId = typeof state.activeFeature === 'string' && state.activeFeature.trim()
      ? state.activeFeature.trim()
      : null;

    if (!featureId) {
      emitAdditionalContext([
        'spec-flow-kit traceability advisory:',
        'A file was edited, but no active feature is selected in .spec-flow-kit/state.json.',
        'If this work belongs to a feature, run /sfk-use <FEATURE-ID> and keep traceability updated.',
      ].join('\n'));
      return;
    }

    const featureDir = safeFeatureDir(projectRoot, state, featureId);
    const traceability = readJsonIfExists(path.join(featureDir, 'traceability.json'));
    if (!traceability) {
      emitAdditionalContext(buildUntracedMessage(featureId, relativePath));
      return;
    }

    const matches = findTraceMatches(traceability, relativePath);
    if (matches.length === 0) {
      emitAdditionalContext(buildUntracedMessage(featureId, relativePath));
      return;
    }

    const message = buildMissingCoverageMessage(featureId, relativePath, matches);
    if (message) emitAdditionalContext(message);
  } catch {
    // Advisory hook: never block PostToolUse.
  }
}

await main();
