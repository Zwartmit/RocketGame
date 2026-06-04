"use client";

import { useFrame } from "@react-three/fiber";
import type { OrbitControls } from "@react-three/drei";
import type { ComponentRef, RefObject } from "react";
import type { PerspectiveCamera } from "three";

type OrbitControlsRef = ComponentRef<typeof OrbitControls>;

interface CameraRigProps {
  /** Campo de visión objetivo (grados) controlado por los botones de zoom. */
  fov: number;
  /** Altura (Y) actual del cohete para el seguimiento dinámico. */
  droneYRef: RefObject<number>;
  controlsRef: RefObject<OrbitControlsRef | null>;
}

/**
 * Ajusta la cámara fuera del ciclo de React. La cámara permanece FIJA cerca del
 * suelo; en lugar de trasladarla, se interpola el punto de mira (`target`) de los
 * OrbitControls hacia la altura del cohete, de modo que la cámara se inclina hacia
 * arriba para seguir el despegue (como un lanzamiento real) y regresa al centro
 * cuando el cohete se reinicia. También suaviza el zoom (FOV).
 */
export default function CameraRig({
  fov,
  droneYRef,
  controlsRef,
}: CameraRigProps) {
  useFrame((state, delta) => {
    // Suavizado independiente del framerate.
    const k = 1 - Math.pow(0.0015, delta);

    const camera = state.camera as PerspectiveCamera;

    if (Math.abs(camera.fov - fov) > 0.01) {
      camera.fov += (fov - camera.fov) * k;
      camera.updateProjectionMatrix();
    }

    const droneY = droneYRef.current;

    const controls = controlsRef.current;
    if (controls) {
      // La cámara no se mueve: solo el punto de mira sube con el cohete (0, Y, 0)
      // y vuelve a (0, 0, 0) al reiniciarse, inclinando la vista hacia arriba.
      controls.target.x += (0 - controls.target.x) * k;
      controls.target.y += (droneY - controls.target.y) * k;
      controls.target.z += (0 - controls.target.z) * k;
      controls.update();
    }
  });

  return null;
}
