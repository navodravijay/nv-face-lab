# V2 Premium Hybrid — release checklist

Use a Cloudflare **Preview deployment** from `feature/v2-premium-hybrid`, not production, for all testing until the criteria below pass. Complete the checklist with actual observations from the user's browser/devices.

## Visual / functional
- [ ] V2 `NV.` holo hero is visible on desktop; original monogram reads exactly `NV.`.
- [ ] Developer credit says `Navod Ravindu Jayaweera` in Hero and Footer.
- [ ] AUTO, CALM, ORBIT, WAVE, BLOOM, BURST buttons visibly change the canvas while camera is **off**.
- [ ] Clicking a mode updates aria-pressed and live visual mode readout.
- [ ] BURST creates a finite particle scatter animation; clicking BURST again restarts it.
- [ ] Reduced motion suppresses burst animation and ambient animation as configured.
- [ ] Performance and Cinematic quality choices change drawing load without UI errors.
- [ ] Mobile 360px–430px viewport has no horizontal scrolling; stage and camera controls are legible.
- [ ] Desktop remains usable on 1366px and 1920px viewports.
- [ ] No important links, buttons or text hidden under overlays.

## Camera / gesture on real device
- [ ] Camera is **not** requested merely by opening the website or clicking manual effect buttons.
- [ ] Camera starts only after explicit consent and Start click; permission denial is recoverable.
- [ ] Actual face mesh and the overlay align with the mirrored camera.
- [ ] Hands are detected, and finger counts 0–5 select modes in AUTO (allow for heuristic errors).
- [ ] Manual override works while the camera is running; switch back to AUTO restores gesture control.
- [ ] Stop, tab hidden, permission revocation, and camera unplug release tracks and reset telemetry.
- [ ] Camera starts again after Stop/Start where permissions allow.
- [ ] Missing/slow network for MediaPipe is handled without leaving the camera active.

## Security and privacy
- [ ] `_headers` is present at the deployed root and live document response includes CSP, Permissions-Policy and X-Content-Type-Options.
- [ ] Browser console has no script/CSP/asset errors (especially dynamic module + WASM loading).
- [ ] Network tab shows no unexpected image/frame uploads or unrelated trackers. Review external MediaPipe traffic.
- [ ] Dependencies pinned and licensing reviewed; no secrets or biometric recordings committed.
- [ ] Check basic keyboard focus, screen-reader announcements, contrast, reduced motion, and accessibility.
- [ ] Device CPU/GPU load, frame rate and battery impact acceptable on a mid-range phone.
- [ ] Run and document automated tests, a Lighthouse/performance review, and relevant OWASP checks.

## Deploy
- [ ] Confirm GitHub branch preview points to the latest V2 commit.
- [ ] Submit a pull request; inspect diff before merge.
- [ ] Merge only after preview tests pass and rollback commit is available.
- [ ] Confirm `https://nv-face-lab.pages.dev/` resolves to new production commit and V2 controls work.

**Validation note:** Node static tests and a synthetic browser UI test are not substitutes for camera, external MediaPipe network, and live Cloudflare CSP testing.
