import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read=f=>readFileSync(new URL(`../${f}`,import.meta.url),'utf8');
test('gesture response control and visible telemetry exist',()=>{
 const html=read('index.html'),app=read('app.js');
 assert.match(html,/id="sensitivity-select"/);
 assert.match(html,/id="gesture-signal"/);
 assert.match(app,/createGestureStabilizer\(/);
 assert.match(app,/gestureStabilizer\.sample\(/);
 assert.match(app,/gestureStabilizer\.reset\(/);
 assert.doesNotMatch(app,/proposedFrames/);
});
test('privacy and brand are preserved',()=>{
 const html=read('index.html'),app=read('app.js');
 assert.match(html,/Navod Ravindu Jayaweera/);
 assert.match(html,/NV SHARP SOLUTIONS/);
 assert.match(app,/visibilitychange/);
 assert.match(app,/pagehide/);
 assert.match(read('_headers'),/Content-Security-Policy/);
});
