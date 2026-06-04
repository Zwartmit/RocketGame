"use client";

import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody, CuboidCollider, type RapierRigidBody } from "@react-three/rapier";
import {
  WORLD_SPEED,
  OBSTACLE_INTERVAL,
  OBSTACLE_SPAWN_Z,
  OBSTACLE_DESPAWN_Z,
  LANE_LIMIT,
} from "@/lib/types";

interface ObstacleData {
  id: number;
  x: number;
  z: number;
  scale: [number, number, number];
  color: string;
}

const COLORS = ["#06b6d4", "#d946ef", "#22d3ee", "#a855f7", "#ec4899"];

let nextId = 0;

export default function Obstacles({ active }: { active: boolean }) {
  const [obstacles, setObstacles] = useState<ObstacleData[]>([]);
  const timerRef = useRef(0);
  const rigidBodies = useRef<Map<number, RapierRigidBody>>(new Map());
  const wasActive = useRef(false);

  useFrame((_, delta) => {
    // Handle transition from active → inactive: clear everything.
    if (!active) {
      if (wasActive.current) {
        wasActive.current = false;
        timerRef.current = 0;
        rigidBodies.current.clear();
        setObstacles([]);
      }
      return;
    }
    wasActive.current = true;
    const dt = Math.min(delta, 0.05);

    // Spawn new obstacles
    timerRef.current += dt;
    let spawned: ObstacleData | null = null;
    if (timerRef.current >= OBSTACLE_INTERVAL) {
      timerRef.current -= OBSTACLE_INTERVAL;
      const sx = 0.5 + Math.random() * 1.5;
      const sy = 0.5 + Math.random() * 2;
      const sz = 0.5 + Math.random() * 1;
      spawned = {
        id: nextId++,
        x: (Math.random() - 0.5) * LANE_LIMIT * 2,
        z: OBSTACLE_SPAWN_Z,
        scale: [sx, sy, sz],
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      };
    }

    // Move existing obstacles via physics bodies and collect removals.
    const removeIds: number[] = [];
    setObstacles((prev) => {
      const list = spawned ? [...prev, spawned] : prev;
      const next: ObstacleData[] = [];
      for (const obs of list) {
        const newZ = obs.z + WORLD_SPEED * dt;
        if (newZ > OBSTACLE_DESPAWN_Z) {
          removeIds.push(obs.id);
          continue;
        }
        const rb = rigidBodies.current.get(obs.id);
        if (rb) {
          rb.setTranslation({ x: obs.x, y: 0, z: newZ }, true);
        }
        next.push({ ...obs, z: newZ });
      }
      return next;
    });

    for (const id of removeIds) rigidBodies.current.delete(id);
  });

  return (
    <>
      {obstacles.map((obs) => (
        <RigidBody
          key={obs.id}
          type="kinematicPosition"
          position={[obs.x, 0, obs.z]}
          colliders={false}
          ref={(ref: RapierRigidBody | null) => {
            if (ref) rigidBodies.current.set(obs.id, ref);
          }}
          userData={{ obstacle: true }}
        >
          <CuboidCollider
            args={[obs.scale[0] / 2, obs.scale[1] / 2, obs.scale[2] / 2]}
            sensor
          />
          <mesh scale={obs.scale}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial
              color={obs.color}
              emissive={obs.color}
              emissiveIntensity={1.5}
              toneMapped={false}
              transparent
              opacity={0.85}
            />
          </mesh>
          <mesh scale={obs.scale}>
            <boxGeometry args={[1, 1, 1]} />
            <meshBasicMaterial
              color={obs.color}
              wireframe
              transparent
              opacity={0.4}
            />
          </mesh>
        </RigidBody>
      ))}
    </>
  );
}
