"use client";

import { Suspense, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import UfoModel from "./UfoModel";

/** How often (seconds) a new UFO spawns. */
const SPAWN_INTERVAL = 8;
/** Horizontal travel speed of the UFO. */
const UFO_SPEED = 6;
/** How often (seconds) the UFO fires a projectile. */
const FIRE_INTERVAL = 1.2;
/** Projectile downward speed (units/s). */
const PROJECTILE_SPEED = 12;
/** Max projectile lifetime (seconds). */
const PROJECTILE_LIFETIME = 3;
/** How close a projectile must be to the player to count as a hit. */
const HIT_RADIUS = 1.2;
/** Y height of the UFO. */
const UFO_Y = 3;
/** Z position of the UFO (slightly ahead of the player). */
const UFO_Z = -15;
/** X boundaries for spawn/despawn. */
const X_LIMIT = 12;

interface Projectile {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  life: number;
}

interface UfoState {
  active: boolean;
  x: number;
  direction: number; // 1 = moving right, -1 = moving left
  fireTimer: number;
}

interface AlienShipProps {
  active: boolean;
  onHitPlayer: () => void;
  /** Ref to a Vector3 that tracks the player position each frame. */
  playerPosRef: React.RefObject<THREE.Vector3>;
}

export default function AlienShip({ active, onHitPlayer, playerPosRef }: AlienShipProps) {
  const groupRef = useRef<THREE.Group>(null);
  const spawnTimer = useRef(SPAWN_INTERVAL * 0.6); // first UFO arrives earlier
  const ufo = useRef<UfoState>({ active: false, x: 0, direction: 1, fireTimer: 0 });
  const projectiles = useRef<Projectile[]>([]);
  const projectileMeshes = useRef<THREE.Group>(null);
  const hitRef = useRef(false);
  const wasActive = useRef(false);

  useFrame((_, delta) => {
    if (!active) {
      if (wasActive.current) {
        wasActive.current = false;
        ufo.current = { active: false, x: 0, direction: 1, fireTimer: 0 };
        projectiles.current = [];
        spawnTimer.current = SPAWN_INTERVAL * 0.6;
        hitRef.current = false;
        if (groupRef.current) groupRef.current.visible = false;
      }
      return;
    }
    wasActive.current = true;

    const dt = Math.min(delta, 0.05);
    const u = ufo.current;

    // Spawn logic
    if (!u.active) {
      spawnTimer.current -= dt;
      if (spawnTimer.current <= 0) {
        u.active = true;
        u.direction = Math.random() > 0.5 ? 1 : -1;
        u.x = -u.direction * X_LIMIT;
        u.fireTimer = 0.5;
        spawnTimer.current = SPAWN_INTERVAL;
      }
    }

    // Move UFO
    if (u.active) {
      u.x += UFO_SPEED * u.direction * dt;
      if (Math.abs(u.x) > X_LIMIT) {
        u.active = false;
      }

      // Fire projectiles straight down (not aimed at player)
      u.fireTimer -= dt;
      if (u.fireTimer <= 0 && u.active) {
        u.fireTimer = FIRE_INTERVAL;
        const origin = new THREE.Vector3(u.x, UFO_Y, UFO_Z);
        projectiles.current.push({
          pos: origin,
          vel: new THREE.Vector3(0, -PROJECTILE_SPEED, 0),
          life: PROJECTILE_LIFETIME,
        });
      }
    }

    // Update UFO mesh position
    if (groupRef.current) {
      groupRef.current.visible = u.active;
      if (u.active) {
        groupRef.current.position.set(u.x, UFO_Y, UFO_Z);
      }
    }

    // Update projectiles
    const alive: Projectile[] = [];
    for (const p of projectiles.current) {
      p.life -= dt;
      if (p.life <= 0) continue;
      p.pos.addScaledVector(p.vel, dt);

      // Hit detection against player
      if (!hitRef.current) {
        const dist = p.pos.distanceTo(playerPosRef.current);
        if (dist < HIT_RADIUS) {
          hitRef.current = true;
          onHitPlayer();
          continue;
        }
      }
      alive.push(p);
    }
    projectiles.current = alive;

    // Render projectiles
    const container = projectileMeshes.current;
    if (container) {
      // Sync children count
      while (container.children.length > alive.length) {
        const child = container.children[container.children.length - 1];
        container.remove(child);
      }
      for (let i = 0; i < alive.length; i++) {
        let mesh: THREE.Mesh;
        if (i < container.children.length) {
          mesh = container.children[i] as THREE.Mesh;
        } else {
          const geo = new THREE.SphereGeometry(0.2, 6, 6);
          const mat = new THREE.MeshStandardMaterial({
            color: "#ef4444",
            emissive: "#ef4444",
            emissiveIntensity: 3,
            toneMapped: false,
          });
          mesh = new THREE.Mesh(geo, mat);
          container.add(mesh);
        }
        mesh.position.copy(alive[i].pos);
      }
    }
  });

  return (
    <>
      <group ref={groupRef} visible={false}>
        <Suspense fallback={null}>
          <UfoModel />
        </Suspense>
        {/* Glow under the UFO */}
        <pointLight
          position={[0, -1, 0]}
          intensity={20}
          color="#ef4444"
          distance={15}
        />
      </group>
      <group ref={projectileMeshes} />
    </>
  );
}
