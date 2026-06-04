"use client";

import { useLayoutEffect } from "react";
import { Clone, useGLTF } from "@react-three/drei";
import { useThree } from "@react-three/fiber";

const MODEL_URL = "/models/scene-transformed.glb";

// El cohete viene con la geometría desplazada del origen y, además, su eje
// está ligeramente inclinado (~1°), por lo que centrar por la caja envolvente
// dejaba el morro fuera del eje x=0,z=0 donde se dibujan las flechas de empuje.
// Valores medidos sobre la malla (centroide de cortes superior/inferior):
//  - AXIS_MID: punto medio del eje real del cohete.
//  - AXIS_TILT_FIX: rotación correctora que endereza el eje a la vertical.
//  - BOTTOM_OFFSET: y del extremo inferior respecto a AXIS_MID (escala nativa).
const MODEL_SCALE = 0.12;
const NOZZLE_Y = -0.95;
const AXIS_MID: [number, number, number] = [1.0976, -153.3574, -392.4346];
const AXIS_TILT_FIX: [number, number, number] = [-0.0127, 0, -0.0172];
const BOTTOM_OFFSET = -13.3952;
// Apoyamos la base del cohete justo en el nozzle de empuje (y = −0.95).
const GROUP_Y = NOZZLE_Y - BOTTOM_OFFSET * MODEL_SCALE;

/**
 * Carga el modelo GLB del cohete mediante `useGLTF` (caché de drei).
 *
 * El cohete ya está orientado vertical (alto en Y, morro hacia +Y), que coincide
 * con el eje de empuje. Lo recentramos con el `position` del `<Clone>` y aplicamos
 * escala/posición vertical en el grupo contenedor. Usamos `<Clone>` en lugar de
 * `<primitive>` para que cada montaje renderice su propia copia del grafo: así,
 * cuando el `RigidBody` se remonta al cambiar la masa, el modelo se sirve al
 * instante desde la caché y no se muta un objeto compartido.
 */
export default function DroneModel() {
  const { scene } = useGLTF(MODEL_URL);
  const gl = useThree((s) => s.gl);
  const rootScene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);

  // Precompilamos los shaders del modelo ya montado para evitar el tirón
  // (compilación en GPU) justo cuando el cohete aparece tras el Suspense.
  useLayoutEffect(() => {
    gl.compile(rootScene, camera);
  }, [gl, rootScene, camera, scene]);

  return (
    <group position={[0, GROUP_Y, 0]} scale={MODEL_SCALE}>
      <group rotation={AXIS_TILT_FIX}>
        <Clone
          object={scene}
          position={[-AXIS_MID[0], -AXIS_MID[1], -AXIS_MID[2]]}
        />
      </group>
    </group>
  );
}

useGLTF.preload(MODEL_URL);
