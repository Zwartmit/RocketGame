"use client";

import { Canvas } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import { Physics } from "@react-three/rapier";
import * as THREE from "three";
import Drone from "./Drone";
import NeonGrid from "./NeonGrid";
import Obstacles from "./Obstacles";
import AlienShip from "./AlienShip";
import ExplosionEffect from "./ExplosionEffect";
import HyperspaceEffect from "./HyperspaceEffect";
import ScreenShake from "./ScreenShake";
import SpeedLines from "./SpeedLines";
import { DEFAULT_FOV } from "@/lib/physics";
import type { KeyMap } from "@/lib/useKeyboard";
import type { MutableRefObject, RefObject } from "react";
import type { GameState } from "@/lib/types";
import { WORLD_SPEED } from "@/lib/types";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";

interface SceneProps {
  gameState: GameState;
  keysRef: RefObject<KeyMap>;
  onCollision: () => void;
  onTick: (dt: number, distanceDelta: number) => void;
  proximityRef: MutableRefObject<boolean>;
}

function GameLoop({
  playing,
  onTick,
}: {
  playing: boolean;
  onTick: (dt: number, distanceDelta: number) => void;
}) {
  const onTickRef = useRef(onTick);

  useEffect(() => {
    onTickRef.current = onTick;
  }, [onTick]);

  useFrame((_, delta) => {
    if (!playing) return;
    const dt = Math.min(delta, 0.05);
    onTickRef.current(dt, WORLD_SPEED * dt);
  });

  return null;
}

export default function Scene({
  gameState,
  keysRef,
  onCollision,
  onTick,
  proximityRef,
}: SceneProps) {
  const playing = gameState === "PLAYING";
  const playerPosRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));

  return (
    <Canvas
      camera={{ position: [0, 4, 10], fov: DEFAULT_FOV, near: 0.1, far: 200 }}
      dpr={[1, 1.5]}
      shadows={false}
      gl={{ antialias: false, powerPreference: "high-performance" }}
      className="!fixed inset-0"
    >
      <color attach="background" args={["#05060a"]} />
      <fog attach="fog" args={["#05060a", 30, 90]} />

      <ScreenShake active={gameState === "GAME_OVER"}>
        <ambientLight intensity={0.3} />
        <directionalLight
          position={[5, 10, 5]}
          intensity={1.8}
          castShadow={false}
        />
        <directionalLight
          position={[-8, -4, -6]}
          intensity={0.5}
          color="#d946ef"
          castShadow={false}
        />
        <pointLight position={[0, 2, -20]} intensity={40} color="#06b6d4" distance={60} />

        <Stars radius={100} depth={50} count={2000} factor={4} fade speed={0.3} />
        <NeonGrid active={playing} />

        <Physics gravity={[0, 0, 0]} interpolate>
          <Drone
            playing={playing}
            keysRef={keysRef}
            onCollision={onCollision}
            playerPosRef={playerPosRef}
          />
          <Obstacles active={playing} proximityRef={proximityRef} />
        </Physics>

        <AlienShip
          active={playing}
          onHitPlayer={onCollision}
          playerPosRef={playerPosRef}
        />

        <SpeedLines active={playing} />

        <ExplosionEffect active={gameState === "GAME_OVER"} />
        <HyperspaceEffect active={gameState === "VICTORY"} />
      </ScreenShake>

      <GameLoop playing={playing} onTick={onTick} />
    </Canvas>
  );
}
