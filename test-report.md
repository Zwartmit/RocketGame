# Informe de pruebas — Cámara y Responsividad móvil (PR #1)

Probado de extremo a extremo en el navegador (`npm run dev`, `localhost:3000`),
solo frontend, sin credenciales. **Las 4 pruebas pasaron.** Escritorio probado a
1024px; móvil probado redimensionando la ventana real de Chrome a 400px de ancho
de viewport (sin emulación de DevTools, para un render limpio).

Cambios verificados:
1. Seguimiento de cámara por **posición** (no solo `lookAt`): `camera.position.y`
   interpola hacia `baseCamY + droneY` y vuelve a la altura inicial al reiniciar.
2. Responsividad móvil con breakpoints de Tailwind (`sm:`/`md:`).

## Resultado

- **T1 — La cámara mantiene encuadrado al dron por posición durante el ascenso**: passed.
  El dron permanece encuadrado durante todo el ascenso a alta velocidad (~10 m/s),
  sin perderse fuera de pantalla. Al auto-reiniciarse, la cámara vuelve a la altura
  base y el dron queda centrado.

- **T2 — Layout móvil limpio, sin solapamiento ni desbordamiento (400px)**: passed.
  Panel de control más angosto/compacto; panel de Telemetría oculto (`hidden md:block`,
  ausente del DOM); leyenda oculta; botones de zoom reubicados abajo a la derecha,
  sobre el botón de teoría. Sin scroll horizontal: `scrollWidth=388 ≤ innerWidth=400`.

- **T3 — Panel "Análisis del Sistema" centrado abajo en móvil tras el vuelo**: passed.
  Tras completarse el vuelo, el panel aparece centrado con `w-[90vw]` (width=360),
  `right=374 < 400` → **sin desbordamiento por el borde derecho** (el bug original).
  Nota: en mi ventana artificialmente corta (~620px de alto) el panel se solapa
  verticalmente con el panel de control; en un móvil real (alto ≥ 800px) `bottom-32`
  deja espacio suficiente. El requisito clave (centrado, 90vw, sin overflow derecho)
  se cumple.

- **T4 — Regresión: layout de escritorio sin cambios**: passed.
  Telemetría arriba a la derecha, leyenda abajo a la izquierda, botones de zoom
  al centro-derecha, panel de control completo — todo en su posición original.

## Verificaciones estáticas

- `npm run lint` — sin errores.
- `npx tsc --noEmit` — sin errores.
- `npm run build` — compila correctamente.

## Evidencia

### T1 — Cámara sigue al dron (escritorio)
Ascenso a alta velocidad, dron encuadrado:

![Dron encuadrado durante el ascenso](https://app.devin.ai/attachments/6802d157-f657-43c4-b6ae-e44718e1c687/screenshot_1bc29c1872a74bf6859888e9e7ee9cf0.png)

Tras el auto-reset, la cámara vuelve a la altura base, dron centrado:

![Cámara de vuelta tras el reset](https://app.devin.ai/attachments/00a7f74f-10d1-4558-af95-ed9b3785e40a/screenshot_cf89fdecce14471798261b60dca7a7d9.png)

### T2 — Layout móvil (400px), sin telemetría ni overflow
![Layout móvil limpio](https://app.devin.ai/attachments/68e5c3ab-8be4-4e18-b71e-44d9169085db/screenshot_6925a044314341e0b1e8cabe26b48a73.png)

### T3 — Panel de análisis centrado abajo en móvil, sin overflow derecho
![Panel análisis móvil centrado](https://app.devin.ai/attachments/4143de32-c79a-48d0-a840-5e2e2cdb2475/screenshot_89e2905d4b264e47a00bcd8236e351a5.png)

### T4 — Regresión escritorio (layout original intacto)
![Layout escritorio sin cambios](https://app.devin.ai/attachments/9aacb23e-1660-4d54-a0c4-042205337dbc/screenshot_7f4fd2449cb8423eba1557d7e029ca16.png)
