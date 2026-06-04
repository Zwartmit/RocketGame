# Segunda Ley de Newton — Simulador 3D

Simulación interactiva de física 3D que demuestra la **Segunda Ley de Newton**
(Ley de la Dinámica, `a = F / m`) con un dron en un entorno de **gravedad cero**.

Al pulsar **Ignición**, el propulsor del dron aplica una fuerza neta constante
durante un tiempo proporcional a la masa de propelente. Por la Segunda Ley de
Newton, esa fuerza genera una aceleración inversamente proporcional a la masa del
dron (`a = F / m`). Vectores de fuerza y un sistema de partículas visualizan el
efecto, mientras un panel de telemetría muestra velocidad y aceleración en tiempo
real y un panel de "Análisis del Sistema" resume el resultado al concluir el vuelo.

Demo: <https://leynewton.devmit-tech.com>

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** para la interfaz
- **@react-three/fiber** + **@react-three/drei** para la escena 3D (sobre **three**)
- **@react-three/rapier** como motor de física (Rapier/WASM, gravedad `[0, 0, 0]`)
- **GSAP** + **@studio-freight/react-lenis** para animaciones y scroll suave
- Deploy en **Netlify** (deploy preview por cada PR a `main`)

## Arquitectura

```
src/
├─ app/
│  ├─ layout.tsx          Metadatos SEO/OG/Twitter, favicon (retrato de Newton), manifest
│  └─ page.tsx            Punto de entrada (renderiza SimulationApp)
├─ components/
│  ├─ SimulationApp.tsx   Cliente: estado, Lenis, GSAP y overlays de UI
│  ├─ Scene.tsx           Canvas (perf), luces, Stars/Grid, OrbitControls y mundo físico
│  ├─ CameraRig.tsx       Cámara fija desde el suelo; el target sigue la altura del dron
│  ├─ Drone.tsx           RigidBody + CuboidCollider, lógica de impulso y telemetría
│  ├─ DroneModel.tsx      Modelo GLB con useGLTF + <Clone> + preload + gl.compile()
│  ├─ DroneLoader.tsx     Spinner de carga (<Html center> + Tailwind) como fallback de Suspense
│  ├─ ThrustArrows.tsx    Vectores 3D: fuerza aplicada (verde) y gases expulsados (rojo)
│  ├─ ExhaustParticles.tsx Emisor de partículas de gas (InstancedMesh)
│  └─ ui/
│     ├─ ControlPanel.tsx     Sliders, botón de ignición y reinicio (bottom sheet en móvil)
│     ├─ TelemetryPanel.tsx   Velocidad y aceleración en tiempo real (solo escritorio)
│     ├─ AnalysisPanel.tsx    Modal "Análisis del Sistema" (centrado en móvil)
│     └─ CanvasControls.tsx   Zoom +/- (FOV) y acceso a la teoría
└─ lib/
   ├─ physics.ts          Constantes de simulación (sin "números mágicos")
   └─ types.ts            Tipos compartidos y DEFAULT_PARAMS
```

## Física (Segunda Ley de Newton)

- El mundo de Rapier usa gravedad `[0, 0, 0]` e `interpolate` para suavizar el movimiento.
- Durante el encendido se aplica un impulso `J = F · dt` al `RigidBody` en la
  dirección de empuje (eje +Y), donde `F` es la **fuerza de eyección**. El encendido
  se integra **por frame** (`∫F·dt`), de modo que el impulso total no depende de la
  tasa de frames (`dt` se limita a `0.05 s` por estabilidad).
- La **masa del propelente** define la duración del encendido
  (`t = masaPropelente · 0.45 s/kg`).
- La **masa del dron** es la masa del `CuboidCollider`, por lo que la aceleración
  resultante emerge de la física real: `a = F / m`.
- Sin gravedad ni rozamiento, tras el encendido el dron conserva su velocidad
  (Primera Ley de Newton). Al superar la altitud máxima (`Y = 40`) el vuelo concluye,
  el dron se reinicia solo y se revela el panel "Análisis del Sistema". **Reiniciar**
  lo devuelve al centro en cualquier momento.

Con los valores por defecto (`F = 120 N`, `m = 8 kg`): `a = 120 / 8 = 15,00 m/s²`.

## Procedimiento de interacción con la interfaz

La aplicación es una sola pantalla con la escena 3D de fondo y paneles superpuestos.

