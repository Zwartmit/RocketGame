---
name: testing-newton-sim
description: Test the Ley de Newton 3D physics simulator (Next.js + R3F + Rapier) end-to-end. Use when verifying physics, telemetry, camera tracking, the GLB drone model, or responsive/mobile UI changes.
---

# Testing the Ley de Newton 3D Simulator

Interactive 3D physics sim: a drone ejects propellant and accelerates per `a = F / m`
in zero gravity. The UI is themed around **Newton's Second Law** (Ley de la Dinámica).
Stack: Next.js (App Router) + React 19, @react-three/fiber + drei, @react-three/rapier,
Tailwind, GSAP + react-lenis. UI text is in Spanish. Everything is on one page with an
always-visible overlay.

## Run it

```bash
cd /home/ubuntu/repos/Ley-Newton
npm install        # requires .npmrc legacy-peer-deps=true (react-lenis vs React 19)
npm run dev        # serves http://localhost:3000
```

Verify it's up: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000` → `200`.

Static checks (run before/after changes):
```bash
npm run lint
npx tsc --noEmit
npm run build
```

CI: the repo is deployed on **Netlify**. PRs get a `netlify/leynewton/deploy-preview`
check plus redirect/header rule checks. There is no GitHub Actions test workflow, so the
local checks above are the real gate for code correctness.

## Key UI elements (Spanish)

- **Ignición** button: starts the burn. Shows **Encendido…** (disabled) while thrusting,
  re-enables when the burn ends. The `Drone` component is the single source of truth for
  thrust state (`onThrustingChange`).
- **Reiniciar**: re-centers the drone and zeroes velocity/telemetry.
- Sliders: **Masa del propelente** (kg, burn duration = `propellantMass * 0.45 s`),
  **Fuerza de eyección** (N, the net force F), **Masa del dron** (kg, sets the RigidBody
  collider mass and remounts the body via React `key`).
- **Telemetría** panel (top-right on desktop): Velocidad (m/s), Aceleración (m/s²),
  throttled to ~10 Hz. Hidden on mobile (`hidden md:block`).
- **Análisis del Sistema** panel: appears ONLY after the flight auto-completes (drone
  crosses `MAX_ALTITUDE` ~Y>40 and auto-resets to [0,0,0]). Sections are FUERZA / MASA /
  CINEMÁTICA. Close with the **✕** button — clicking the backdrop does NOT close it
  (only ✕ or a new Ignición does).
- Zoom **+/-** buttons and **Conoce la Teoría ↓** scroll button.

## Physics assertions to verify (the thing that proves it works)

During a burn, acceleration must equal **F / m**:
- Defaults 120 N / 8 kg → **15.00 m/s²**.
- Drone mass 40 kg (same 120 N) → **3.00 m/s²**. This is the adversarial check: if mass
  weren't wired to the RigidBody, accel would stay ~15.
- After the burn ends, acceleration returns to **0.00** (no spike) and velocity **holds
  steady** (1st law, zero gravity, no damping). Reiniciar zeroes both.
- The Análisis panel values must match the telemetry readings.

During a burn you should also see: green arrow up (fuerza aplicada / thrust), red arrow
down (gases expulsados), and yellow particles ejecting downward from the nozzle.

## 3D drone model (GLB)

The drone is a real GLB model, **not** a primitive fallback (the old box/dome/cone
fallback was removed). Loaded in `DroneModel.tsx` via drei `useGLTF` + `<Clone>` with
`useGLTF.preload(...)`:

- Model file: `public/models/scene-transformed.glb` (~875 KB, gltfjsx `--transform` of the
  original 28 MB asset).
- Orientation: `rotation={[Math.PI, Math.PI, 0]}` lays the quadcopter flat AND faces the
  gimbal/camera lens toward the viewer. `scale={0.6}`.
