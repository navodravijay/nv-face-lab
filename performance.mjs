/**
 * NV. FACE LAB Phase 1: small, dependency-free, browser-safe performance helpers.
 * Pure helpers can be regression-tested without webcam or MediaPipe.
 */
export function calculateInferenceGap(durationMs, previousGapMs = 50) {
  const duration = Number.isFinite(durationMs) ? Math.max(0, durationMs) : 0;
  const previous = Number.isFinite(previousGapMs) ? Math.min(180, Math.max(50, previousGapMs)) : 50;
  const target = Math.min(180, Math.max(50, Math.ceil((duration * 1.65) / 10) * 10));
  return Math.max(50, Math.min(180, Math.round(previous * 0.7 + target * 0.3)));
}

export function getCameraConstraints({ hardwareConcurrency, saveData = false } = {}) {
  const lowPower = saveData === true || (
    Number.isFinite(hardwareConcurrency) && hardwareConcurrency > 0 && hardwareConcurrency <= 4
  );
  return {
    video: {
      facingMode: "user",
      width: { ideal: lowPower ? 640 : 1280 },
      height: { ideal: lowPower ? 480 : 720 },
      frameRate: { ideal: lowPower ? 24 : 30, max: 30 }
    },
    audio: false
  };
}
