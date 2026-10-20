import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read=name=>readFileSync(new URL(`../${name}`,import.meta.url),'utf8');
const html=read('index.html'), app=read('app.js'), style=read('styles.css');
test('only one fixed orbit accent, no mode selectors or particle bursts in stage',()=>{
  assert.match(html,/SINGLE ORBIT \/ TOP LEFT/);
  assert.doesNotMatch(html,/data-effect=/);
  assert.doesNotMatch(html,/fx-placement-select/);
  assert.match(app,/function renderVisualFX\(ms\)/);
  assert.doesNotMatch(app,/drawBurst\(/);
  assert.doesNotMatch(app,/spawnBurst\(/);
  assert.doesNotMatch(app,/drawEnvironment\(/);
});
test('brand, tracking, privacy and camera lifecycle preserved',()=>{
  assert.match(html,/Navod Ravindu Jayaweera/);
  assert.match(html,/VISION ENGINE 02/);
  for(const c of ['#080d1b','#4d8dff','#4de0ff']) assert.match(style,new RegExp(c));
  for(const id of ['quality-select','consent','start-btn','stop-btn','motion-toggle','stage-mode-indicator']) assert.match(html,new RegExp(`id="${id}"`));
  assert.match(app,/visibilitychange/);
  assert.match(app,/getUserMedia\(/);
  assert.match(read('_headers'),/Permissions-Policy: camera=\(self\), microphone=\(\)/);
});
