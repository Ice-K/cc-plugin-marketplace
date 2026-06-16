#!/usr/bin/env node
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const serverPath = path.join(root, 'plugins', 'spec-flow-kit', 'mcp', 'sfk-state-server.js');
const fixtureRoot = mkdtempSync(path.join(tmpdir(), 'sfk-mcp-smoke-'));
const specRoot = path.join(fixtureRoot, '.spec-flow-kit');
const featureDir = path.join(specRoot, 'features', 'AUTH-LOCK-001');

mkdirSync(featureDir, { recursive: true });
writeFileSync(path.join(specRoot, 'state.json'), JSON.stringify({
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
}, null, 2));
writeFileSync(path.join(specRoot, 'gates.json'), JSON.stringify({
  version: 1,
  mode: 'advisory',
  gates: {
    'requirements-ready': { status: 'passed', evidence: [], updatedAt: null },
    'design-ready': { status: 'passed', evidence: [], updatedAt: null },
    'plan-ready': { status: 'passed', evidence: [], updatedAt: null },
    'development-ready': { status: 'passed', evidence: [], updatedAt: null },
    'verification-passed': { status: 'pending', evidence: [], updatedAt: null },
  },
}, null, 2));
writeFileSync(path.join(specRoot, 'project-profile.yaml'), 'version: 1\nproject:\n  name: fixture\n');
writeFileSync(path.join(featureDir, 'status.json'), JSON.stringify({
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
}, null, 2));
writeFileSync(path.join(featureDir, 'traceability.json'), JSON.stringify({
  version: 1,
  featureId: 'AUTH-LOCK-001',
  links: [
    {
      requirementId: 'REQ-001',
      designIds: ['DES-001'],
      taskIds: ['TASK-001'],
      code: ['src/auth.js'],
      tests: ['tests/auth.test.js'],
      evidence: [],
      status: 'partial',
    },
  ],
}, null, 2));
writeFileSync(path.join(featureDir, 'waivers.json'), JSON.stringify({ version: 1, waivers: [] }, null, 2));
writeFileSync(path.join(featureDir, 'evidence.jsonl'), '');

function encode(message) {
  const body = JSON.stringify(message);
  return `Content-Length: ${Buffer.byteLength(body, 'utf8')}\r\n\r\n${body}`;
}

function decodeFrames(buffer) {
  const frames = [];
  let offset = 0;
  while (offset < buffer.length) {
    const headerEnd = buffer.indexOf('\r\n\r\n', offset);
    if (headerEnd === -1) break;
    const header = buffer.slice(offset, headerEnd).toString('utf8');
    const lengthMatch = header.match(/Content-Length:\s*(\d+)/i);
    if (!lengthMatch) throw new Error(`Missing Content-Length header: ${header}`);
    const length = Number(lengthMatch[1]);
    const bodyStart = headerEnd + 4;
    const bodyEnd = bodyStart + length;
    if (buffer.length < bodyEnd) break;
    frames.push(JSON.parse(buffer.slice(bodyStart, bodyEnd).toString('utf8')));
    offset = bodyEnd;
  }
  return frames;
}

function send(child, message) {
  child.stdin.write(encode(message));
}

const child = spawn(process.execPath, [serverPath], {
  cwd: fixtureRoot,
  stdio: ['pipe', 'pipe', 'pipe'],
});

let stdout = Buffer.alloc(0);
let stderr = '';
child.stdout.on('data', (chunk) => {
  stdout = Buffer.concat([stdout, chunk]);
});
child.stderr.on('data', (chunk) => {
  stderr += chunk.toString('utf8');
});

send(child, { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05' } });
send(child, { jsonrpc: '2.0', method: 'notifications/initialized', params: {} });
send(child, { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} });
send(child, { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'sfk.get_current_stage', arguments: {} } });
send(child, { jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'sfk.next_action', arguments: {} } });
child.stdin.end();

const exitCode = await new Promise((resolve) => {
  const timer = setTimeout(() => {
    child.kill('SIGTERM');
    resolve(124);
  }, 5000);
  child.on('exit', (code) => {
    clearTimeout(timer);
    resolve(code ?? 0);
  });
});

if (exitCode !== 0) {
  console.error(stderr || `MCP smoke process exited with ${exitCode}`);
  process.exit(1);
}

const frames = decodeFrames(stdout);
const byId = new Map(frames.filter((frame) => frame.id !== undefined).map((frame) => [frame.id, frame]));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(byId.get(1)?.result?.serverInfo?.name === 'spec-flow-kit', 'initialize response should include spec-flow-kit serverInfo');
const tools = byId.get(2)?.result?.tools ?? [];
for (const toolName of ['sfk.get_state', 'sfk.get_current_stage', 'sfk.get_traceability', 'sfk.update_gate', 'sfk.record_evidence', 'sfk.next_action']) {
  assert(tools.some((tool) => tool.name === toolName), `tools/list should expose ${toolName}`);
}

const stageText = byId.get(3)?.result?.content?.[0]?.text ?? '';
assert(stageText.includes('development_ready'), 'sfk.get_current_stage should return development_ready');

const nextText = byId.get(4)?.result?.content?.[0]?.text ?? '';
assert(nextText.includes('/sfk-verify AUTH-LOCK-001'), 'sfk.next_action should recommend /sfk-verify');

console.log('spec-flow-kit MCP state server smoke test passed.');
