---
name: testing-super-rocket
description: Test the Super Rocket arcade game (Next.js + R3F + Rapier) end-to-end. Use when verifying gameplay mechanics, HUD, mobile controls, physics collisions, or visual effects.
---

# Testing Super Rocket Arcade Game

Arcade space game: pilot a rocket through asteroid fields, shoot enemies, collect power-ups,
and reach a destination planet before energy runs out.
Stack: Next.js 16 (App Router) + React 19, @react-three/fiber + drei, @react-three/rapier (WASM),
Tailwind CSS, Zustand-style state. UI text is in Spanish. Single-page app.

## Run it

```bash
cd /home/ubuntu/repos/RocketGame
npm install
npm run dev        # serves http://localhost:3000
```

Verify it's up: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000` -> `200`.

Static checks:
```bash
npm run lint
npm run build
```

CI: deployed on **Netlify**. PRs get deploy preview checks. No GitHub Actions test workflow,
so local lint + build are the real gate.

## Key UI elements (Spanish)

- **Start Screen**: "SUPER ROCKET" title, "INICIAR MISION" button inside targeting reticle
- **HUD** (in-game): Energy bar (top-left), Distance to Planet (top-right), Weapon Heat bar,
  Proximity Alert ("PROXIMITY ALERT - EVADE" flashes red when asteroid is close),
  Thruster indicators (L/R chevrons light up on A/D input)
- **Game Over**: "FIN DEL JUEGO" with distance traveled, "REINICIAR" button
- **Victory**: "VICTORIA" with hyperspace warp effect
- **Telemetry fluff**: Fake data in corners (SYS.ALIGNMENT, NAV.FREQ, etc.) for sci-fi atmosphere

## Game controls

- **Desktop**: WASD or Arrow keys for movement (full 2D: up/down/left/right), Spacebar to fire
- **Mobile**: Virtual joystick (bottom-left, `md:hidden`) for movement
- Movement is clamped: Y between -0.5 and 5.0 (world units)

## Core mechanics to test

1. **2D Movement**: W/S move vertically, A/D move horizontally, boundary clamping at Y limits
2. **Combat**: Spacebar fires cyan projectiles, weapon heat bar fills up, destroying asteroids grants score + distance bonus
3. **Power-Ups**: Green energy capsules (restore 20% energy), Blue shield spheres (absorb one hit)
4. **UFO Boss**: Drops red space mines, occasionally sweeps laser across track
5. **Collisions**: Hitting an asteroid triggers explosion effect then Game Over (with delay for explosion animation)
6. **Dynamic Ship Tilt**: Roll on lateral movement, pitch on vertical, smooth lerp back to neutral

## Testing strategies

### Crash fix testing (Rapier WASM)
The game has had recurring `RuntimeError: unreachable` crashes from Rapier WASM. To test stability:

```javascript
// Paste in browser console to automate 55s of gameplay
let tick = 0;
const keys = ['a','d','w','s','a','d','w','d','a','s'];
const startTime = Date.now();
window._testInterval = setInterval(() => {
  const elapsed = Math.round((Date.now() - startTime) / 1000);
  const btn = document.querySelector('button');
  if (btn && (btn.textContent.includes('Reiniciar') || btn.textContent.includes('Iniciar'))) {
    btn.click();
    console.log(`[TEST] Restarted at ${elapsed}s`);
    return;
  }
  const key = keys[tick % keys.length];
  document.dispatchEvent(new KeyboardEvent('keydown', { key, code: 'Key' + key.toUpperCase(), bubbles: true }));
  setTimeout(() => document.dispatchEvent(new KeyboardEvent('keyup', { key, code: 'Key' + key.toUpperCase(), bubbles: true })), 150);
  if (tick % 3 === 0) {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', code: 'Space', bubbles: true }));
    setTimeout(() => document.dispatchEvent(new KeyboardEvent('keyup', { key: ' ', code: 'Space', bubbles: true })), 50);
  }
  tick++;
  if (tick % 30 === 0) console.log(`[TEST] Playing... ${elapsed}s`);
  if (elapsed >= 55) { clearInterval(window._testInterval); console.log(`[TEST] COMPLETE: no crash`); }
}, 200);
```

### Known issue: WASM crash on viewport resize + restart
The Rapier WASM crash might still occur when restarting the game after switching between mobile and desktop viewports via DevTools. This is an edge case. For mobile testing, reload the page fresh in mobile viewport rather than switching mid-game.

### Mobile testing
Prefer resizing the real Chrome window over DevTools device emulation when possible:
```bash
sudo apt-get install -y wmctrl
wmctrl -r :ACTIVE: -b remove,maximized_vert,maximized_horz
wmctrl -r :ACTIVE: -e 0,60,10,420,800   # mobile-like viewport
# restore:
wmctrl -r :ACTIVE: -b add,maximized_vert,maximized_horz
```
If using DevTools device mode, always reload the page after toggling — don't restart the game mid-switch.

Mobile expectations:
- Virtual joystick visible in bottom-left (`md:hidden`)
- No old mobile buttons (arrow buttons were replaced by joystick)
- HUD adapts to narrower viewport

### Game difficulty note
The game is quite challenging — expect frequent deaths during manual testing. For sustained gameplay testing (e.g., crash stability), use the automated console script above rather than trying to survive manually.

## Key files

- `src/components/Drone.tsx` — Ship physics, movement, tilt, collisions
- `src/components/Obstacles.tsx` — Asteroid spawning (lane-based), movement, despawn
- `src/components/Scene.tsx` — R3F scene setup, fog, stars, camera
- `src/components/ui/GameHUD.tsx` — All HUD overlays (start, playing, game over, victory)
- `src/components/ui/VirtualJoystick.tsx` — Mobile touch joystick
- `src/lib/useGameStore.ts` — Game state (React hooks, not Zustand — can't access from console)
- `src/lib/useKeyboard.ts` — Keyboard + touch input
- `src/lib/types.ts` — Game constants (Y limits, impulse values, world speed)

## Recording

Maximize the window before recording:
```bash
wmctrl -r :ACTIVE: -b add,maximized_vert,maximized_horz
```
Annotate: start screen scaling, gameplay mechanics, ship tilt, asteroid spawning patterns,
mobile joystick visibility, and any crashes.

## Devin Secrets Needed

None — frontend only, no auth or external services.
