"use client";

import { useRef, useLayoutEffect } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

const PARTICLE_COUNT = 16;
const LIFETIME = 0.6;
const SPEED = 8;
const dummy = new THREE.Object3D();

interface Burst {
  position: THREE.Vector3;
  age: number;
  velocities: THREE.Vector3[];
}

export interface DestructionEffectHandle {
  spawn: (position: THREE.Vector3) => void;
}

export default function DestructionEffect({
  handleRef,
}: {
  handleRef: React.MutableRefObject<DestructionEffectHandle | null>;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const bursts = useRef<Burst[]>([]);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const m = new THREE.Matrix4().makeScale(0, 0, 0);
    for (let i = 0; i < PARTICLE_COUNT * 4; i++) mesh.setMatrixAt(i, m);
    mesh.instanceMatrix.needsUpdate = true;
  }, []);

  useLayoutEffect(() => {
    handleRef.current = {
      spawn(position: THREE.Vector3) {
        const vels: THREE.Vector3[] = [];
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          vels.push(
            new THREE.Vector3(
              (Math.random() - 0.5) * SPEED,
              (Math.random() - 0.5) * SPEED,
              (Math.random() - 0.5) * SPEED
            )
          );
        }
        bursts.current.push({ position: position.clone(), age: 0, velocities: vels });
        if (bursts.current.length > 4) bursts.current.shift();
      },
    };
  }, [handleRef]);

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const dt = Math.min(delta, 0.05);

    let idx = 0;
    const alive: Burst[] = [];
    const current = bursts.current;

    for (let b = 0; b < current.length; b++) {
      const newAge = current[b].age + dt;
      if (newAge >= LIFETIME) continue;
      const burst = { ...current[b], age: newAge };
      alive.push(burst);

      const t = newAge / LIFETIME;
      const s = Math.max(0, 0.3 * (1 - t));

      for (let i = 0; i < PARTICLE_COUNT && idx < PARTICLE_COUNT * 4; i++) {
        const v = burst.velocities[i];
        dummy.position.set(
          burst.position.x + v.x * newAge,
          burst.position.y + v.y * newAge,
          burst.position.z + v.z * newAge
        );
        dummy.scale.setScalar(s);
        dummy.updateMatrix();
        mesh.setMatrixAt(idx++, dummy.matrix);
      }
    }
    bursts.current = alive;

    // Clear remaining slots
    const zero = new THREE.Matrix4().makeScale(0, 0, 0);
    while (idx < PARTICLE_COUNT * 4) {
      mesh.setMatrixAt(idx++, zero);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, PARTICLE_COUNT * 4]}
      frustumCulled={false}
    >
      <boxGeometry args={[0.2, 0.2, 0.2]} />
      <meshBasicMaterial color="#fbbf24" transparent opacity={0.8} toneMapped={false} />
    </instancedMesh>
  );
}
