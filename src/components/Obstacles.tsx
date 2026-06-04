"use client";

import { Suspense, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody, CuboidCollider, type RapierRigidBody } from "@react-three/rapier";
import AsteroidModel from "./AsteroidModel";
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
  scale: number;
  rotY: number;
}

let nextId = 0;

export default function Obstacles({ active }: { active: boolean }) {
  const [obstacles, setObstacles] = useState<ObstacleData[]>([]);
  const timerRef = useRef(0);
  const rigidBodies = useRef<Map<number, RapierRigidBody>>(new Map());
  const wasActive = useRef(false);

  useFrame((_, delta) => {
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

    timerRef.current += dt;
    let spawned: ObstacleData | null = null;
    if (timerRef.current >= OBSTACLE_INTERVAL) {
      timerRef.current -= OBSTACLE_INTERVAL;
      spawned = {
        id: nextId++,
        x: (Math.random() - 0.5) * LANE_LIMIT * 2,
        z: OBSTACLE_SPAWN_Z,
        scale: 0.8 + Math.random() * 1.2,
        rotY: Math.random() * Math.PI * 2,
      };
    }

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
          rb.setNextKinematicTranslation({ x: obs.x, y: 0, z: newZ });
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
            args={[obs.scale * 0.5, obs.scale * 0.5, obs.scale * 0.5]}
            sensor
          />
          <group rotation={[0, obs.rotY, 0]}>
            <Suspense fallback={null}>
              <AsteroidModel scale={obs.scale} />
            </Suspense>
          </group>
        </RigidBody>
      ))}
    </>
  );
}
