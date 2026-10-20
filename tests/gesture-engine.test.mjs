import test from 'node:test';
import assert from 'node:assert/strict';
import { createGestureStabilizer, SENSITIVITY_PRESETS } from '../gesture-engine.mjs';

test('gesture commits after steady hold instead of fixed number of frames', () => {
  const g=createGestureStabilizer();
  assert.deepEqual(g.sample(1,100),{value:null,changed:false,phase:'stabilizing'});
  assert.equal(g.sample(1,250).value,null);
  assert.deepEqual(g.sample(1,320),{value:1,changed:true,phase:'confirmed'});
  assert.equal(g.sample(1,400).changed,false);
});

test('brief no-hand dropout does not flicker modes', () => {
  const g=createGestureStabilizer();
  g.sample(2,0);g.sample(2,220);
  assert.deepEqual(g.sample(null,330),{value:2,changed:false,phase:'reacquiring'});
  assert.equal(g.sample(2,350).value,2);
  assert.equal(g.sample(null,500).value,2);
  assert.deepEqual(g.sample(null,900),{value:null,changed:true,phase:'waiting'});
});

test('unstable finger readings do not switch to the wrong visual mode', () => {
  const g=createGestureStabilizer();
  g.sample(1,0);g.sample(1,220);
  assert.equal(g.sample(2,250).value,1);
  assert.equal(g.sample(3,330).value,1);
  assert.equal(g.sample(2,430).value,1);
  assert.equal(g.sample(2,650).value,2);
});

test('responsive mode is faster, with a shorter no-hand grace window', () => {
  const g=createGestureStabilizer();
  assert.equal(SENSITIVITY_PRESETS.responsive.holdMs < SENSITIVITY_PRESETS.steady.holdMs,true);
  g.sample(5,0,'responsive');
  assert.equal(g.sample(5,110,'responsive').value,5);
  assert.equal(g.sample(null,370,'responsive').value,null);
});

test('reset, invalid data and nonmonotonic time fail safely', () => {
  const g=createGestureStabilizer();
  g.sample(3,0);g.sample(3,220);
  assert.equal(g.sample(7,300).phase,'invalid');
  assert.equal(g.sample(4,0).value,null);
  g.sample(4,240);
  assert.equal(g.sample(4,250).value,4);
  g.reset();
  assert.equal(g.sample(null,280).value,null);
});
