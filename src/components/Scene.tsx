"use client";

import { useRef } from "react";
import type { ComponentRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars, Grid } from "@react-three/drei";
import { Physics } from "@react-three/rapier";
import Drone from "./Drone";
import CameraRig from "./CameraRig";
import { DEFAULT_FOV } from "@/lib/physics";
import type { SimParams, Telemetry } from "@/lib/types";

interface SceneProps {
  params: SimParams;
  ignitionId: number;
  resetId: number;
  fov: number;
  onTelemetry: (t: Telemetry) => void;
  onThrustingChange: (thrusting: boolean) => void;
  onFlightComplete: () => void;
}

export default function Scene({
  params,
  ignitionId,
  resetId,
  fov,
  onTelemetry,
  onThrustingChange,
  onFlightComplete,
}: SceneProps) {
  const controlsRef = useRef<ComponentRef<typeof OrbitControls>>(null);
  const droneYRef = useRef(0);

  return (
    <Canvas
      camera={{ position: [0, 2, 15], fov: DEFAULT_FOV }}
      // Cap estricto del DPR a 1.2x: renderizar a 2x/3x en móviles de alta
      // densidad colapsa la GPU sin ganancia visual real. Sin sombras.
      dpr={[1, 1.2]}
      shadows={false}
      // antialias apagado (innecesario en pantallas densas) + alto rendimiento.
      gl={{ antialias: false, powerPreference: "high-performance" }}
      className="!fixed inset-0"
    >
      <color attach="background" args={["#05060a"]} />
      <fog attach="fog" args={["#05060a", 18, 45]} />

      {/* Iluminación (sin sombras: entorno espacial oscuro, no calculamos mapas). */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[6, 10, 6]} intensity={2.2} castShadow={false} />
      <directionalLight
        position={[-8, -4, -6]}
        intensity={0.5}
        color="#60a5fa"
        castShadow={false}
      />

      {/* Ambiente espacial (vacío) */}
      <Stars radius={80} depth={40} count={1500} factor={4} fade speed={0.5} />
      <Grid
        position={[0, -3.5, 0]}
        args={[40, 40]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#1e293b"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#334155"
        fadeDistance={40}
        infiniteGrid
      />

      {/* Mundo físico en gravedad cero (interpolado para suavizar el movimiento).
         No hay Suspense aquí: el límite vive dentro de `Drone`, envolviendo solo
         el GLB, para que la escena (estrellas, grid, controles) renderice al
         instante y solo el cohete muestre el spinner mientras carga. */}
      <Physics gravity={[0, 0, 0]} interpolate>
        <Drone
          params={params}
          ignitionId={ignitionId}
          resetId={resetId}
          onTelemetry={onTelemetry}
          onThrustingChange={onThrustingChange}
          onFlightComplete={onFlightComplete}
          droneYRef={droneYRef}
        />
      </Physics>

      <CameraRig fov={fov} droneYRef={droneYRef} controlsRef={controlsRef} />

      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        enableZoom={false}
        minDistance={4}
        // Holgado: con la cámara fija cerca del suelo y el punto de mira subiendo
        // hasta Y=40, la distancia cámara→objetivo llega a ~41. Un máximo amplio
        // evita que update() reposicione la cámara para respetar el límite.
        maxDistance={80}
        makeDefault
      />
    </Canvas>
  );
}
