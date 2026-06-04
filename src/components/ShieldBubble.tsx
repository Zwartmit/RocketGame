"use client";

import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

export default function ShieldBubble({ active }: { active: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    mesh.visible = active;
    if (active) {
      mesh.rotation.y += delta * 0.5;
      mesh.rotation.x += delta * 0.3;
    }
  });

  return (
    <mesh ref={meshRef} visible={false}>
      <icosahedronGeometry args={[1.8, 1]} />
      <meshStandardMaterial
        color="#3b82f6"
        emissive="#3b82f6"
        emissiveIntensity={0.5}
        transparent
        opacity={0.15}
        wireframe
        toneMapped={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
