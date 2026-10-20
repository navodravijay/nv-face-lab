# V2.3 Preview-specific checks

- [ ] GitHub upload was to `feature/v2-premium-hybrid` (NOT `main`).
- [ ] Cloudflare Preview shows **one small neon orbit at upper left of the camera stage**.
- [ ] No decorative animated effects on the face or in other canvas corners.
- [ ] If face moves into upper-left corner, ornament is safely clipped away.
- [ ] Hand detection changes ornament COLOR only, never spawns a new animation.
- [ ] Start, Stop, permission withdrawal, background tab behavior remain correct.
- [ ] Preview mobile layout and no unexpected horizontal scrolling.
- [ ] Reduced-motion preference freezes orbit; live response/security headers checked.

---

# V2.2 Release Checklist — FACE SAFE ZONE

**Never upload this package to `main` before branch Preview testing.**

1. Verify Preview deployment was triggered from `feature/v2-premium-hybrid`, not `main`.
2. Open the page without camera. Switch through AUTO, CALM, ORBIT, WAVE, BLOOM, BURST. The idle face should have no light paths passing over its center.
3. Start camera only after consent. Move face left/right and toward camera. Effects should disappear behind the protected rectangular face area, never cross eyes/nose/mouth; landmarks themselves remain visible.
4. Switch Effect placement from FOCUSED / CLEAN to CINEMATIC / EDGE FX. Both must keep face unobstructed.
5. Verify gesture stability controls (STEADY and RESPONSIVE) and camera stop / hidden-tab behavior.
6. Verify mobile portrait orientation and narrow phone; if face fills frame, peripheral effects may be mostly hidden intentionally.
7. Browser DevTools: no uncaught errors or blocked model loads; no uploads of video frames or face landmarks by app code; review external MediaPipe requests and Cloudflare security headers.
8. Validate accessibility (keyboard controls and reduced-motion setting) and performance on actual devices.
9. Verify brand `NV.`, #080d1b / #4d8dff / #4de0ff, developer Navod Ravindu Jayaweera, and Privacy Notice preserved.
10. Merge from a Pull Request only after testing; protect `main` via GitHub branch ruleset when convenient.

Automated tests cannot guarantee security, privacy, or camera behavior on user devices.
