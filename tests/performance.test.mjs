import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateInferenceGap, getCameraConstraints } from '../performance.mjs';

test('fast inference preserves the normal 20Hz cap', () => {
  assert.equal(calculateInferenceGap(5, 50), 50);
});

test('slow inference increases cooldown without exceeding safety bounds', () => {
  let gap = 50;
  for (let i = 0; i < 12; i++) gap = calculateInferenceGap(130, gap);
  assert.ok(gap > 140 && gap <= 180, `adaptive gap=${gap}`);
});

test('cooldown reduces gradually after inference gets fast again', () => {
  const gap = calculateInferenceGap(4, 160);
  assert.ok(gap >= 50 && gap < 160);
});

test('invalid timings do not produce NaN or unlimited waits', () => {
  for (const v of [NaN, -10, Infinity, undefined]) {
    const gap = calculateInferenceGap(v, Infinity);
    assert.ok(Number.isFinite(gap) && gap >= 50 && gap <= 180);
  }
});

test('low power defaults request lower camera resolution; no audio', () => {
  const result = getCameraConstraints({ hardwareConcurrency: 2 });
  assert.equal(result.video.width.ideal, 640);
  assert.equal(result.video.frameRate.ideal, 24);
  assert.equal(result.audio, false);
});

test('desktop camera defaults keep original resolution; no audio', () => {
  const result = getCameraConstraints({ hardwareConcurrency: 8 });
  assert.equal(result.video.width.ideal, 1280);
  assert.equal(result.video.height.ideal, 720);
  assert.equal(result.audio, false);
});

test('data saver chooses low power camera preset', () => {
  const result = getCameraConstraints({ hardwareConcurrency: 16, saveData: true });
  assert.equal(result.video.width.ideal, 640);
});
