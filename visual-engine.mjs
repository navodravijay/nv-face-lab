/** Pure, dependency-free visual mode helpers for NV. FACE LAB. */
export const VISUAL_MODES = Object.freeze({
  calm: {label: 'CALM / 00', description: 'A focused halo of soft light.'},
  orbit: {label: 'ORBIT / 01', description: 'Light traces an endless ellipse.'},
  wave: {label: 'WAVE / 02', description: 'Live pulses ripple through the scene.'},
  bloom: {label: 'BLOOM / 04', description: 'Petals of energy unfold around you.'},
  burst: {label: 'BURST / 05', description: 'Scatter a cloud of light.'}
});
export const SELECTABLE_MODES = Object.freeze(['auto', ...Object.keys(VISUAL_MODES)]);
export function modeForFingerCount(count) {
  if (count === 1) return 'orbit';
  if (count === 2 || count === 3) return 'wave';
  if (count === 4) return 'bloom';
  if (count === 5) return 'burst';
  return 'calm';
}
export function resolvedQuality(choice = 'adaptive', cores = 8, saveData = false) {
  if (choice === 'performance' || choice === 'cinematic') return choice;
  return saveData || (Number.isFinite(cores) && cores > 0 && cores <= 4) ? 'performance' : 'balanced';
}
export function particleBudget(quality = 'balanced', reduceMotion = false) {
  if (reduceMotion) return 0;
  return ({performance: 72, balanced: 124, cinematic: 210})[quality] ?? 124;
}
export function progressBetween(start, now, duration = 460) {
  if (![start, now, duration].every(Number.isFinite) || duration <= 0) return 1;
  return Math.max(0, Math.min(1, (now - start) / duration));
}
