"use client";

import { Canvas } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import { Physics } from "@react-three/rapier";
import * as THREE from "three";
import Drone from "./Drone";
import NeonGrid from "./NeonGrid";
import Obstacles from "./Obstacles";
import Projectiles from "./Projectiles";
import PowerUps from "./PowerUps";
import DestructionEffect, { type DestructionEffectHandle } from "./DestructionEffect";
import AlienShip from "./AlienShip";
import ExplosionEffect from "./ExplosionEffect";
import HyperspaceEffect from "./HyperspaceEffect";
import ScreenShake from "./ScreenShake";
import SpeedLines from "./SpeedLines";
import { DEFAULT_FOV } from "@/lib/physics";
import type { KeyMap } from "@/lib/useKeyboard";
import type { MutableRefObject, RefObject } from "react";
import type { GameState } from "@/lib/types";
import { WORLD_SPEED, ASTEROID_DESTROY_BONUS, ENERGY_CAPSULE_RESTORE } from "@/lib/types";
import { useFrame } from "@react-three/fiber";
import { useCallback, useEffect, useRef } from "react";

interface SceneProps {
  gameState: GameState;
  keysRef: RefObject<KeyMap>;
  onCollision: () => void;
  onTick: (dt: number, distanceDelta: number) => void;
  proximityRef: MutableRefObject<boolean>;
  hasShield: boolean;
  onShieldBreak: () => void;
  onAddDistanceBonus: (amount: number) => void;
  onAddScore: (pts: number) => void;
  onAddEnergy: (amount: number) => void;
  onCollectShield: () => void;
  weaponHeatRef: MutableRefObject<number>;
}

function ShieldMerger({
  shieldDestroyRef,
  destroyedIdsRef,
}: {
  shieldDestroyRef: MutableRefObject<Set<number>>;
  destroyedIdsRef: MutableRefObject<Set<number>>;
}) {
  useFrame(() => {
    if (shieldDestroyRef.current.size > 0) {
      for (const id of shieldDestroyRef.current) {
        destroyedIdsRef.current.add(id);
      }
      shieldDestroyRef.current.clear();
    }
  });
  return null;
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
  hasShield,
  onShieldBreak,
  onAddDistanceBonus,
  onAddScore,
  onAddEnergy,
  onCollectShield,
  weaponHeatRef,
}: SceneProps) {
  const playing = gameState === "PLAYING";
  const playerPosRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const destroyedIdsRef = useRef<Set<number>>(new Set());
  const shieldDestroyRef = useRef<Set<number>>(new Set());
  const collectedIdsRef = useRef<Set<number>>(new Set());
  const obstacleDataRef = useRef<{ id: number; x: number; y: number; z: number; scale: number }[]>([]);
  const destructionRef = useRef<DestructionEffectHandle | null>(null);

  // Merge shield-destroyed asteroids into the destroyed set each frame
  useEffect(() => {
    if (!playing) {
      destroyedIdsRef.current.clear();
      shieldDestroyRef.current.clear();
      collectedIdsRef.current.clear();
      obstacleDataRef.current = [];
    }
  }, [playing]);

  const handleHitAsteroid = useCallback((asteroidId: number, position: THREE.Vector3) => {
    destroyedIdsRef.current.add(asteroidId);
    onAddDistanceBonus(ASTEROID_DESTROY_BONUS);
    onAddScore(100);
    if (destructionRef.current) {
      destructionRef.current.spawn(position);
    }
  }, [onAddDistanceBonus, onAddScore]);

  const handleCollectEnergy = useCallback(() => {
    onAddEnergy(ENERGY_CAPSULE_RESTORE);
  }, [onAddEnergy]);

  return (
    <Canvas
      camera={{ position: [0, 4, 10], fov: DEFAULT_FOV, near: 0.1, far: 200 }}
      dpr={[1, 1.5]}
      shadows={false}
      gl={{ antialias: false, powerPreference: "high-performance" }}
      className="!fixed inset-0"
    >
      <color attach="background" args={["#050510"]} />
      <fog attach="fog" args={["#050510", 50, 150]} />

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

        <Stars radius={120} depth={80} count={4000} factor={5} fade speed={0.4} />
        <NeonGrid active={playing} />

        <Physics gravity={[0, 0, 0]} interpolate>
          <Drone
            playing={playing}
            keysRef={keysRef}
            onCollision={onCollision}
            onShieldBreak={onShieldBreak}
            hasShield={hasShield}
            playerPosRef={playerPosRef}
            shieldDestroyRef={shieldDestroyRef}
          />
          <Obstacles
            active={playing}
            proximityRef={proximityRef}
            destroyedIdsRef={destroyedIdsRef}
            obstacleDataRef={obstacleDataRef}
          />
        </Physics>

        <Projectiles
          active={playing}
          keysRef={keysRef}
          playerPosRef={playerPosRef}
          weaponHeatRef={weaponHeatRef}
          onHitAsteroid={handleHitAsteroid}
          obstacleDataRef={obstacleDataRef}
        />

        <PowerUps
          active={playing}
          playerPosRef={playerPosRef}
          collectedIdsRef={collectedIdsRef}
          onCollectEnergy={handleCollectEnergy}
          onCollectShield={onCollectShield}
        />

        <DestructionEffect handleRef={destructionRef} />

        <AlienShip
          active={playing}
          onHitPlayer={onCollision}
          playerPosRef={playerPosRef}
        />

        <SpeedLines active={playing} />

        <ExplosionEffect active={gameState === "GAME_OVER"} />
        <HyperspaceEffect active={gameState === "VICTORY"} />
      </ScreenShake>

      <ShieldMerger shieldDestroyRef={shieldDestroyRef} destroyedIdsRef={destroyedIdsRef} />
      <GameLoop playing={playing} onTick={onTick} />
    </Canvas>
  );
}
