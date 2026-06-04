/**
 * Constantes físicas y de simulación (valores de ajuste, no tipos).
 * Centralizadas aquí para evitar "números mágicos" repartidos por los componentes.
 */

/** Segundos de encendido por cada kg de propelente. */
export const BURN_SECONDS_PER_KG = 0.45;

/** Dirección de empuje (reacción) en el espacio del mundo. */
export const THRUST_AXIS: [number, number, number] = [0, 1, 0];

/** Límite superior de dt por frame (s) para estabilidad numérica. */
export const MAX_FRAME_DT = 0.05;

/** Intervalo de actualización de telemetría (s), ~10 Hz. */
export const TELEMETRY_INTERVAL = 0.1;

/** Número de partículas del emisor de escape. */
export const EXHAUST_PARTICLE_COUNT = 120;

/** Posición de la tobera respecto al cohete (m). */
export const NOZZLE_Y = -0.95;

/** Escalado visual de las flechas de fuerza en función de la magnitud (N). */
export const ARROW_BASE_LENGTH = 1.4;
export const ARROW_LENGTH_PER_NEWTON = 0.012;
export const ARROW_MAX_LENGTH = 4;

/** Altitud (Y) que al superarse concluye el vuelo y dispara el auto-reinicio. */
export const MAX_ALTITUDE = 40;

/** Campo de visión (grados) de la cámara y límites para el zoom manual. */
export const DEFAULT_FOV = 45;
export const MIN_FOV = 25;
export const MAX_FOV = 70;
export const FOV_STEP = 5;
