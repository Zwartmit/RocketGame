"use client";

import { useLayoutEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const PARTICLE_COUNT = 200;
const EXPLOSION_DURATION = 1.5;

interface Particle {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  life: number;
}

interface ExplosionData {
  particles: Particle[];
  dummy: THREE.Object3D;
}

function createExplosion(): ExplosionData {
  const particles: Particle[] = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const dir = new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2,
    ).normalize();
    const speed = 4 + Math.random() * 12;
    particles.push({
      pos: new THREE.Vector3(0, 0, 0),
      vel: dir.multiplyScalar(speed),
      life: EXPLOSION_DURATION,
    });
  }
  return { particles, dummy: new THREE.Object3D() };
}

export default function ExplosionEffect({ active }: { active: boolean }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dataRef = useRef<ExplosionData | null>(null);
  const wasActive = useRef(false);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const m = new THREE.Matrix4().makeScale(0, 0, 0);
    for (let i = 0; i < PARTICLE_COUNT; i++) mesh.setMatrixAt(i, m);
    mesh.instanceMatrix.needsUpdate = true;
  }, []);

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    if (active && !wasActive.current) {
      dataRef.current = createExplosion();
    }
    wasActive.current = active;

    const data = dataRef.current;
    if (!data) return;

    const dt = Math.min(delta, 0.05);
    const { particles, dummy } = data;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = particles[i];
      if (p.life <= 0) {
        dummy.scale.setScalar(0);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        continue;
      }

      p.life -= dt;
      p.pos.addScaledVector(p.vel, dt);
      p.vel.multiplyScalar(0.97);

      const t = Math.max(p.life / EXPLOSION_DURATION, 0);
      const scale = 0.15 * t;

      dummy.position.copy(p.pos);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, PARTICLE_COUNT]}
      frustumCulled={false}
    >
      <sphereGeometry args={[1, 6, 6]} />
      <meshStandardMaterial
        color="#ef4444"
        emissive="#fb923c"
        emissiveIntensity={3}
        transparent
        opacity={0.9}
        toneMapped={false}
      />
    </instancedMesh>
  );
}
