/** Pure, local-only gesture stabilizer. No storage, camera access or network requests. */
export const SENSITIVITY_PRESETS = Object.freeze({
  steady: Object.freeze({holdMs: 220, releaseMs: 390}),
  responsive: Object.freeze({holdMs: 110, releaseMs: 260})
});

export function createGestureStabilizer() {
  let stable = null;
  let candidate = null;
  let candidateSince = null;
  let lastSeenAt = null;
  let lastTimestamp = null;

  const reset = () => {
    stable = null;
    candidate = null;
    candidateSince = null;
    lastSeenAt = null;
    lastTimestamp = null;
  };

  /** Time-based hysteresis is more consistent than a fixed count of inference frames. */
  const sample = (reading, timestamp, sensitivity = 'steady') => {
    const options = SENSITIVITY_PRESETS[sensitivity] || SENSITIVITY_PRESETS.steady;
    const valid = reading === null || (Number.isInteger(reading) && reading >= 0 && reading <= 5);
    if (!Number.isFinite(timestamp) || !valid) {
      return {value:stable, changed:false, phase:'invalid'};
    }
    if (lastTimestamp !== null && timestamp < lastTimestamp) reset();
    lastTimestamp = timestamp;
    const prior = stable;

    if (reading === null) {
      candidate = null;
      candidateSince = null;
      if (stable !== null && lastSeenAt !== null && timestamp - lastSeenAt >= options.releaseMs) {
        stable = null;
      }
      return {value:stable, changed:stable !== prior, phase:stable === null?'waiting':'reacquiring'};
    }

    lastSeenAt = timestamp;
    if (reading === stable) {
      candidate = null;
      candidateSince = null;
      return {value:stable, changed:false, phase:'confirmed'};
    }
    if (candidate !== reading) {
      candidate = reading;
      candidateSince = timestamp;
    }
    if (timestamp - candidateSince >= options.holdMs) {
      stable = reading;
      candidate = null;
      candidateSince = null;
    }
    return {value:stable, changed:stable !== prior, phase:stable === reading?'confirmed':'stabilizing'};
  };

  return {sample, reset};
}
