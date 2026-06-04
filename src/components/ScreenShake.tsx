"use client";

import { useRef, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const SHAKE_DURATION = 0.6;
const SHAKE_INTENSITY = 0.4;

export default function ScreenShake({
  active,
  children,
}: {
  active: boolean;
  children: ReactNode;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const timer = useRef(0);
  const wasActive = useRef(false);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;

    if (active && !wasActive.current) {
      timer.current = SHAKE_DURATION;
    }
    wasActive.current = active;

    if (timer.current > 0) {
      timer.current -= delta;
      const t = Math.max(timer.current / SHAKE_DURATION, 0);
      const intensity = SHAKE_INTENSITY * t;
      group.position.x = (Math.random() - 0.5) * intensity;
      group.position.y = (Math.random() - 0.5) * intensity;
    } else {
      group.position.x = 0;
      group.position.y = 0;
    }
  });

  return <group ref={groupRef}>{children}</group>;
}
