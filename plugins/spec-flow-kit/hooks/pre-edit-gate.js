import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const EDIT_TOOLS = new Set(['Edit', 'Write', 'NotebookEdit']);
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

function isStrict(state, gates) {
  return state?.gateMode === 'strict' || gates?.mode === 'strict';
}

function extractEditedPath(input) {
  const toolInput = input?.tool_input;
  if (!toolInput || typeof toolInput !== 'object') return null;
  for (const key of ['file_path', 'path', 'notebook_path']) {
    if (typeof toolInput[key] === 'string' && toolInput[key].trim()) return toolInput[key];
  }
  return null;
}

function isSpecPath(projectRoot, rawPath) {
  if (!rawPath) return false;
  const resolved = path.isAbsolute(rawPath) ? path.resolve(rawPath) : path.resolve(projectRoot, rawPath);
  const relative = path.relative(projectRoot, resolved).split(path.sep).join('/');
  return relative === '.spec-flow-kit' || relative.startsWith('.spec-flow-kit/');
}

function block(reason) {
  process.stdout.write(JSON.stringify({ decision: 'block', reason }));
  process.exit(2);
}

async function main() {
  try {
    const input = parseJson(await readStdin());
    if (!input || !EDIT_TOOLS.has(input.tool_name)) return;

    const projectRoot = typeof input.cwd === 'string' ? input.cwd : process.cwd();
    const specRoot = path.join(projectRoot, '.spec-flow-kit');
    const state = readJsonIfExists(path.join(specRoot, 'state.json'));
    const gates = readJsonIfExists(path.join(specRoot, 'gates.json'));
    if (!isStrict(state, gates)) return;

    const rawPath = extractEditedPath(input);
    if (isSpecPath(projectRoot, rawPath)) return;

    const activeFeature = typeof state?.activeFeature === 'string' && state.activeFeature.trim()
      ? state.activeFeature.trim()
      : null;
    if (!activeFeature) {
      block('spec-flow-kit strict gate: no active feature is selected. Run /sfk-use <FEATURE-ID> or switch gates.json mode to advisory before editing project files.');
    }

    const required = ['requirements-ready', 'design-ready', 'plan-ready'];
    const missing = required.filter((gate) => !PASSING_GATE_STATUSES.has(gateStatus(gates, gate)));
    if (missing.length > 0) {
      block(`spec-flow-kit strict gate: ${missing.join(', ')} must be passed or waived before editing project files for ${activeFeature}.`);
    }
  } catch {
    // Strict hook should not block on internal parsing errors.
  }
}

await main();
