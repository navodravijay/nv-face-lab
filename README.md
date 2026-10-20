# NV. FACE LAB — V2.3 Single Top-Left Orbit

**Preview candidate; do not deploy to production without live webcam testing.**

- Exactly **one small neon accent** is drawn in the **upper-left corner of the live camera stage**.
- Removed four-corner animations, accent/wave/bloom/burst switching and moving environmental scanlines from the camera stage.
- Removed the obsolete visual mode selector and effect placement selector. Hand detection remains, changing **only the accent color**.
- Face and hand landmarks still track normally. Face-safe clipping masks the ornament if a face moves into the top-left area.
- Privacy consent, stop camera, reduced motion, render quality, gesture responsiveness, branding and full developer name remain.
- Styling outside the camera stage (e.g. website hero branding) is otherwise retained.
- The existing MediaPipe CDN/model connections remain; no extra network dependencies were added.
- Preview first using `feature/v2-premium-hybrid` branch. Verify face at upper left, camera start/stop, hand color changes, mobile and console, then promote only after test approval.

---

# NV. FACE LAB — V2.2 Clean Face Visual Layout

**Earlier V2.2 release notes (historical reference).**

V2.2 changes (on top of V2.1):

- Default **Focused / Clean** mode: smaller, quieter animations anchored to four outer regions of the camera frame.
- Optional **Cinematic / Edge FX**: stronger peripheral effects; still respects a face-safe exclusion rectangle.
- The face safe area derives from current face landmarks with additional padding; when the camera is off it protects the center idle wireframe.
- Environment scanlines, particle bursts and all visual effects are clipped outside that area.
- Removed the animated nose/crosshair reticle; face mesh and hand landmarks remain.
- No new CDN requests, third-party libraries, camera changes or storage.
- If a face fills nearly the whole frame, effects may become faint/hidden, intentionally prioritizing face readability.
- Test actual webcam motion, profile view, partially cropped faces and mobile portrait mode before merging.

---


**An original real-time face and hand landmark visualization experiment.**

**Developer:** Navod Ravindu Jayaweera  
**Studio:** NV SHARP SOLUTIONS  
**Main website:** https://nv-sharp-solutions.pages.dev/  
**Live production:** https://nv-face-lab.pages.dev/ (verify its current commit before release)  
**GitHub:** https://github.com/navodravijay/nv-face-lab

## What changed in V2.1 (relative to the V2 Visual Engine)

- Improved AUTO gesture stability with **time-based hysteresis**, replacing the former fixed three-frame acceptance. Better tolerance of brief missed detections while face/hand inference rates vary.
- **Gesture response** setting: Steady / Smooth (default; 220 ms gesture confirmation, 390 ms lost-hand grace) or Responsive / Fast (110 ms, 260 ms). It affects mode changes only, not camera capture or AI model inference.
- Clear visible hand-signal feedback: stabilizing, confirmed, briefly lost, or no hand. Status stays local and is not stored.
- Improved unit tests for gesture jitter, no-hand dropout, invalid input and performance-mode independence.
- No new third-party dependencies, external requests or storage.
- Tests alone are insufficient for production approval; validate actual camera behavior in Cloudflare Preview.

## What changed in V2

This release builds on the confirmed working V2 Phase 1 source, **not** on the original third-party neon-face-scan project.

