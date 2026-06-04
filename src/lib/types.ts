/** Game states for the arcade flow. */
export type GameState = "START" | "PLAYING" | "GAME_OVER" | "VICTORY";

/** HUD telemetry pushed from the 3D scene each frame. */
export interface GameTelemetry {
  /** Distance travelled along the Z-axis (metres). */
  distance: number;
  /** Remaining energy 0–1 (decreases over time while PLAYING). */
  energy: number;
}

/** Target distance to reach the planet and win. */
export const TARGET_DISTANCE = 500;

/** Starting energy (normalised). */
export const MAX_ENERGY = 1;

/** Energy drain per second while playing. */
export const ENERGY_DRAIN_PER_SEC = 0.02;

/** Lateral impulse magnitude applied per frame while a key is held. */
export const LATERAL_IMPULSE = 12;

/** Forward speed (Z-units/second) of the scrolling world. */
export const WORLD_SPEED = 18;

/** Obstacle spawn interval (seconds). */
export const OBSTACLE_INTERVAL = 0.9;

/** How far ahead (Z) obstacles spawn. */
export const OBSTACLE_SPAWN_Z = -80;

/** Z position behind the camera where obstacles are despawned. */
export const OBSTACLE_DESPAWN_Z = 15;

/** Lane boundaries for the drone (X). */
export const LANE_LIMIT = 5;

/** Drone mass for the RigidBody collider. */
export const DRONE_MASS = 8;
