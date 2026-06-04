"use client";

import { useRef, useLayoutEffect, type RefObject, type MutableRefObject } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import type { KeyMap } from "@/lib/useKeyboard";
import {
  FIRE_RATE,
  PROJECTILE_SPEED,
  HEAT_PER_SHOT,
  OBSTACLE_SPAWN_Z,
} from "@/lib/types";

const MAX_PROJECTILES = 30;
const dummy = new THREE.Object3D();

interface ProjectilesProps {
  active: boolean;
  keysRef: RefObject<KeyMap>;
  playerPosRef: RefObject<THREE.Vector3>;
  weaponHeatRef: MutableRefObject<number>;
  onHitAsteroid: (asteroidId: number, position: THREE.Vector3) => void;
  /** Ref to current obstacle data for manual hit detection */
  obstacleDataRef: MutableRefObject<{ id: number; x: number; y: number; z: number; scale: number }[]>;
}

interface Proj {
  x: number;
  y: number;
  z: number;
  alive: boolean;
}

export default function Projectiles({
  active,
  keysRef,
  playerPosRef,
  weaponHeatRef,
  onHitAsteroid,
  obstacleDataRef,
}: ProjectilesProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const projectiles = useRef<Proj[]>([]);
  const cooldownRef = useRef(0);
  const wasActive = useRef(false);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const m = new THREE.Matrix4().makeScale(0, 0, 0);
    for (let i = 0; i < MAX_PROJECTILES; i++) mesh.setMatrixAt(i, m);
    mesh.instanceMatrix.needsUpdate = true;
  }, []);

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const dt = Math.min(delta, 0.05);

    if (!active) {
      if (wasActive.current) {
        wasActive.current = false;
        projectiles.current = [];
        cooldownRef.current = 0;
        const m = new THREE.Matrix4().makeScale(0, 0, 0);
        for (let i = 0; i < MAX_PROJECTILES; i++) mesh.setMatrixAt(i, m);
        mesh.instanceMatrix.needsUpdate = true;
      }
      return;
    }
    wasActive.current = true;

    // Cooldown
    cooldownRef.current = Math.max(0, cooldownRef.current - dt);

    // Shoot
    const heat = weaponHeatRef.current;
    if (keysRef.current.shoot && cooldownRef.current <= 0 && heat < 1) {
      cooldownRef.current = FIRE_RATE;
      const pos = playerPosRef.current;
      projectiles.current.push({
        x: pos.x,
        y: pos.y + 0.3,
        z: pos.z - 1.5,
        alive: true,
      });
      weaponHeatRef.current = Math.min(1, heat + HEAT_PER_SHOT);

      // Trim to max
      if (projectiles.current.length > MAX_PROJECTILES) {
        projectiles.current = projectiles.current.slice(-MAX_PROJECTILES);
      }
    }

    // Move projectiles & check collisions
    const obstacles = obstacleDataRef.current;
    const alive: Proj[] = [];

    for (const p of projectiles.current) {
      if (!p.alive) continue;
      p.z -= PROJECTILE_SPEED * dt;

      // Despawn if too far
      if (p.z < OBSTACLE_SPAWN_Z - 10) continue;

      // Check collision with obstacles (distance-based)
      let hit = false;
      for (const obs of obstacles) {
        const dx = p.x - obs.x;
        const dz = p.z - obs.z;
        const dy = p.y - obs.y;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const hitRadius = obs.scale * 5;
        if (dist < hitRadius) {
          hit = true;
          onHitAsteroid(obs.id, new THREE.Vector3(obs.x, obs.y, obs.z));
          break;
        }
      }
      if (hit) continue;

      alive.push(p);
    }
    projectiles.current = alive;

    // Update instanced mesh
    for (let i = 0; i < MAX_PROJECTILES; i++) {
      if (i < alive.length) {
        dummy.position.set(alive[i].x, alive[i].y, alive[i].z);
        dummy.scale.set(1, 1, 1);
      } else {
        dummy.scale.set(0, 0, 0);
      }
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, MAX_PROJECTILES]} frustumCulled={false}>
      <cylinderGeometry args={[0.04, 0.04, 1.2, 6]} />
      <meshBasicMaterial color="#06b6d4" transparent opacity={0.9} toneMapped={false} />
    </instancedMesh>
  );
}
