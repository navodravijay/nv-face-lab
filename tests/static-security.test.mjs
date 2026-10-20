import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = name => readFileSync(resolve(root, name), 'utf8');
const headers = read('_headers');
const html = read('index.html');
const app = read('app.js');

test('static headers retain CSP, camera-only policy, and clickjacking protections', () => {
  for (const field of ['Content-Security-Policy:', 'X-Frame-Options: DENY', 'X-Content-Type-Options: nosniff', 'Permissions-Policy: camera=(self), microphone=()']) {
    assert.ok(headers.includes(field), `${field} missing`);
  }
  assert.ok(headers.includes("object-src 'none'"));
  assert.ok(headers.includes("frame-ancestors 'none'"));
});

test('the live UI still contains required consent and stop controls', () => {
  for (const id of ['consent', 'start-btn', 'stop-btn', 'camera', 'vision-canvas', 'error-message']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(app, /getUserMedia/);
  assert.match(app, /getTracks\(\)\.forEach\(/);
  assert.match(app, /visibilitychange/);
  assert.match(app, /pagehide/);
});

test('developer and brand identity preserved', () => {
  assert.match(html, /Navod Ravindu Jayaweera/);
  assert.match(html, /NV SHARP SOLUTIONS/);
  assert.match(html, /brand-mark">NV<span>\.<\/span>/);
});

test('app keeps microphone disabled and models version-pinned', () => {
  assert.match(app, /MP_VERSION = "1\.1\.1"/);
  assert.match(app, /getCameraConstraints/);
  assert.match(read('performance.mjs'), /audio: false/);
});


test('phase 1 module dependency and browser entrypoints are present', () => {
  assert.match(html, /type="module" src="\.\/app\.js"/);
  assert.match(app, /from "\.\/performance\.mjs"/);
  assert.match(read('performance.mjs'), /calculateInferenceGap/);
  assert.match(read('performance.mjs'), /getCameraConstraints/);
});

test('canvas initialization checks context before registering resize handlers', () => {
  assert.match(app, /if \(ctx\) \{\s*window\.addEventListener\("resize"/);
});
