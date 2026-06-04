export interface SimParams {
  /** Masa del propelente expulsado (kg). Determina la duración del encendido. */
  propellantMass: number;
  /** Fuerza de eyección del propelente (N). Magnitud de la acción. */
  ejectionForce: number;
  /** Masa del cohete (kg). Define la masa del RigidBody. */
  droneMass: number;
}

export interface Telemetry {
  /** Rapidez actual del cohete (m/s). */
  velocity: number;
  /** Aceleración instantánea del cohete (m/s²). */
  acceleration: number;
}

/** Señal de encendido: el id se incrementa en cada ignición para disparar el efecto. */
export interface IgnitionSignal {
  id: number;
}

/**
 * Instantánea de los valores en el momento exacto en que concluye el vuelo.
 * El panel de análisis lee de aquí (no de los sliders en vivo), de modo que
 * mover los parámetros con el informe abierto no altera el resultado mostrado.
 */
export interface AnalysisSnapshot {
  /** Fuerza de eyección (N) al concluir el vuelo. */
  force: number;
  /** Masa del cohete (kg) al concluir el vuelo. */
  mass: number;
  /** Aceleración resultante (m/s²) = force / mass. */
  acceleration: number;
}

export const DEFAULT_PARAMS: SimParams = {
  propellantMass: 4,
  ejectionForce: 120,
  droneMass: 8,
};
