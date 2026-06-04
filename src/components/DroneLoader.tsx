"use client";

import { Html } from "@react-three/drei";

/**
 * Fallback de Suspense que se muestra SOLO mientras se descarga/parsea el GLB
 * del cohete. Se renderiza con `<Html center>` (portal DOM de drei) en el centro
 * de la escena, así el resto del canvas (estrellas, grid, controles) ya está
 * visible detrás. Spinner cyberpunk con Tailwind.
 */
export default function DroneLoader() {
  return (
    <Html center>
      <div className="pointer-events-none flex select-none flex-col items-center gap-3">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-700 border-t-cyan-400" />
        <p className="whitespace-nowrap text-sm font-medium tracking-wide text-cyan-300 [text-shadow:0_0_8px_#22d3ee]">
          Cargando modelo 3D...
        </p>
      </div>
    </Html>
  );
}
