"use client";

import { Suspense, useRef, useState, type MutableRefObject } from "react";
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

/** Mutable runtime data — positions mutated every frame via refs, never stored in React state. */
interface ObstacleData {
  id: number;
  x: number;
  y: number;
  z: number;
  scale: number;
  rotY: number;
}

/** Immutable spawn snapshot stored in React state — only used for mount/unmount. */
interface ObstacleSpawn {
  id: number;
  x: number;
  y: number;
  z: number;
  scale: number;
  rotY: number;
}

let nextId = 0;

const PROXIMITY_Z = -8;

/** Lane-based spawn: 5 X-lanes × 3 Y-lanes, guarantee at least 1 gap per wave */
const X_LANES = 5;
const Y_LANES = 3;
const Y_MIN = -0.3;
const Y_MAX = 3.5;
const MAX_ASTEROIDS_PER_WAVE = 3;

function spawnWave(z: number): ObstacleData[] {
  const laneWidth = (LANE_LIMIT * 2) / X_LANES;
  const yStep = (Y_MAX - Y_MIN) / Y_LANES;

  // Build grid of possible cells
  const cells: { lx: number; ly: number }[] = [];
  for (let lx = 0; lx < X_LANES; lx++) {
    for (let ly = 0; ly < Y_LANES; ly++) {
      cells.push({ lx, ly });
    }
  }

  // Shuffle cells
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }

  // Pick up to MAX_ASTEROIDS_PER_WAVE cells, but guarantee at least 1 gap column
  const count = 1 + Math.floor(Math.random() * MAX_ASTEROIDS_PER_WAVE);
  const usedColumns = new Set<number>();
  const result: ObstacleData[] = [];

  for (const cell of cells) {
    if (result.length >= count) break;
    // If adding this would fill all X lanes, skip to guarantee a gap
    const wouldFill = new Set(usedColumns);
    wouldFill.add(cell.lx);
    if (wouldFill.size >= X_LANES && result.length < count - 1) continue;

    usedColumns.add(cell.lx);
    const cx = -LANE_LIMIT + laneWidth * (cell.lx + 0.5) + (Math.random() - 0.5) * laneWidth * 0.4;
    const cy = Y_MIN + yStep * (cell.ly + 0.5) + (Math.random() - 0.5) * yStep * 0.3;
    result.push({
      id: nextId++,
      x: cx,
      y: cy,
      z: z + (Math.random() - 0.5) * 4,
      scale: 0.15 + Math.random() * 0.25,
      rotY: Math.random() * Math.PI * 2,
    });
  }
  return result;
}

interface ObstaclesProps {
  active: boolean;
  proximityRef: MutableRefObject<boolean>;
  destroyedIdsRef: MutableRefObject<Set<number>>;
  obstacleDataRef: MutableRefObject<{ id: number; x: number; y: number; z: number; scale: number }[]>;
}

export default function Obstacles({ active, proximityRef, destroyedIdsRef, obstacleDataRef }: ObstaclesProps) {
  /** React state holds immutable spawn snapshots — only changes when obstacles mount/unmount. */
  const [mounted, setMounted] = useState<ObstacleSpawn[]>([]);
  const timerRef = useRef(0);
  const rigidBodies = useRef<Map<number, RapierRigidBody>>(new Map());
  const wasActive = useRef(false);
  /** Mutable mirror of obstacle data — positions mutated every frame, never triggers re-renders. */
  const liveRef = useRef<ObstacleData[]>([]);

  useFrame((_, delta) => {
    if (!active) {
      if (wasActive.current) {
        wasActive.current = false;
        timerRef.current = 0;
        rigidBodies.current.clear();
        destroyedIdsRef.current.clear();
        obstacleDataRef.current = [];
        liveRef.current = [];
        setMounted([]);
      }
      return;
    }
    wasActive.current = true;
    const dt = Math.min(delta, 0.05);

    timerRef.current += dt;
    let spawned: ObstacleData[] = [];
    if (timerRef.current >= OBSTACLE_INTERVAL) {
      timerRef.current -= OBSTACLE_INTERVAL;
      spawned = spawnWave(OBSTACLE_SPAWN_Z);
    }

    const destroyed = destroyedIdsRef.current;
    const current = spawned.length > 0 ? [...liveRef.current, ...spawned] : liveRef.current;
    const next: ObstacleData[] = [];
    const removeIds: number[] = [];
    let membershipChanged = spawned.length > 0;

    for (const obs of current) {
      if (destroyed.has(obs.id)) {
        removeIds.push(obs.id);
        destroyed.delete(obs.id);
        membershipChanged = true;
        continue;
      }
      const newZ = obs.z + WORLD_SPEED * dt;
      if (newZ > OBSTACLE_DESPAWN_Z) {
        removeIds.push(obs.id);
        membershipChanged = true;
        continue;
      }
      obs.z = newZ;
      next.push(obs);
    }
    liveRef.current = next;

    // Move rigid bodies directly via refs — no React state involved
    for (const obs of next) {
      const rb = rigidBodies.current.get(obs.id);
      if (rb) {
        try {
          rb.setNextKinematicTranslation({ x: obs.x, y: obs.y, z: obs.z });
        } catch {
          rigidBodies.current.delete(obs.id);
        }
      }
    }

    // Only update React state when membership changes — use SPAWN positions (immutable)
    if (membershipChanged) {
      // Build spawn-snapshot array: new spawns get their initial positions;
      // existing obstacles keep their ORIGINAL spawn snapshot (never updated).
      const spawnMap = new Map<number, ObstacleSpawn>();
      // Preserve existing spawn data
      for (const m of mounted) spawnMap.set(m.id, m);
      // Add newly spawned with their initial positions
      for (const s of spawned) {
        spawnMap.set(s.id, { id: s.id, x: s.x, y: s.y, z: s.z, scale: s.scale, rotY: s.rotY });
      }
      // Filter to only alive ids
      const aliveIds = new Set(next.map((o) => o.id));
      setMounted(Array.from(spawnMap.values()).filter((m) => aliveIds.has(m.id)));
    }

    // Expose live obstacle data for projectile collisions (from ref, not stale state)
    obstacleDataRef.current = next.map((o) => ({ id: o.id, x: o.x, y: o.y, z: o.z, scale: o.scale }));

    // Check proximity for warning system
    let hasClose = false;
    for (const obs of next) {
      if (obs.z > PROXIMITY_Z && obs.z < 5) {
        hasClose = true;
        break;
      }
    }
    proximityRef.current = hasClose;

    for (const id of removeIds) rigidBodies.current.delete(id);
  });

  return (
    <>
      {mounted.map((obs) => (
        <RigidBody
          key={obs.id}
          type="kinematicPosition"
          position={[obs.x, obs.y, obs.z]}
          colliders={false}
          ref={(ref: RapierRigidBody | null) => {
            if (ref) rigidBodies.current.set(obs.id, ref);
          }}
          userData={{ obstacle: true, id: obs.id }}
        >
          <CuboidCollider
            args={[obs.scale * 5, obs.scale * 4.5, obs.scale * 4]}
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