- Added original CSS 3D-style `NV.` hero sculpture and a visibly new premium hybrid layout.
- Added an interactive **AUTO / CALM / ORBIT / WAVE / BLOOM / BURST** creative deck.
- AUTO translates hand finger count into visual modes: 0=Calm, 1=Orbit, 2–3=Wave, 4=Bloom, 5=Burst. Finger detection is heuristic and varies by hand angle and lighting.
- Visual modes are implemented in Canvas 2D. They can be explored manually **without turning on the camera**.
- Added smoother transitions between visual modes, an effect status display, a particle-burst behavior, and quality controls.
- Added adaptive, performance, and cinematic rendering modes, capped particle counts and reduced-motion support.
- Retained V1 camera consent, stop/disconnect/hidden-tab handling, MediaPipe tasks, and Phase 1 adaptive inference scheduler.
- Preserved developer credit, main website links, brand `NV.` punctuation and colors (#080d1b / #4d8dff / #4de0ff).

## Important design distinctions

- **Face tracking is not face recognition**. The app draws anatomical landmarks; it does not identify people.
- **Offline effects:** manually clicking visual modes is allowed while camera is off; clicking Start still requires informed consent.
- **Automatic gestures:** if the camera is live and AUTO is selected, recognized hand gestures select rendering modes. Manual modes override automatic effect selection; the face/hand telemetry remains active.
- **Privacy:** application code does not intentionally save, record, upload or persist camera frames, face templates or landmarks, but external code/model assets are downloaded from third-party origins. Google's MediaPipe documentation describes collection of some usage/performance metrics. Review documentation and network behavior before launch.
- **Canvas 2D, not real 3D geometry**: the hero illustration uses CSS transforms; the face renderer and the effects use Canvas 2D.

## Repository layout

```text
index.html        # Static interface and accessible controls
styles.css        # Site design and responsive visual engine styles
app.js            # Webcam, MediaPipe, Canvas and UI orchestration
visual-engine.mjs # Tested, pure visual mode / quality helpers
gesture-engine.mjs # Pure, tested frame-rate-independent gesture stabilizer
performance.mjs   # Tested, pure inference gap and camera helpers
favicon.svg
_headers          # Cloudflare Pages response headers and CSP
tests/*.test.mjs  # Node.js regression tests
README.md
RELEASE_CHECKLIST.md
```

## Local development

Run from a local development server instead of directly opening `index.html` as `file://`.

```bash
python -m http.server 8000
```

Open http://localhost:8000/ in an up-to-date browser. Camera capture requires HTTPS (on Cloudflare) or an allowed secure localhost origin. MediaPipe code/models are retrieved over the network when the user explicitly starts the experience.

Run automated tests (Node.js 18+ recommended):

```bash
node --test tests/*.test.mjs
```

The repo deliberately has no npm build step or package installation and should stay a static Cloudflare Pages project with Build command **blank** and Build output directory **`.`**.

## GitHub → Cloudflare Pages preview workflow

**Do not upload this V2.1 update to `main` until the checklist passes.** The earlier V2 Visual Engine was already accidentally uploaded to production; this V2.1 package should go ONLY to `feature/v2-premium-hybrid` for testing.

1. Open `https://github.com/navodravijay/nv-face-lab` and select branch `feature/v2-premium-hybrid`.
2. Unzip the release locally; upload the files and folders **inside** the ZIP to the **repository root**. Replace existing files and commit, e.g., `Build V2 Premium Hybrid Visual Engine`.
3. In Cloudflare Pages → Deployments, open the **newest Preview** deployment for `feature/v2-premium-hybrid`.
4. Test modes while camera is off, then consent and test webcam, face/hand tracking, camera stop and browser permissions on real desktops and phones.
5. Verify response security headers via browser DevTools, and run performance/accessibility tests. **Do not** treat automated syntax checks as production certification.
6. After checks, create and merge a Pull Request into `main` to trigger the existing production deployment. Preserve the last known-good commit as a rollback point.

Production website and repositories were **not modified by producing this ZIP**.

## Security considerations

- All external MediaPipe script and model URLs are pinned to a specific version, but they are still third-party resources. For production hardening, review/checksum and self-host verified bundles/models when the licensing and deployment plan permit it.
- The current CSP in `_headers` permits MediaPipe modules and WASM; its restrictions are less strict than fully self-hosted dependencies. Check deployment security headers rather than assuming the file is applied.
- Do not add facial identification, image recording, user analytics, or backend storage without a separate privacy and threat-model review.
- FPS/performance and finger counts are UI statistics, not biometric claims. Results can vary by browser, device and lighting.
- `quality=cinematic` intentionally consumes more resources; Performance and Reduce motion are provided as alternatives.

## Acknowledgment and licensing

This is an original NV SHARP SOLUTIONS interface and visualization, built with Google's MediaPipe Tasks Vision. Its dependencies have their own licenses; review them before redistribution. This code does not copy the neon-face-scan repository source code. V2 inherits the project's existing license status; **no license grant is invented here**.
