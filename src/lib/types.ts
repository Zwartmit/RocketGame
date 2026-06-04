/** Game states for the arcade flow. */
export type GameState = "START" | "PLAYING" | "GAME_OVER" | "VICTORY";

/** HUD telemetry pushed from the 3D scene each frame. */
export interface GameTelemetry {
  /** Distance travelled along the Z-axis (metres). */
  distance: number;
  /** Remaining energy 0–1 (decreases over time while PLAYING). */
  energy: number;
  /** Weapon heat 0–1. Overheats at 1 and must cool down. */
  weaponHeat: number;
  /** Player score from destroying asteroids. */
  score: number;
  /** Whether the tactical shield is active. */
  hasShield: boolean;
}

/** Target distance to reach the planet and win. */
export const TARGET_DISTANCE = 500;

/** Starting energy (normalised). */
export const MAX_ENERGY = 1;

/** Energy drain per second while playing. */
export const ENERGY_DRAIN_PER_SEC = 0.02;

/** Lateral impulse magnitude applied per frame while a key is held. */
export const LATERAL_IMPULSE = 60;

/** Forward speed (Z-units/second) of the scrolling world. */
export const WORLD_SPEED = 18;

/** Obstacle spawn interval (seconds). */
export const OBSTACLE_INTERVAL = 1.6;

/** How far ahead (Z) obstacles spawn. */
export const OBSTACLE_SPAWN_Z = -80;

/** Z position behind the camera where obstacles are despawned. */
export const OBSTACLE_DESPAWN_Z = 15;

/** Lane boundaries for the drone (X). */
export const LANE_LIMIT = 5;

/** Drone mass for the RigidBody collider. */
export const DRONE_MASS = 8;

/* ─── Combat constants ─── */
export const FIRE_RATE = 0.18;
export const PROJECTILE_SPEED = 80;
export const HEAT_PER_SHOT = 0.1;
export const HEAT_COOLDOWN_PER_SEC = 0.12;
export const ASTEROID_DESTROY_BONUS = 8;

/* ─── Power-up constants ─── */
export const POWERUP_INTERVAL = 5;
export const ENERGY_CAPSULE_RESTORE = 0.2;
