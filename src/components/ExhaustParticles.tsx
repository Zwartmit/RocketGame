"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { EXHAUST_PARTICLE_COUNT as COUNT, MAX_FRAME_DT, NOZZLE_Y } from "@/lib/physics";

interface Particle {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  life: number;
  maxLife: number;
}

interface ParticleData {
  particles: Particle[];
  dummy: THREE.Object3D;
}

function spawn(p: Particle) {
  p.pos.set(
    (Math.random() - 0.5) * 0.25,
    NOZZLE_Y,
    (Math.random() - 0.5) * 0.25,
  );
  // Velocidad principal hacia abajo (-Y) con dispersión cónica.
  p.vel.set(
    (Math.random() - 0.5) * 1.6,
    -(3 + Math.random() * 3),
    (Math.random() - 0.5) * 1.6,
  );
  p.maxLife = 0.4 + Math.random() * 0.5;
  p.life = p.maxLife;
}

/** Crea (de forma perezosa) el conjunto de partículas y el objeto auxiliar. */
function createData(): ParticleData {
  return {
    particles: Array.from({ length: COUNT }, () => ({
      pos: new THREE.Vector3(0, NOZZLE_Y, 0),
      vel: new THREE.Vector3(),
      life: 0,
      maxLife: 0,
    })),
    dummy: new THREE.Object3D(),
  };
}

/**
 * Emisor de partículas ligero: pequeñas esferas que salen por la tobera
 * hacia abajo (-Y) simulando la expulsión de gas. Usa InstancedMesh.
 */
export default function ExhaustParticles({ active }: { active: boolean }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dataRef = useRef<ParticleData | null>(null);
  const settled = useRef(false); // todas las partículas inactivas ya en escala cero

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    // Si está inactivo y ya se ocultaron todas las partículas, no hay nada que
    // actualizar: evitamos recorrer y reescribir las matrices cada frame.
    if (!active && settled.current) return;
    if (active) settled.current = false;

    const data = (dataRef.current ??= createData());
    const { particles, dummy } = data;
    const dt = Math.min(delta, MAX_FRAME_DT);
    let spawnBudget = active ? 6 : 0; // partículas nuevas por frame
    let anyAlive = false;

    for (let i = 0; i < COUNT; i++) {
      const p = particles[i];
      if (p.life <= 0) {
        if (spawnBudget > 0) {
          spawn(p);
          spawnBudget--;
        } else {
          // Oculta la partícula inactiva escalándola a cero.
          dummy.position.set(0, NOZZLE_Y, 0);
          dummy.scale.setScalar(0);
          dummy.updateMatrix();
          mesh.setMatrixAt(i, dummy.matrix);
          continue;
        }
      }

      p.life -= dt;
      p.pos.addScaledVector(p.vel, dt);
      const t = Math.max(p.life / p.maxLife, 0);
      const scale = 0.18 * t;
      anyAlive = true;

      dummy.position.copy(p.pos);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    // Marca como estabilizado en el primer frame inactivo sin partículas vivas.
    if (!active && !anyAlive) settled.current = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, COUNT]}
      frustumCulled={false}
    >
      <sphereGeometry args={[1, 8, 8]} />
      <meshStandardMaterial
        color="#fdba74"
        emissive="#fb923c"
        emissiveIntensity={2}
        transparent
        opacity={0.9}
        toneMapped={false}
      />
    </instancedMesh>
  );
}
