"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const LINE_COUNT = 300;
const WARP_DURATION = 2.0;

interface WarpLine {
  pos: THREE.Vector3;
  speed: number;
  length: number;
  life: number;
}

interface WarpData {
  lines: WarpLine[];
  dummy: THREE.Object3D;
}

function createWarp(): WarpData {
  const lines: WarpLine[] = [];
  for (let i = 0; i < LINE_COUNT; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 1 + Math.random() * 8;
    lines.push({
      pos: new THREE.Vector3(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        -(Math.random() * 60 + 10),
      ),
      speed: 40 + Math.random() * 60,
      length: 0.5 + Math.random() * 2,
      life: WARP_DURATION,
    });
  }
  return { lines, dummy: new THREE.Object3D() };
}

export default function HyperspaceEffect({ active }: { active: boolean }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dataRef = useRef<WarpData | null>(null);
  const wasActive = useRef(false);

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    if (active && !wasActive.current) {
      dataRef.current = createWarp();
    }
    wasActive.current = active;

    const data = dataRef.current;
    if (!data) return;

    const dt = Math.min(delta, 0.05);
    const { lines, dummy } = data;

    for (let i = 0; i < LINE_COUNT; i++) {
      const l = lines[i];
      if (l.life <= 0) {
        dummy.scale.setScalar(0);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        continue;
      }

      l.life -= dt;
      l.pos.z += l.speed * dt;

      const t = Math.max(l.life / WARP_DURATION, 0);

      dummy.position.copy(l.pos);
      dummy.scale.set(0.03, 0.03, l.length * (1 + (1 - t) * 3));
      dummy.lookAt(0, 0, l.pos.z + 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, LINE_COUNT]}
      frustumCulled={false}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color="#22d3ee"
        emissive="#06b6d4"
        emissiveIntensity={4}
        transparent
        opacity={0.8}
        toneMapped={false}
      />
    </instancedMesh>
  );
}
