# NV. FACE LAB — Version 2 / Phase 1 preview candidate

A standalone, responsive computer-vision visual experiment for **NV SHARP SOLUTIONS**. Uses original HTML, CSS and JavaScript with Google's MediaPipe Tasks Vision SDK to render on-device face landmarks and heuristic hand-gesture-driven neon visual effects.

## Quick start

1. Extract the ZIP and keep `index.html`, `styles.css`, `app.js`, `performance.mjs`, `favicon.svg` and `_headers` together.
2. For local development, open a terminal in this directory and run `python -m http.server 8000` (or `npx serve .`), then visit `http://localhost:8000`.
3. Read the consent notice, check the consent checkbox, then press **Start experience**. Your browser will request webcam permission.
4. Hold up 0–5 fingers to change the neon palette. Five fingers also trigger a particle burst. Use **Stop camera** to release your webcam.
5. Push these **extracted files** (not the ZIP file) into the root of your own GitHub repository, such as `nv-face-lab`. Connect that repository to a separate Cloudflare Pages project using **Connect to Git**. Cloudflare then deploys changes automatically whenever you push to the production branch. The `_headers` file adds defensive HTTP response headers.

Do not open `index.html` using a `file://` URL. Camera access needs HTTPS or localhost.

## Existing GitHub → Cloudflare Pages deployment (preview-first)

The production repo is **https://github.com/navodravijay/nv-face-lab** and its production site is **https://nv-face-lab.pages.dev/**. Do **not** create another repository or Cloudflare project, and do **not** upload this ZIP to `main` directly.

1. Preserve the currently working `main` commit. Create a new GitHub branch named `feature/v2-premium-hybrid` from that commit.
2. Upload the **extracted individual files** from this package into the new branch's repository root. File names and paths matter; `performance.mjs` must be beside `app.js`. For the repository's stray `download` file containing `.gitignore` entries, rename/delete it in the feature branch as appropriate and use `.gitignore` in the repository root.
3. GitHub → Cloudflare Pages auto-deployment should create a **preview** for that branch if preview deployments are enabled. If no preview appears, review Cloudflare Pages → Settings → Builds & deployments / branch controls.
4. On the HTTPS preview, verify actual camera start/stop, Face and Hand Landmarker functionality, consent, cross-browser behavior, console, privacy notices, performance, and response headers. See `RELEASE_CHECKLIST.md`.
5. Only after passing checks, open a PR from `feature/v2-premium-hybrid` into `main`, review the diff, and merge. Cloudflare should automatically deploy the production branch. Verify the live site and retain the previous commit for rollback.

> This archive is a **preview candidate**, not evidence of a tested production release. The code is built by merging Phase 1 changes onto the user's uploaded repository ZIP, which matched the previously provided V1 files for every tracked website asset (the only extra file was `download`, containing `.gitignore` rules). No GitHub push or Cloudflare deployment was performed here.

## Phase 1 improvements and tests

- Adaptive inference throttling between 50–180 ms based on synchronous detection duration.
- Data-saver / low-core-count camera requests: ideal 640x480 at 24 fps, preserving normal desktop settings on faster hardware.
- Camera-playback timeout and clearer errors for startup failures.
- Readout renamed from FPS to **TRACK/S** to avoid confusing inference frequency with display frame rate.
- Run `node --test tests/*.test.mjs`, `node --check app.js`, and `node --check performance.mjs` to check pure helpers, security invariants, and syntax.

## What is included

- One face and one hand can be tracked in the browser via MediaPipe.
- Face mesh and contours, hand connections, finger-count heuristic, color responses, particle effects, idle wireframe sculpture.
- Responsive desktop/mobile UI with controls for camera preview, mesh and reduced motion.
- Explicit opt-in for local camera processing. Video and audio are not transmitted by this application code. The app does not implement recording, accounts, analytics, tracking pixels, external logging, or data storage.
- MediaPipe source and WASM pinned at version **1.1.1**, compatible model URLs pinned to version 1.
- HTTPS production policy in `_headers` with CSP, Permissions-Policy and other defense-in-depth headers.

## Privacy & security notes (important)

- **Only use Start after informed consent.** The browser controls actual camera permission. When Stop is pressed, consent is withdrawn, or the tab becomes hidden/navigates away, camera tracks are stopped.
- Frames and landmark coordinates are processed locally and not sent to a server by this project's code. No microphone permission is requested.
- **Third-party network requests:** This starter downloads MediaPipe JavaScript and WASM from `cdn.jsdelivr.net` and task models from `storage.googleapis.com` after the user starts. Those servers necessarily see ordinary network request metadata such as IP addresses. Google's MediaPipe documentation states that *usage/performance metrics can be sent to Google*. Obtain any legally necessary consent, and review applicable policies before deploying for public users.
- The supplied CSP allows only the listed asset origins. The runtime's own metrics endpoint behavior is outside the scope of this standalone project; CSP may block some third-party metrics calls. Do not claim the SDK never transmits any network data.
- Third-party CDN delivery is version-pinned but is not cryptographically integrity-locked here. For high-assurance deployment, review and self-host version-locked dependencies and models, verify asset hashes and licenses, then tighten `connect-src` and `script-src` to `'self'` after testing.
- This visualization is **face tracking, not biometric identification**. It does not authenticate people, recognize identities or determine who they are. Do not market it as access control or identity verification.
- Finger counting is approximate, dependent on lighting and hand angle, and is not a trained sign-language interpreter. UI `TRACK/S` readings represent approximate completed inference cycles per second (not display FPS).
- Safari, Chrome and Android/browser support varies. MediaPipe uses synchronous inference on the main thread with adaptive throttling, which may still cause jank on older devices. A dedicated Worker may help in a later phase, but requires real-browser WebGL/OffscreenCanvas tests.
- There is no formal penetration-test, compatibility test on physical cameras, or independent privacy audit. Do not claim this project is 100% secure.

## Security and performance checklist before client deployment

- [ ] Verify camera permission, denial and camera disconnection states on target devices.
- [ ] Verify that Stop, permission withdrawal, hidden tabs and navigation all stop the camera indicator.
- [ ] Use DevTools > Network to inspect all requests, confirming no camera frames are sent.
- [ ] Check the CSP console for blocked required resources and test on the actual static host.
- [ ] Monitor dependency advisories; do not silently change MediaPipe version or model paths.
- [ ] Review Google's MediaPipe license and privacy disclosures plus applicable consent requirements.
- [ ] Run Lighthouse and inspect rendering smoothness on mid-range phones.
- [ ] Consider a privacy notice localized for your audience and a contact for privacy inquiries.

## Official technical references

- https://ai.google.dev/edge/mediapipe/solutions/vision/face_landmarker/web_js
- https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker/web_js
- https://developers.google.com/edge/mediapipe/solutions/tasks (privacy notice)
- https://owasp.org/www-project-secure-headers/

## Attribution

**Designed & Developed by Navod Ravindu Jayaweera** for NV SHARP SOLUTIONS.

Original NV. FACE LAB app code and design. Powered by MediaPipe, a Google project distributed under its own terms. This project is **not** a copy of the `rukiya98/neon-face-scan` repository, nor does it represent any endorsement or affiliation with that repository.