### Panel de control (`ControlPanel`)
Arriba a la izquierda en escritorio; **bottom sheet** deslizable en móvil. Contiene:

1. **Masa del propelente** (slider, 0.5–8 kg, paso 0.5) — a más propelente, más dura
   el encendido.
2. **Fuerza de eyección** (slider, 5–120 N, paso 1) — magnitud de la fuerza neta.
3. **Masa del dron** (slider, 4–40 kg, paso 1) — define la masa del cuerpo rígido;
   reinstancia la nave al cambiarla. Queda **deshabilitado** mientras hay encendido activo.
4. **🔥 Ignición** — inicia el encendido. Mientras dura, el botón muestra "Encendido…"
   y queda deshabilitado (no se puede relanzar a mitad del empuje).
5. **Reiniciar** — devuelve el dron al origen y pone la telemetría a cero.

### Telemetría (`TelemetryPanel`) — solo escritorio
Arriba a la derecha. Muestra en tiempo real (~10 Hz):
- **Velocidad** (m/s, cian).
- **Aceleración** (m/s², violeta).

### Controles del lienzo (`CanvasControls`)
- Botones **+ / −**: acercan/alejan ajustando el **FOV** de la cámara (la rueda del
  ratón queda libre para el scroll de la página). En móvil arriba a la derecha; en
  escritorio, centrados al borde derecho.
- **Conoce la Teoría ↓**: hace scroll suave (Lenis) a la sección teórica inferior.
- **Arrastrar** sobre el lienzo orbita la cámara (`OrbitControls`, sin pan ni zoom de rueda).

### Modal "Análisis del Sistema" (`AnalysisPanel`)
Aparece automáticamente **al concluir el vuelo** (auto-reinicio). Desglosa, inyectando
las variables actuales:
- **Fuerza**: la fuerza neta constante aplicada (N).
- **Masa**: la masa estructural del dron (kg).
- **Cinemática**: la aceleración resultante (m/s²), con la fórmula `a = F / m`.

Indica el estado **Activo / En espera** y solo se cierra con la **✕** o disparando un
nuevo encendido (cambiar parámetros no lo cierra). En móvil se muestra centrado con el
fondo desenfocado.

### Leyenda y sección teórica
- **Leyenda** (escritorio): verde = *Fuerza aplicada (F)*, rojo = *Gases expulsados*.
- **Sección teórica**: al hacer scroll (o pulsar "Conoce la Teoría") se revela una
  explicación de la Segunda Ley con tres tarjetas (Fuerza y Masa · Aceleración a = F/m ·
  Gravedad Cero).

## Modelo 3D del dron

El dron se carga desde `public/models/scene-transformed.glb` (≈ 875 KB, optimizado con
`gltfjsx --transform`) mediante `useGLTF` (caché de drei), renderizado con `<Clone>` y
precargado con `useGLTF.preload`. Gracias a la caché, cuando el `RigidBody` se remonta
al cambiar la masa el modelo se sirve al instante (no hay fallback a primitivas).

El `<Suspense>` envuelve **solo** el modelo (en `Drone.tsx`), de modo que la UI, las
estrellas, el grid y los controles aparecen al instante; mientras se descarga/parsea el
GLB se muestra un spinner (`DroneLoader`). Además se llama a `gl.compile(scene, camera)`
en un `useLayoutEffect` para precompilar los shaders y evitar el tirón al montar el dron.

## Rendimiento WebGL

El `<Canvas>` está configurado para móviles de gama media (objetivo 60 FPS):

- `dpr={[1, 1.2]}` — cap estricto del device pixel ratio.
- `gl={{ antialias: false, powerPreference: "high-performance" }}`.
- `shadows={false}` en el Canvas y `castShadow={false}` en las luces (sin mapas de sombra).
- Sin post-processing.

## Desarrollo

```bash
npm install        # usa legacy-peer-deps (ver .npmrc)
npm run dev        # http://localhost:3000
npm run lint       # ESLint
npx tsc --noEmit   # comprobación de tipos
npm run build      # build de producción
```

> El proyecto incluye un `.npmrc` con `legacy-peer-deps=true` porque
> `@studio-freight/react-lenis` declara peers de React ≤ 18 (está deprecado),
> mientras que el proyecto usa React 19.

## Testing

`.agents/skills/testing-newton-sim/SKILL.md` documenta cómo probar el simulador
end-to-end (física, telemetría, cámara, modelo GLB y UI responsive). No requiere secretos.
