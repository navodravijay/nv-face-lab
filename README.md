# NV. FACE LAB — Version 1

A standalone, responsive computer-vision visual experiment for **NV SHARP SOLUTIONS**. Uses original HTML, CSS and JavaScript with Google's MediaPipe Tasks Vision SDK to render on-device face landmarks and heuristic hand-gesture-driven neon visual effects.

## Quick start

1. Extract the ZIP and keep `index.html`, `styles.css`, `app.js`, `favicon.svg` and `_headers` together.
2. For local development, open a terminal in this directory and run `python -m http.server 8000` (or `npx serve .`), then visit `http://localhost:8000`.
3. Read the consent notice, check the consent checkbox, then press **Start experience**. Your browser will request webcam permission.
4. Hold up 0–5 fingers to change the neon palette. Five fingers also trigger a particle burst. Use **Stop camera** to release your webcam.
5. Push these **extracted files** (not the ZIP file) into the root of your own GitHub repository, such as `nv-face-lab`. Connect that repository to a separate Cloudflare Pages project using **Connect to Git**. Cloudflare then deploys changes automatically whenever you push to the production branch. The `_headers` file adds defensive HTTP response headers.

Do not open `index.html` using a `file://` URL. Camera access needs HTTPS or localhost.

## GitHub → Cloudflare Pages deployment (recommended)

1. On GitHub, create a **new** repository named `nv-face-lab` under your account. Avoid changing the existing `nova-digital` repository.
2. Extract this ZIP locally. In the new GitHub repository, choose **Add file → Upload files** and upload the extracted `index.html`, `styles.css`, `app.js`, `favicon.svg`, `_headers`, and `README.md` into the repository root (not a nested folder). Commit to `main`.
3. In the [Cloudflare dashboard](https://dash.cloudflare.com/), open **Workers & Pages → Create application → Pages → Connect to Git** (wording may vary slightly). Select `nv-face-lab`, authorize access if asked, and begin setup.
4. Recommended settings: **Production branch** `main`; **Framework preset** `None`; **Build command** blank (or `exit 0` if a value is required); **Build output directory** `.`; **Root directory** repository root.
5. Deploy, open the generated `pages.dev` URL, and test the camera on HTTPS using real hardware.
6. On later changes, push a commit to `main`; Cloudflare will automatically trigger a new production deployment. Never commit API keys, private user images, biometric data, or credentials.

> Upload the **individual extracted files** to GitHub. Uploading the `.zip` as one file will not publish the site. GitHub and Cloudflare deployment setup is not performed by this ZIP alone.

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
- Finger counting is approximate, dependent on lighting and hand angle, and is not a trained sign-language interpreter. UI frame-rate readings represent approximate completed inference cycles per second (not display FPS).
- Safari, Chrome and Android/browser support varies. MediaPipe uses synchronous inference on the main thread here, which can cause jank on older devices. Consider a dedicated Worker for a production upgrade, but check WebGL/OffscreenCanvas support first.
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

Original NV. FACE LAB app code and design. Powered by MediaPipe, a Google project distributed under its own terms. This project is **not** a copy of the `rukiya98/neon-face-scan` repository, nor does it represent any endorsement or affiliation with that repository.
