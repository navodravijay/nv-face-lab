# NV. FACE LAB V2 Phase 1 — Release checklist

## Source baseline — mandatory
- [x] Compared the uploaded `nv-face-lab-main.zip` website source files with the original V1 ZIP; `README.md`, `_headers`, `app.js`, `favicon.svg`, `index.html`, `styles.css` matched byte for byte. GitHub remote and current commit state are not independently verified.
- [x] Merged reviewed Phase 1 changes over the user-supplied ZIP while retaining unchanged original assets and headers; an extra `download` file containing `.gitignore` rules was replaced with properly named `.gitignore`. Check for newer remote commits before upload.
- [ ] Preserve a link to the last working commit and current Cloudflare production deployment.

## Change scope
- Adaptive 50–180 ms inference interval based on last synchronous inference duration (helps but does not eliminate jank).
- Low-power camera request 640x480@24fps on <=4-core/save-data devices, otherwise 1280x720@30fps ideal.
- Timeout with cleanup if video.play() never settles; retry remains available.
- Clear `TRACK/S` label for completed inference calls, not misleading display FPS.
- Visible experiment/engine revision markers changed to 002; design/colors/credits preserved.
- Added offline Node tests; no new network dependencies or permissions.

## Automated tests (run locally)
```sh
node --test tests/*.test.mjs
node --check app.js
node --check performance.mjs
```

## Manual browser checks — must pass on actual devices
- [ ] Privacy consent required before Start becomes active.
- [ ] Start prompts for camera, begins face and hand landmarks without console error.
- [ ] Unchecking consent during startup and after startup releases camera indicator.
- [ ] Stop releases all camera tracks, status returns to OFFLINE, no stale face landmarks remain.
- [ ] Tab background/hide and navigating away release the camera.
- [ ] Permission denied, no camera, lost device, slow network, and model load failure show helpful errors.
- [ ] Face/hand detection and 0–5 finger gestures unchanged from V1.
- [ ] Low-power Android, iOS Safari (if available), desktop Chrome/Edge tested; no severe jank.
- [ ] Keyboard/focus visibility, high-zoom, reduced-motion and mobile layout still work.
- [ ] DevTools Network: document all MediaPipe requests, verify camera frames are not uploaded by app code, inspect any usage metrics.
- [ ] Security response headers checked on deployed preview, CSP not breaking required model downloads.
- [ ] Dependency and model license/advisory review performed; no independent audit is claimed.

## GitHub → Cloudflare workflow
1. Create `feature/v2-premium-hybrid` from the **latest existing `main` branch**; confirm its commit matches the user-uploaded snapshot before applying files.
2. Compare and cherry-pick/apply these changes to that branch; do not directly replace live production files unless the baseline matches exactly.
3. Push that feature branch. Check the Cloudflare Pages **preview** deployment for that branch.
4. Perform the manual checks. Resolve any CSP/runtime issues without broad `unsafe-inline`/`unsafe-eval` exceptions.
5. Open a PR, review the changes, and merge to `main` only after approval.
6. Verify deployment at `https://nv-face-lab.pages.dev/`. Roll back using the saved previous commit if necessary.

No production deployment or GitHub commit was made when this candidate was generated.
