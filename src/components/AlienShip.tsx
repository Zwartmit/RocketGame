"use client";

import { Suspense, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import UfoModel from "./UfoModel";

const SPAWN_INTERVAL = 8;
const UFO_SPEED = 6;
const FIRE_INTERVAL = 1.2;
const PROJECTILE_SPEED = 12;
const PROJECTILE_LIFETIME = 3;
const HIT_RADIUS = 1.2;
const UFO_Y = 3;
const UFO_Z = -15;
const X_LIMIT = 12;

/** Space mine constants */
const MINE_DROP_INTERVAL = 3;
const MINE_FALL_SPEED = 6;
const MINE_LIFETIME = 5;
const MINE_HIT_RADIUS = 1.5;

/** Laser sweep constants */
const LASER_INTERVAL = 12;
const LASER_DURATION = 2.5;
const LASER_SPEED = 8;
const LASER_HIT_HALF_W = 0.8;

interface Projectile {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  life: number;
}

interface SpaceMine {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  life: number;
}

interface LaserState {
  active: boolean;
  x: number;
  direction: number;
  timer: number;
  cooldown: number;
}

interface UfoState {
  active: boolean;
  x: number;
  direction: number;
  fireTimer: number;
  mineTimer: number;
}

interface AlienShipProps {
  active: boolean;
  onHitPlayer: () => void;
  playerPosRef: React.RefObject<THREE.Vector3>;
}

export default function AlienShip({ active, onHitPlayer, playerPosRef }: AlienShipProps) {
  const groupRef = useRef<THREE.Group>(null);
  const spawnTimer = useRef(SPAWN_INTERVAL * 0.6);
  const ufo = useRef<UfoState>({ active: false, x: 0, direction: 1, fireTimer: 0, mineTimer: 0 });
  const projectiles = useRef<Projectile[]>([]);
  const mines = useRef<SpaceMine[]>([]);
  const laser = useRef<LaserState>({ active: false, x: 0, direction: 1, timer: 0, cooldown: LASER_INTERVAL });
  const projectileMeshes = useRef<THREE.Group>(null);
  const mineMeshes = useRef<THREE.Group>(null);
  const laserMeshRef = useRef<THREE.Mesh>(null);
  const hitRef = useRef(false);
  const wasActive = useRef(false);

  useFrame((_, delta) => {
    if (!active) {
      if (wasActive.current) {
        wasActive.current = false;
        ufo.current = { active: false, x: 0, direction: 1, fireTimer: 0, mineTimer: 0 };
        projectiles.current = [];
        mines.current = [];
        laser.current = { active: false, x: 0, direction: 1, timer: 0, cooldown: LASER_INTERVAL };
        spawnTimer.current = SPAWN_INTERVAL * 0.6;
        hitRef.current = false;
        if (groupRef.current) groupRef.current.visible = false;
        if (laserMeshRef.current) laserMeshRef.current.visible = false;
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
        u.mineTimer = 1;
        spawnTimer.current = SPAWN_INTERVAL;
      }
    }

    // Move UFO
    if (u.active) {
      u.x += UFO_SPEED * u.direction * dt;
      if (Math.abs(u.x) > X_LIMIT) {
        u.active = false;
      }

      // Fire projectiles straight down
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

      // Drop space mines
      u.mineTimer -= dt;
      if (u.mineTimer <= 0 && u.active) {
        u.mineTimer = MINE_DROP_INTERVAL;
        mines.current.push({
          pos: new THREE.Vector3(u.x, UFO_Y - 1, UFO_Z),
          vel: new THREE.Vector3(0, -MINE_FALL_SPEED * 0.3, MINE_FALL_SPEED),
          life: MINE_LIFETIME,
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
    const aliveProj: Projectile[] = [];
    for (const p of projectiles.current) {
      p.life -= dt;
      if (p.life <= 0) continue;
      p.pos.addScaledVector(p.vel, dt);

      if (!hitRef.current) {
        const dist = p.pos.distanceTo(playerPosRef.current);
        if (dist < HIT_RADIUS) {
          hitRef.current = true;
          onHitPlayer();
          continue;
        }
      }
      aliveProj.push(p);
    }
    projectiles.current = aliveProj;

    // Update mines
    const aliveMines: SpaceMine[] = [];
    for (const m of mines.current) {
      m.life -= dt;
      if (m.life <= 0) continue;
      m.pos.addScaledVector(m.vel, dt);

      if (!hitRef.current) {
        const dist = m.pos.distanceTo(playerPosRef.current);
        if (dist < MINE_HIT_RADIUS) {
          hitRef.current = true;
          onHitPlayer();
          continue;
        }
      }
      aliveMines.push(m);
    }
    mines.current = aliveMines;

    // Laser sweep
    const las = laser.current;
    if (!las.active) {
      las.cooldown -= dt;
      if (las.cooldown <= 0 && u.active) {
        las.active = true;
        las.direction = Math.random() > 0.5 ? 1 : -1;
        las.x = -las.direction * 6;
        las.timer = LASER_DURATION;
      }
    }
    if (las.active) {
      las.timer -= dt;
      las.x += LASER_SPEED * las.direction * dt;
      if (las.timer <= 0 || Math.abs(las.x) > 8) {
        las.active = false;
        las.cooldown = LASER_INTERVAL;
      }

      // Laser hit detection
      if (!hitRef.current) {
        const pp = playerPosRef.current;
        if (Math.abs(pp.x - las.x) < LASER_HIT_HALF_W && pp.z > UFO_Z - 2 && pp.z < 12) {
          hitRef.current = true;
          onHitPlayer();
        }
      }
    }
    if (laserMeshRef.current) {
      laserMeshRef.current.visible = las.active;
      if (las.active) {
        laserMeshRef.current.position.set(las.x, UFO_Y * 0.5, UFO_Z + 10);
      }
    }

    // Render projectiles
    const container = projectileMeshes.current;
    if (container) {
      while (container.children.length > aliveProj.length) {
        container.remove(container.children[container.children.length - 1]);
      }
      for (let i = 0; i < aliveProj.length; i++) {
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
        mesh.position.copy(aliveProj[i].pos);
      }
    }

    // Render mines
    const mineContainer = mineMeshes.current;
    if (mineContainer) {
      while (mineContainer.children.length > aliveMines.length) {
        mineContainer.remove(mineContainer.children[mineContainer.children.length - 1]);
      }
      for (let i = 0; i < aliveMines.length; i++) {
        let mesh: THREE.Mesh;
        if (i < mineContainer.children.length) {
          mesh = mineContainer.children[i] as THREE.Mesh;
        } else {
          const geo = new THREE.OctahedronGeometry(0.4, 0);
          const mat = new THREE.MeshStandardMaterial({
            color: "#dc2626",
            emissive: "#dc2626",
            emissiveIntensity: 4,
            toneMapped: false,
          });
          mesh = new THREE.Mesh(geo, mat);
          mineContainer.add(mesh);
        }
        mesh.position.copy(aliveMines[i].pos);
        mesh.rotation.y += dt * 3;
        mesh.rotation.x += dt * 2;
      }
    }
  });

  return (
    <>
      <group ref={groupRef} visible={false}>
        <Suspense fallback={null}>
          <UfoModel />
        </Suspense>
        <pointLight
          position={[0, -1, 0]}
          intensity={20}
          color="#ef4444"
          distance={15}
        />
      </group>
      <group ref={projectileMeshes} />
      <group ref={mineMeshes} />
      {/* Laser sweep beam */}
      <mesh ref={laserMeshRef} visible={false}>
        <boxGeometry args={[0.3, UFO_Y * 2, 30]} />
        <meshBasicMaterial
          color="#ef4444"
          transparent
          opacity={0.25}
          toneMapped={false}
        />
      </mesh>
    </>
  );
}
