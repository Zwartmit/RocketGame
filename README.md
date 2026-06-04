# Rocket Run — Arcade Synthwave

Juego arcade 3D con estética **Synthwave/Cyberpunk** donde pilotas una nave
esquivando obstáculos de neón mientras avanzas hacia un planeta lejano.
Construido con **React Three Fiber**, **Rapier Physics** y **Tailwind CSS**.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** para la interfaz HUD
- **@react-three/fiber** + **@react-three/drei** para la escena 3D (sobre **three**)
- **@react-three/rapier** como motor de física (Rapier/WASM, gravedad cero)
- Deploy en **Netlify**

## Arquitectura

```
src/
├─ app/
│  ├─ layout.tsx            Metadatos SEO/OG/Twitter, manifest
│  └─ page.tsx              Punto de entrada (renderiza SimulationApp)
├─ components/
│  ├─ SimulationApp.tsx     Cliente: estado del juego + teclado + escena + HUD
│  ├─ Scene.tsx             Canvas 3D, luces neón, mundo físico y game loop
│  ├─ NeonGrid.tsx          Suelo infinito con shader de rejilla neón scrolleante
│  ├─ Obstacles.tsx         Spawner de obstáculos (Box con materiales emisivos)
│  ├─ Drone.tsx             RigidBody + CuboidCollider, impulso lateral y colisión
│  ├─ DroneModel.tsx        Modelo GLB con useGLTF + <Clone> + preload + gl.compile()
│  ├─ DroneLoader.tsx       Spinner de carga como fallback de Suspense
│  ├─ ExhaustParticles.tsx  Emisor de partículas de escape (InstancedMesh)
│  └─ ui/
│     └─ GameHUD.tsx        HUD retro-futurista (energía, distancia, pantallas de estado)
└─ lib/
   ├─ physics.ts            Constantes de simulación
   ├─ types.ts              Tipos compartidos y constantes del juego
   ├─ useGameStore.ts       Máquina de estados del juego (START/PLAYING/GAME_OVER/VICTORY)
   └─ useKeyboard.ts        Hook de input por teclado (A/D, flechas)
```

## Mecánicas del Juego

### Estados

El juego tiene 4 estados gestionados por `useGameStore`:

1. **START** — Pantalla de inicio con título y botón "Iniciar Juego".
2. **PLAYING** — Partida activa con HUD (energía + distancia al planeta).
3. **GAME_OVER** — Colisión con obstáculo o energía agotada.
4. **VICTORY** — Distancia objetivo alcanzada (500 m).

### Controles

- **A / Flecha izquierda** — Mover la nave a la izquierda.
- **D / Flecha derecha** — Mover la nave a la derecha.

Los inputs se traducen en impulsos físicos laterales (`applyImpulse`) sobre el
`RigidBody` de la nave. La posición se limita a ±5 unidades en el eje X.

### Energía

La energía se drena linealmente (0.02 por segundo). Si llega a 0, se activa
GAME_OVER. La barra de energía cambia de color según el nivel:
- Verde (>50%) → Amarillo (25–50%) → Rojo (<25%)

### Obstáculos

Prismas 3D con materiales emisivos (cyan, magenta, púrpura) que aparecen
a Z=-80 cada 0.9s y se mueven hacia la cámara. La colisión se detecta
mediante `onIntersectionEnter` de Rapier (sensor collider).

### Entorno 3D

- **Rejilla neón**: shader personalizado con `fract()` + `smoothstep()` que
  scrollea a `WORLD_SPEED` para simular movimiento infinito.
- **Iluminación**: luz direccional magenta + punto de luz cyan para la
  estética synthwave.

## Modelo 3D

La nave se carga desde `public/models/scene-transformed.glb` (optimizado con
`@gltf-transform/cli`: dedup, weld, simplify, meshopt compression, texturas WebP).
Se renderiza con `<Clone>` + `useGLTF` (caché de drei) y se precompilan los
shaders con `gl.compile()` para evitar tirones al montar.

## Rendimiento WebGL

El `<Canvas>` está configurado para móviles de gama media (objetivo 60 FPS):

- `dpr={[1, 1.2]}` — cap estricto del device pixel ratio.
- `gl={{ antialias: false, powerPreference: "high-performance" }}`.
- `shadows={false}` en el Canvas y `castShadow={false}` en las luces.
- Sin post-processing.

## Desarrollo

```bash
npm install        # usa legacy-peer-deps (ver .npmrc)
npm run dev        # http://localhost:3000
npm run lint       # ESLint
npx tsc --noEmit   # comprobación de tipos
npm run build      # build de producción
```

## Constantes del Juego

| Constante | Valor | Descripción |
|-----------|-------|-------------|
| `TARGET_DISTANCE` | 500 m | Distancia para ganar |
| `MAX_ENERGY` | 1.0 | Energía inicial (normalizada) |
| `ENERGY_DRAIN_PER_SEC` | 0.02 | Drenaje de energía por segundo |
| `LATERAL_IMPULSE` | 45 | Impulso lateral por frame |
| `WORLD_SPEED` | 18 | Velocidad de scroll del mundo (Z/s) |
| `OBSTACLE_INTERVAL` | 0.9 s | Frecuencia de spawn de obstáculos |
| `LANE_LIMIT` | ±5 | Límites laterales del jugador |
| `DRONE_MASS` | 8 | Masa del RigidBody de la nave |

## Testing

`.agents/skills/testing-newton-sim/SKILL.md` documenta cómo probar el juego
end-to-end (física, obstáculos, colisiones, modelo GLB y UI responsive).
