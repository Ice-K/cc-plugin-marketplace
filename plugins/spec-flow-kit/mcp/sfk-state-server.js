#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pluginRoot = path.resolve(__dirname, '..');
const projectRoot = process.env.SFK_PROJECT_ROOT || process.cwd();
const specRoot = path.join(projectRoot, '.spec-flow-kit');

function readJsonIfExists(filePath) {
  if (!existsSync(filePath)) return null;
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function readTextIfExists(filePath) {
  if (!existsSync(filePath)) return null;
  try {
    return readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}

function writeJson(filePath, value) {
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function safeFeatureDir(state, featureId) {
  const fallback = path.join(specRoot, 'features', featureId);
  const configuredPath = state?.features?.[featureId]?.path;
  if (typeof configuredPath !== 'string' || !configuredPath.trim()) return fallback;

  const resolved = path.resolve(projectRoot, configuredPath);
  const expectedRoot = path.resolve(specRoot, 'features');
  const relative = path.relative(expectedRoot, resolved);
  return relative && !relative.startsWith('..') && !path.isAbsolute(relative) ? resolved : fallback;
}

function getState() {
  const projectProfilePath = path.join(specRoot, 'project-profile.yaml');
  return {
    projectRoot,
    specRoot,
    initialized: existsSync(specRoot),
    state: readJsonIfExists(path.join(specRoot, 'state.json')),
    gates: readJsonIfExists(path.join(specRoot, 'gates.json')),
    projectProfile: readTextIfExists(projectProfilePath),
  };
}

function getFeature(featureId) {
  const state = readJsonIfExists(path.join(specRoot, 'state.json'));
  const id = featureId || state?.activeFeature;
  if (!id) return { featureId: null, error: 'No feature id provided and no active feature is set.' };

  const featureDir = safeFeatureDir(state, id);
  return {
    featureId: id,
    featureDir,
    status: readJsonIfExists(path.join(featureDir, 'status.json')),
    traceability: readJsonIfExists(path.join(featureDir, 'traceability.json')),
    waivers: readJsonIfExists(path.join(featureDir, 'waivers.json')),
    evidencePath: path.join(featureDir, 'evidence.jsonl'),
  };
}

function updateGate({ gate, status, evidence = [], reason = null, requiredActions = [] }) {
  if (!gate || !status) throw new Error('gate and status are required');
  const gatesPath = path.join(specRoot, 'gates.json');
  const gates = readJsonIfExists(gatesPath);
  if (!gates) throw new Error('Missing or invalid .spec-flow-kit/gates.json');

  gates.gates ??= {};
  gates.gates[gate] ??= { status: 'pending', evidence: [] };
  gates.gates[gate].status = status;
  gates.gates[gate].evidence = Array.isArray(evidence) ? evidence : [];
  if (reason) gates.gates[gate].reason = reason;
  if (Array.isArray(requiredActions) && requiredActions.length > 0) gates.gates[gate].requiredActions = requiredActions;
  gates.gates[gate].updatedAt = new Date().toISOString();
  writeJson(gatesPath, gates);
  return gates.gates[gate];
}

function recordEvidence({ featureId, record }) {
  if (!record || typeof record !== 'object') throw new Error('record is required');
  const feature = getFeature(featureId);
  if (!feature.featureId || feature.error) throw new Error(feature.error || 'Feature not found');
  const line = JSON.stringify(record).replace(/[\r\n]+/g, '');
  writeFileSync(feature.evidencePath, `${line}\n`, { encoding: 'utf8', flag: 'a' });
  return { featureId: feature.featureId, appended: true };
}

function nextAction(featureId) {
  const feature = getFeature(featureId);
  const status = feature.status;
  const gates = readJsonIfExists(path.join(specRoot, 'gates.json'));
  const gateStatus = status?.gates ?? Object.fromEntries(Object.entries(gates?.gates ?? {}).map(([gate, value]) => [gate, value?.status]));

  let next = `/sfk-status ${feature.featureId ?? ''}`.trim();
  if (!feature.featureId) next = '/sfk-status --all';
  else if (gateStatus['verification-passed'] === 'passed') next = `/sfk-deliver ${feature.featureId}`;
  else if (gateStatus['development-ready'] === 'passed') next = `/sfk-verify ${feature.featureId}`;
  else if (gateStatus['plan-ready'] === 'passed') next = `/sfk-development ${feature.featureId}`;
  else if (gateStatus['design-ready'] === 'passed') next = `/sfk-plan ${feature.featureId}`;
  else if (gateStatus['requirements-ready'] === 'passed') next = `/sfk-design ${feature.featureId}`;

  return { featureId: feature.featureId, nextAction: next };
}

const tools = {
  'sfk.get_state': () => getState(),
  'sfk.get_current_stage': ({ featureId } = {}) => {
    const feature = getFeature(featureId);
    return { featureId: feature.featureId, stage: feature.status?.stage ?? null, blockers: feature.status?.blockers ?? [] };
  },
  'sfk.get_traceability': ({ featureId } = {}) => {
    const feature = getFeature(featureId);
    return { featureId: feature.featureId, traceability: feature.traceability };
  },
  'sfk.update_gate': updateGate,
  'sfk.record_evidence': recordEvidence,
  'sfk.next_action': ({ featureId } = {}) => nextAction(featureId),
};

function toolList() {
  return [
    {
      name: 'sfk.get_state',
      description: 'Read the current .spec-flow-kit state and gates for the workspace.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    },
    {
      name: 'sfk.get_current_stage',
      description: 'Read the current stage and blockers for a feature or the active feature.',
      inputSchema: { type: 'object', properties: { featureId: { type: 'string' } }, additionalProperties: false },
    },
    {
      name: 'sfk.get_traceability',
      description: 'Read traceability.json for a feature or the active feature.',
      inputSchema: { type: 'object', properties: { featureId: { type: 'string' } }, additionalProperties: false },
    },
    {
      name: 'sfk.update_gate',
      description: 'Update a gate status in gates.json. Use only when the caller has determined the status from real artifacts or explicit waiver.',
      inputSchema: {
        type: 'object',
        properties: {
          gate: { type: 'string' },
          status: { type: 'string' },
          evidence: { type: 'array', items: { type: 'string' } },
          reason: { type: 'string' },
          requiredActions: { type: 'array', items: { type: 'string' } },
        },
        required: ['gate', 'status'],
        additionalProperties: false,
      },
    },
    {
      name: 'sfk.record_evidence',
      description: 'Append one JSON evidence record to a feature evidence.jsonl file. Do not use for fabricated command output or secrets.',
      inputSchema: {
        type: 'object',
        properties: {
          featureId: { type: 'string' },
          record: { type: 'object' },
        },
        required: ['record'],
        additionalProperties: false,
      },
    },
    {
      name: 'sfk.next_action',
      description: 'Suggest the next spec-flow-kit command for a feature or active feature.',
      inputSchema: { type: 'object', properties: { featureId: { type: 'string' } }, additionalProperties: false },
    },
  ];
}

function writeMessage(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}

function writeResponse(id, result) {
  writeMessage({ jsonrpc: '2.0', id, result });
}

function writeError(id, code, message) {
  writeMessage({ jsonrpc: '2.0', id, error: { code, message } });
}

function handleRequest(request) {
  const { id, method, params } = request;
  if (method === 'initialize') {
    writeResponse(id, {
      protocolVersion: params?.protocolVersion ?? '2024-11-05',
      capabilities: { tools: {} },
      serverInfo: { name: 'spec-flow-kit', version: '0.1.0', pluginRoot },
    });
    return;
  }

  if (method === 'notifications/initialized') return;

  if (method === 'tools/list') {
    writeResponse(id, { tools: toolList() });
    return;
  }

  if (method === 'tools/call') {
    const name = params?.name;
    const handler = tools[name];
    if (!handler) {
      writeError(id, -32601, `Unknown tool: ${name}`);
      return;
    }

    try {
      const value = handler(params?.arguments ?? {});
      writeResponse(id, {
        content: [{ type: 'text', text: JSON.stringify(value, null, 2) }],
      });
    } catch (error) {
      writeResponse(id, {
        isError: true,
        content: [{ type: 'text', text: error instanceof Error ? error.message : String(error) }],
      });
    }
    return;
  }

  if (id !== undefined) writeError(id, -32601, `Unsupported method: ${method}`);
}

function tryReadContentLength(buffer) {
  const crlfHeaderEnd = buffer.indexOf('\r\n\r\n');
  const lfHeaderEnd = buffer.indexOf('\n\n');
  const usesCrlf = crlfHeaderEnd !== -1 && (lfHeaderEnd === -1 || crlfHeaderEnd < lfHeaderEnd);
  const headerEnd = usesCrlf ? crlfHeaderEnd : lfHeaderEnd;
  if (headerEnd === -1) return null;

  const header = buffer.slice(0, headerEnd).toString('utf8');
  const match = header.match(/(?:^|\r?\n)Content-Length:\s*(\d+)/i);
  if (!match) return null;

  const length = Number(match[1]);
  const bodyStart = headerEnd + (usesCrlf ? 4 : 2);
  const bodyEnd = bodyStart + length;
  if (buffer.length < bodyEnd) return null;

  return {
    body: buffer.slice(bodyStart, bodyEnd).toString('utf8'),
    rest: buffer.slice(bodyEnd),
  };
}

function tryReadJsonLine(buffer) {
  const newline = buffer.indexOf('\n');
  if (newline === -1) return null;

  const lineBuffer = buffer.slice(0, newline);
  const line = lineBuffer.toString('utf8').trim();
  if (!line.startsWith('{')) return null;

  return {
    body: line,
    rest: buffer.slice(newline + 1),
  };
}

let inputBuffer = Buffer.alloc(0);
process.stdin.on('data', (chunk) => {
  inputBuffer = Buffer.concat([inputBuffer, Buffer.from(chunk)]);

  while (inputBuffer.length > 0) {
    const message = tryReadContentLength(inputBuffer) ?? tryReadJsonLine(inputBuffer);
    if (!message) break;

    inputBuffer = message.rest;
    try {
      handleRequest(JSON.parse(message.body));
    } catch (error) {
      writeError(null, -32700, error instanceof Error ? error.message : 'Parse error');
    }
  }
});
