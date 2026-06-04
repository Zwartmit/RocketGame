"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { WORLD_SPEED } from "@/lib/types";

const GRID_REPEAT = 60;
const GRID_SIZE = 120;

/**
 * Scrolling neon grid floor that simulates infinite forward movement.
 * Offsets the texture UV each frame based on WORLD_SPEED.
 */
export default function NeonGrid({ active }: { active: boolean }) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const offsetRef = useRef(0);

  useFrame((_, delta) => {
    if (!active || !matRef.current) return;
    offsetRef.current += WORLD_SPEED * delta;
    matRef.current.uniforms.uOffset.value = offsetRef.current;
  });

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, -20]}>
      <planeGeometry args={[GRID_SIZE, GRID_SIZE, 1, 1]} />
      <shaderMaterial
        ref={matRef}
        transparent
        uniforms={{
          uOffset: { value: 0 },
          uRepeat: { value: GRID_REPEAT },
          uColor: { value: new THREE.Color("#06b6d4") },
        }}
        vertexShader={`
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform float uOffset;
          uniform float uRepeat;
          uniform vec3 uColor;
          varying vec2 vUv;

          void main() {
            vec2 grid = fract(vec2(vUv.x * uRepeat, vUv.y * uRepeat + uOffset));
            float lineX = smoothstep(0.02, 0.0, abs(grid.x - 0.5) - 0.48);
            float lineY = smoothstep(0.02, 0.0, abs(grid.y - 0.5) - 0.48);
            float line = max(lineX, lineY);

            // Fade towards edges
            float fade = smoothstep(0.0, 0.25, vUv.x) * smoothstep(1.0, 0.75, vUv.x);
            fade *= smoothstep(0.0, 0.15, vUv.y) * smoothstep(1.0, 0.6, vUv.y);

            float alpha = line * fade * 0.6;
            gl_FragColor = vec4(uColor, alpha);
          }
        `}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}