- **Lifecycle gotcha:** the RigidBody has `key={params.droneMass}`, so changing drone mass
  remounts the whole body (and `DroneModel`). Because the model uses the cached `useGLTF`
  + `<Clone>` and the `<Suspense fallback={null}>` boundary lives high up in `Scene.tsx`
  (above `<Physics>`), the GLB stays put on remount — it must NOT flash/disappear. If you
  see a flicker on slider changes, the cache/Suspense wiring is broken.
- A drei `<Loader>` (cyan `#22d3ee` bar) renders as a sibling of `<Canvas>` and shows a
  progress bar on a cold load while the GLB downloads/parses. On a warm cache it's too
  fast to see — test it in a fresh/incognito tab against the deploy preview.

## Physics collider

`Drone.tsx` uses `colliders={false}` + an explicit `<CuboidCollider args={[0.8,0.35,0.8]}
mass={params.droneMass} />`. This is intentional: a lightweight cuboid (not trimesh) that
also carries the live mass for `a = F/m`. Don't switch to `colliders="cuboid"` — that would
auto-derive the box from the mesh but drop the explicit mass control.

## Camera tracking (ground-based tilt)

The camera position is **FIXED** near the ground at `[0, 2, 15]`. In `CameraRig.tsx`'s
`useFrame`, only the `OrbitControls` **target** is lerped toward `(0, droneY, 0)` so the
view tilts up to watch the launch, then lerps back to `[0,0,0]` on auto-reset. `maxDistance`
is 80 so OrbitControls doesn't yank the camera as the target rises. To test: click Ignición,
confirm the view tilts up and keeps the drone framed through the ascent, then returns to
center after auto-reset. (Do NOT expect `camera.position.y` to move — that's the old
approach.)

## Mobile / responsive testing (IMPORTANT)

Prefer resizing the **real Chrome window** over DevTools device emulation — docked DevTools
device-mode can still render desktop-only panels and give false negatives.

```bash
sudo apt-get install -y wmctrl                                  # once
wmctrl -r :ACTIVE: -b remove,maximized_vert,maximized_horz
wmctrl -r :ACTIVE: -e 0,60,10,420,800   # x=60,y=10,w=420,h=800 (use a tall window)
# restore desktop afterwards:
wmctrl -r :ACTIVE: -b add,maximized_vert,maximized_horz
```
Reload the page after resizing so layout/state reset cleanly.

Check for overflow via browser_console:
```js
document.documentElement.scrollWidth <= window.innerWidth   // no horizontal overflow
```

Mobile expectations (breakpoint `md`):
- **Control panel = bottom sheet**: `fixed inset-x-0 bottom-0 z-20 w-full rounded-t-2xl
  max-h-[75dvh]`, compact (`text-xs`, `p-4`), short slider labels (Propelente / Fuerza /
  Masa dron), full-width **Ignición**.
- **Telemetría hidden** (absent from DOM) and the color legend hidden.
- **Análisis del Sistema = centered modal**: `fixed left-1/2 top-1/2 z-50 w-[90vw]
  max-w-md -translate-x-1/2 -translate-y-1/2` with a heavy `backdrop-blur` overlay
  (`fixed inset-0 z-40 md:hidden`). Clicking the backdrop must NOT close it; only ✕ does.
- **Zoom +/-** buttons top-right (`right-4 top-4 z-30`); **Conoce la Teoría** top-center.
- Desktop (`md:`) must keep the original floating side panels (regression check). On
  desktop the Análisis panel is `z-50`, strictly above the zoom buttons (`z-30`).

Caveat: a very short test window (viewport height < ~700px) can make the centered modal
visually crowd the bottom sheet; that's an artifact of the short window, not a real bug —
a real phone (height ≥ 800px) has room. Judge horizontal centering/overflow separately.

## Recording

Maximize the window before recording desktop tests
(`wmctrl -r :ACTIVE: -b add,maximized_vert,maximized_horz`). Annotate the physics
(a=F/m), camera-tilt, GLB-persists-on-slider, mobile-layout, and desktop-regression checks.

## Devin Secrets Needed

None — frontend only, no auth or external services.
