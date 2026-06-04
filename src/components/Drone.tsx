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
  VERTICAL_IMPULSE,
  LANE_LIMIT,
  Y_LIMIT_MIN,
  Y_LIMIT_MAX,
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

/** Max tilt angles (radians) */
const MAX_ROLL = 0.45;
const MAX_PITCH = 0.3;
const TILT_LERP = 6;

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
  const modelRef = useRef<THREE.Group>(null);
  const currentRoll = useRef(0);
  const currentPitch = useRef(0);

  // Reset collision flag when game restarts
  useEffect(() => {
    if (!playing) {
      collided.current = false;
      currentRoll.current = 0;
      currentPitch.current = 0;
    }
  }, [playing]);

  useFrame((_, delta) => {
    const rb = body.current;
    if (!rb || !playing) return;
    const dt = Math.min(delta, MAX_FRAME_DT);
    const keys = keysRef.current;

    // Lateral impulse from keyboard + joystick
    let impulseX = 0;
    if (keys.left) impulseX -= LATERAL_IMPULSE * dt;
    if (keys.right) impulseX += LATERAL_IMPULSE * dt;
    impulseX += keys.joyX * LATERAL_IMPULSE * dt;

    // Vertical impulse from keyboard + joystick
    let impulseY = 0;
    if (keys.up) impulseY += VERTICAL_IMPULSE * dt;
    if (keys.down) impulseY -= VERTICAL_IMPULSE * dt;
    impulseY += keys.joyY * VERTICAL_IMPULSE * dt;

    if (impulseX !== 0 || impulseY !== 0) {
      rb.applyImpulse({ x: impulseX, y: impulseY, z: 0 }, true);
    }

    // Read position & velocity once
    const pos = rb.translation();
    const vel = rb.linvel();

    // Clamp lateral position
    if (pos.x < -LANE_LIMIT) {
      rb.setLinvel({ x: Math.max(vel.x, 0), y: vel.y, z: vel.z }, true);
      rb.applyImpulse({ x: (-LANE_LIMIT - pos.x) * DRONE_MASS * 10, y: 0, z: 0 }, true);
    } else if (pos.x > LANE_LIMIT) {
      rb.setLinvel({ x: Math.min(vel.x, 0), y: vel.y, z: vel.z }, true);
      rb.applyImpulse({ x: (LANE_LIMIT - pos.x) * DRONE_MASS * 10, y: 0, z: 0 }, true);
    }

    // Clamp vertical position
    if (pos.y < Y_LIMIT_MIN) {
      rb.setLinvel({ x: vel.x, y: Math.max(vel.y, 0), z: vel.z }, true);
      rb.applyImpulse({ x: 0, y: (Y_LIMIT_MIN - pos.y) * DRONE_MASS * 10, z: 0 }, true);
    } else if (pos.y > Y_LIMIT_MAX) {
      rb.setLinvel({ x: vel.x, y: Math.min(vel.y, 0), z: vel.z }, true);
      rb.applyImpulse({ x: 0, y: (Y_LIMIT_MAX - pos.y) * DRONE_MASS * 10, z: 0 }, true);
    }

    // Update player position ref
    playerPosRef.current.set(pos.x, pos.y, pos.z);

    // Dampen Z drift
    const correctedVz = -pos.z * 8;
    rb.setLinvel({ x: vel.x, y: vel.y, z: correctedVz }, true);

    // Dynamic ship tilt
    const inputX = (keys.left ? -1 : 0) + (keys.right ? 1 : 0) + keys.joyX;
    const inputY = (keys.up ? 1 : 0) + (keys.down ? -1 : 0) + keys.joyY;
    const targetRoll = -Math.max(-1, Math.min(1, inputX)) * MAX_ROLL;
    const targetPitch = -Math.max(-1, Math.min(1, inputY)) * MAX_PITCH;

    currentRoll.current = THREE.MathUtils.lerp(currentRoll.current, targetRoll, TILT_LERP * dt);
    currentPitch.current = THREE.MathUtils.lerp(currentPitch.current, targetPitch, TILT_LERP * dt);

    if (modelRef.current) {
      modelRef.current.rotation.z = currentRoll.current;
      modelRef.current.rotation.x = currentPitch.current;
    }
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
      <group ref={modelRef}>
        <Suspense fallback={<DroneLoader />}>
          <DroneModel />
        </Suspense>
        <ExhaustParticles active={playing} />
      </group>
      <ShieldBubble active={hasShield} />
    </RigidBody>
  );
}
