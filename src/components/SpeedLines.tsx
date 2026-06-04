"use client";

import { useRef, useLayoutEffect } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

const COUNT = 120;
const SPEED = 60;
const SPAWN_Z = -80;
const DESPAWN_Z = 15;
const SPREAD_X = 12;
const SPREAD_Y = 8;

const dummy = new THREE.Object3D();

export default function SpeedLines({ active }: { active: boolean }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const positions = useRef<Float32Array>(new Float32Array(COUNT * 3));

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const m = new THREE.Matrix4().makeScale(0, 0, 0);
    for (let i = 0; i < COUNT; i++) mesh.setMatrixAt(i, m);
    mesh.instanceMatrix.needsUpdate = true;

    // Distribute initial positions
    const p = positions.current;
    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3;
      p[i3] = (Math.random() - 0.5) * SPREAD_X;
      p[i3 + 1] = (Math.random() - 0.5) * SPREAD_Y;
      p[i3 + 2] = SPAWN_Z + Math.random() * (DESPAWN_Z - SPAWN_Z);
    }
  }, []);

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const dt = Math.min(delta, 0.05);
    const p = positions.current;

    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3;

      if (active) {
        p[i3 + 2] += SPEED * dt;

        if (p[i3 + 2] > DESPAWN_Z) {
          p[i3] = (Math.random() - 0.5) * SPREAD_X;
          p[i3 + 1] = (Math.random() - 0.5) * SPREAD_Y;
          p[i3 + 2] = SPAWN_Z + Math.random() * 10;
        }

        dummy.position.set(p[i3], p[i3 + 1], p[i3 + 2]);
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
    <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]} frustumCulled={false}>
      <boxGeometry args={[0.015, 0.015, 1.8]} />
      <meshBasicMaterial color="#06b6d4" transparent opacity={0.35} toneMapped={false} />
    </instancedMesh>
  );
}
