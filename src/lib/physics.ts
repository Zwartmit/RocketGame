/**
 * Physics and simulation constants.
 * Centralised here to avoid magic numbers across components.
 */

/** Max frame dt (s) for numerical stability. */
export const MAX_FRAME_DT = 0.05;

/** Nozzle Y-position relative to the drone mesh (m). */
export const NOZZLE_Y = -0.95;

/** Exhaust particle count. */
export const EXHAUST_PARTICLE_COUNT = 120;

/** Default camera FOV. */
export const DEFAULT_FOV = 55;
