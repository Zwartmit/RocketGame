"use client";

import {
  Suspense,
  useRef,
  useEffect,
  type RefObject,
  type MutableRefObject,
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
import ShieldBubble from "./ShieldBubble";
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
  onShieldBreak: () => void;
  hasShield: boolean;
  /** Mutable Vector3 updated each frame with the drone's world position. */
  playerPosRef: RefObject<THREE.Vector3>;
  /** Set of asteroid IDs destroyed by shield impact — written by Drone */
  shieldDestroyRef: MutableRefObject<Set<number>>;
}

export default function Drone({
  playing,
  keysRef,
  onCollision,
  onShieldBreak,
  hasShield,
  playerPosRef,
  shieldDestroyRef,
}: DroneProps) {
  const body = useRef<RapierRigidBody>(null);
  const collided = useRef(false);

  // Reset collision flag when game restarts
  useEffect(() => {
    if (!playing) {
      collided.current = false;
    }
  }, [playing]);

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

    // Read position & velocity once (avoid repeated calls into WASM)
    const pos = rb.translation();
    const vel = rb.linvel();

    // Clamp lateral position via impulse
    if (pos.x < -LANE_LIMIT) {
      rb.setLinvel({ x: Math.max(vel.x, 0), y: vel.y, z: vel.z }, true);
      rb.applyImpulse({ x: (-LANE_LIMIT - pos.x) * DRONE_MASS * 10, y: 0, z: 0 }, true);
    } else if (pos.x > LANE_LIMIT) {
      rb.setLinvel({ x: Math.min(vel.x, 0), y: vel.y, z: vel.z }, true);
      rb.applyImpulse({ x: (LANE_LIMIT - pos.x) * DRONE_MASS * 10, y: 0, z: 0 }, true);
    }

    // Update player position ref for alien ship targeting
    playerPosRef.current.set(pos.x, pos.y, pos.z);

    // Dampen vertical drift & Z drift purely via velocity
    const correctedVy = vel.y * 0.85 + (-pos.y * 8);
    const correctedVz = -pos.z * 8;
    rb.setLinvel({ x: vel.x, y: correctedVy, z: correctedVz }, true);
  });

  const handleCollision = (payload: { other: { rigidBody?: RapierRigidBody | null } }) => {
    if (collided.current) return;
    const data = payload.other.rigidBody?.userData as Record<string, unknown> | undefined;
    if (!data) return;

    const isObstacle = data.obstacle === true;
    const isMine = data.mine === true;
    const isProjectile = data.ufoProjectile === true;

    if (isObstacle || isMine || isProjectile) {
      if (hasShield) {
        // Shield absorbs hit
        onShieldBreak();
        if (isObstacle && typeof data.id === "number") {
          shieldDestroyRef.current.add(data.id);
        }
        return;
      }
      collided.current = true;
      onCollision();
    }
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
      <ShieldBubble active={hasShield} />
    </RigidBody>
  );
}
