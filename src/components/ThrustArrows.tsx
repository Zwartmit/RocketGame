"use client";

/**
 * Vectores 3D de acción y reacción (Tercera Ley de Newton).
 * - Flecha ROJA: acción (gases expulsados hacia abajo, -Y).
 * - Flecha VERDE: reacción (empuje sobre el cohete hacia arriba, +Y).
 * Solo se muestran mientras dura el encendido.
 */

import {
  ARROW_BASE_LENGTH,
  ARROW_LENGTH_PER_NEWTON,
  ARROW_MAX_LENGTH,
} from "@/lib/physics";

interface ArrowProps {
  color: string;
  /** +1 apunta hacia +Y, -1 hacia -Y. */
  sign: 1 | -1;
  /** Longitud total de la flecha. */
  length: number;
  /** Desplazamiento del origen a lo largo de Y. */
  offset: number;
}

function Arrow({ color, sign, length, offset }: ArrowProps) {
  const headLength = 0.45;
  const shaftLength = Math.max(length - headLength, 0.01);
  const shaftCenter = offset + sign * shaftLength * 0.5;
  const headCenter = offset + sign * (shaftLength + headLength * 0.5);

  return (
    <group>
      <mesh position={[0, shaftCenter, 0]}>
        <cylinderGeometry args={[0.07, 0.07, shaftLength, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1.1}
          toneMapped={false}
        />
      </mesh>
      <mesh
        position={[0, headCenter, 0]}
        rotation={sign === 1 ? [0, 0, 0] : [Math.PI, 0, 0]}
      >
        <coneGeometry args={[0.2, headLength, 18]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1.1}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

export default function ThrustArrows({
  visible,
  magnitude,
}: {
  visible: boolean;
  magnitude: number;
}) {
  if (!visible) return null;
  // Escala la longitud visible según la fuerza, con límites razonables.
  const length = Math.min(
    ARROW_BASE_LENGTH + magnitude * ARROW_LENGTH_PER_NEWTON,
    ARROW_MAX_LENGTH,
  );
  return (
    <group>
      {/* Reacción (empuje): verde, hacia arriba desde el cuerpo. */}
      <Arrow color="#22c55e" sign={1} length={length} offset={0.4} />
      {/* Acción (gases): roja, hacia abajo desde la tobera. */}
      <Arrow color="#ef4444" sign={-1} length={length} offset={-0.8} />
    </group>
  );
}
