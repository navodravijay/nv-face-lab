import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = name => readFileSync(resolve(root,name),'utf8');
const html=read('index.html'), app=read('app.js'), style=read('styles.css');
test('visual controls are explicit accessible buttons and mapped into JavaScript',()=>{
  for (const mode of ['auto','calm','orbit','wave','bloom','burst']) {
    assert.match(html,new RegExp(`data-effect="${mode}" aria-pressed=`));
  }
  assert.match(app,/SELECTABLE_MODES\.includes\(mode\)/);
  assert.match(app,/setAttribute\("aria-pressed", String\(selected\)\)/);
});
test('brand, metadata, camera lifecycle and offline previews preserved',()=>{
  assert.match(html,/Navod Ravindu Jayaweera/);
  assert.match(html,/VISION ENGINE 02/);
  assert.match(style,/#080d1b/);
  assert.match(style,/#4d8dff/);
  assert.match(style,/#4de0ff/);
  assert.match(app,/function renderVisualFX\(/);
  assert.match(app,/state\.manualMode === "auto"/);
  assert.match(app,/visibilitychange/);
  assert.match(app,/getUserMedia\(/);
});
test('rendering and privacy controls stay in place',()=>{
  for(const id of ['quality-select','consent','start-btn','stop-btn','motion-toggle','stage-mode-indicator']) assert.match(html,new RegExp(`id="${id}"`));
  assert.match(app,/particleBudget\(/);
  assert.match(app,/state\.motionReduced/);
  assert.match(read('_headers'),/Permissions-Policy: camera=\(self\), microphone=\(\)/);
});
