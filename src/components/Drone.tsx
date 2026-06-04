"use client";

import {
  Suspense,
  useRef,
  type RefObject,
} from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import {
  RigidBody,
  CuboidCollider,
  type RapierRigidBody,
} from "@react-three/rapier";
import DroneModel from "./DroneModel";
import DroneLoader from "./DroneLoader";
import ExhaustParticles from "./ExhaustParticles";
import type { KeyMap } from "@/lib/useKeyboard";
import {
  LATERAL_IMPULSE,
  LANE_LIMIT,
  DRONE_MASS,
} from "@/lib/types";
import { MAX_FRAME_DT } from "@/lib/physics";

interface DroneProps {
  playing: boolean;
  keysRef: RefObject<KeyMap>;
  onCollision: () => void;
  /** Mutable Vector3 updated each frame with the drone's world position. */
  playerPosRef: RefObject<THREE.Vector3>;
}

export default function Drone({
  playing,
  keysRef,
  onCollision,
  playerPosRef,
}: DroneProps) {
  const body = useRef<RapierRigidBody>(null);
  const collided = useRef(false);

  useFrame((_, delta) => {
    const rb = body.current;
    if (!rb || !playing) return;
    const dt = Math.min(delta, MAX_FRAME_DT);
    const keys = keysRef.current;

    // Lateral impulse from keyboard
    let impulseX = 0;
    if (keys.left) impulseX -= LATERAL_IMPULSE * dt;
    if (keys.right) impulseX += LATERAL_IMPULSE * dt;

    if (impulseX !== 0) {
      rb.applyImpulse({ x: impulseX, y: 0, z: 0 }, true);
    }

    // Clamp lateral position
    const pos = rb.translation();
    if (pos.x < -LANE_LIMIT) {
      rb.setTranslation({ x: -LANE_LIMIT, y: pos.y, z: pos.z }, true);
      rb.setLinvel({ x: 0, y: rb.linvel().y, z: rb.linvel().z }, true);
    } else if (pos.x > LANE_LIMIT) {
      rb.setTranslation({ x: LANE_LIMIT, y: pos.y, z: pos.z }, true);
      rb.setLinvel({ x: 0, y: rb.linvel().y, z: rb.linvel().z }, true);
    }

    // Update player position ref for alien ship targeting
    playerPosRef.current.set(pos.x, pos.y, pos.z);

    // Dampen vertical drift (keep drone roughly at y=0)
    const vy = rb.linvel().y;
    if (Math.abs(vy) > 0.01 || Math.abs(pos.y) > 0.1) {
      rb.setLinvel({ x: rb.linvel().x, y: vy * 0.9, z: 0 }, true);
      rb.setTranslation({ x: pos.x, y: pos.y * 0.95, z: 0 }, true);
    }
  });

  const handleCollision = () => {
    if (collided.current) return;
    collided.current = true;
    onCollision();
  };

  return (
    <RigidBody
      ref={body}
      colliders={false}
      gravityScale={0}
      linearDamping={3}
      angularDamping={10}
      lockRotations
      onIntersectionEnter={handleCollision}
    >
      <CuboidCollider args={[0.6, 0.55, 1]} mass={DRONE_MASS} sensor />
      <Suspense fallback={<DroneLoader />}>
        <DroneModel />
      </Suspense>
      <ExhaustParticles active={playing} />
    </RigidBody>
  );
}
