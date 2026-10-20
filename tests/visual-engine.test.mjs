import test from 'node:test';
import assert from 'node:assert/strict';
import { VISUAL_MODES, SELECTABLE_MODES, modeForFingerCount, resolvedQuality, particleBudget, progressBetween } from '../visual-engine.mjs';

test('modes map all finger counts consistently', () => {
  assert.deepEqual([null,0,1,2,3,4,5].map(modeForFingerCount),
    ['calm','calm','orbit','wave','wave','bloom','burst']);
});
test('each manual mode resolves to a descriptive profile', () => {
  assert.equal(SELECTABLE_MODES.length,6);
  for (const mode of SELECTABLE_MODES.filter(m => m !== 'auto')) {
    assert.ok(VISUAL_MODES[mode].label.length > 4);
    assert.ok(VISUAL_MODES[mode].description.endsWith('.'));
  }
});
test('quality resolution respects weak hardware and data saver', () => {
  assert.equal(resolvedQuality('adaptive',2,false),'performance');
  assert.equal(resolvedQuality('adaptive',8,true),'performance');
  assert.equal(resolvedQuality('adaptive',8,false),'balanced');
  assert.equal(resolvedQuality('cinematic',2,true),'cinematic');
  assert.equal(resolvedQuality('performance',16,false),'performance');
});
test('render budgets are bounded and reduced-motion disables burst particles', () => {
  assert.ok(particleBudget('performance') < particleBudget('balanced'));
  assert.ok(particleBudget('balanced') < particleBudget('cinematic'));
  assert.equal(particleBudget('cinematic',true),0);
});
test('crossfade progress is clamped and safe for invalid timestamps', () => {
  assert.equal(progressBetween(10,0),0);
  assert.equal(progressBetween(10,240,460),0.5);
  assert.equal(progressBetween(10,999),1);
  assert.equal(progressBetween(NaN,999),1);
});
