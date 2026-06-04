"use client";

import { useRef, type MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  WORLD_SPEED,
  POWERUP_INTERVAL,
  OBSTACLE_SPAWN_Z,
  OBSTACLE_DESPAWN_Z,
  LANE_LIMIT,
} from "@/lib/types";

type PowerUpKind = "energy" | "shield" | "coolant";

interface PowerUpData {
  id: number;
  x: number;
  z: number;
  kind: PowerUpKind;
}

let nextPuId = 0;

const HIT_RADIUS = 1.8;

interface PowerUpsProps {
  active: boolean;
  playerPosRef: React.RefObject<THREE.Vector3>;
  collectedIdsRef: MutableRefObject<Set<number>>;
  onCollectEnergy: () => void;
  onCollectShield: () => void;
  onCollectCoolant: () => void;
}

export default function PowerUps({
  active,
  playerPosRef,
  collectedIdsRef,
  onCollectEnergy,
  onCollectShield,
  onCollectCoolant,
}: PowerUpsProps) {
  const timerRef = useRef(POWERUP_INTERVAL * 0.5);
  const powerups = useRef<PowerUpData[]>([]);
  const meshGroupRef = useRef<THREE.Group>(null);
  const wasActive = useRef(false);

  useFrame((_, delta) => {
    if (!active) {
      if (wasActive.current) {
        wasActive.current = false;
        timerRef.current = POWERUP_INTERVAL * 0.5;
        powerups.current = [];
      }
      return;
    }
    wasActive.current = true;
    const dt = Math.min(delta, 0.05);

    // Spawn
    timerRef.current -= dt;
    if (timerRef.current <= 0) {
      timerRef.current = POWERUP_INTERVAL + Math.random() * 2;
      const r = Math.random();
      const kind: PowerUpKind = r < 0.55 ? "energy" : r < 0.80 ? "shield" : "coolant";
      powerups.current.push({
        id: nextPuId++,
        x: (Math.random() - 0.5) * LANE_LIMIT * 1.6,
        z: OBSTACLE_SPAWN_Z,
        kind,
      });
    }

    // Move & check collection
    const alive: PowerUpData[] = [];
    const collected = collectedIdsRef.current;
    const ppos = playerPosRef.current;

    for (const pu of powerups.current) {
      pu.z += WORLD_SPEED * dt;
      if (pu.z > OBSTACLE_DESPAWN_Z) continue;
      if (collected.has(pu.id)) continue;

      // Distance-based collection
      const dx = pu.x - ppos.x;
      const dz = pu.z - ppos.z;
      const dy = 0.5 - ppos.y;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < HIT_RADIUS) {
        collected.add(pu.id);
        if (pu.kind === "energy") onCollectEnergy();
        else if (pu.kind === "shield") onCollectShield();
        else onCollectCoolant();
        continue;
      }

      alive.push(pu);
    }
    powerups.current = alive;

    // Sync meshes
    const group = meshGroupRef.current;
    if (!group) return;
    while (group.children.length > alive.length) {
      group.remove(group.children[group.children.length - 1]);
    }
    for (let i = 0; i < alive.length; i++) {
      const pu = alive[i];
      let mesh: THREE.Mesh;
      if (i < group.children.length) {
        mesh = group.children[i] as THREE.Mesh;
      } else {
        if (pu.kind === "energy") {
          const geo = new THREE.CylinderGeometry(0.6, 0.6, 0.4, 8);
          const mat = new THREE.MeshStandardMaterial({
            color: "#22c55e",
            emissive: "#22c55e",
            emissiveIntensity: 2,
            toneMapped: false,
            transparent: true,
            opacity: 0.85,
          });
          mesh = new THREE.Mesh(geo, mat);
        } else if (pu.kind === "shield") {
          const geo = new THREE.SphereGeometry(0.5, 16, 16);
          const mat = new THREE.MeshStandardMaterial({
            color: "#3b82f6",
            emissive: "#3b82f6",
            emissiveIntensity: 3,
            toneMapped: false,
            transparent: true,
            opacity: 0.7,
          });
          mesh = new THREE.Mesh(geo, mat);
        } else {
          const geo = new THREE.OctahedronGeometry(0.55);
          const mat = new THREE.MeshStandardMaterial({
            color: "#38bdf8",
            emissive: "#38bdf8",
            emissiveIntensity: 3,
            toneMapped: false,
            transparent: true,
            opacity: 0.8,
          });
          mesh = new THREE.Mesh(geo, mat);
        }
        group.add(mesh);
      }
      mesh.position.set(pu.x, 0.5, pu.z);
      mesh.rotation.y += dt * 2;
    }
  });

  return <group ref={meshGroupRef} />;
}
