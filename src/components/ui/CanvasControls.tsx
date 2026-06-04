"use client";

import { useLenis } from "@studio-freight/react-lenis";

interface CanvasControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  /** Selector del destino al que desplazarse (sección teórica). */
  theoryTarget: string;
}

const buttonClass =
  "pointer-events-auto flex items-center justify-center rounded-xl border " +
  "border-cyan-400/30 bg-zinc-950/60 font-mono text-cyan-300 backdrop-blur-xl " +
  "shadow-[0_0_18px_-8px_rgba(34,211,238,0.6)] transition-all duration-200 " +
  "hover:border-cyan-300/70 hover:text-white hover:shadow-[0_0_22px_-4px_rgba(34,211,238,0.8)] " +
  "active:scale-95";

/**
 * Controles flotantes sobre el lienzo (estética cyberpunk/glassmorphism):
 * zoom manual de la cámara y desplazamiento suave a la sección teórica.
 */
export default function CanvasControls({
  onZoomIn,
  onZoomOut,
  theoryTarget,
}: CanvasControlsProps) {
  const lenis = useLenis();

  return (
    <>
      {/* Zoom manual (la rueda del ratón queda libre para el scroll de la página).
          En móvil va arriba a la derecha, fuera del paso del bottom sheet; en
          escritorio, centrado al borde derecho. */}
      <div className="absolute right-4 top-4 z-30 flex flex-col gap-2 md:right-6 md:top-1/2 md:-translate-y-1/2">
        <button
          type="button"
          aria-label="Acercar"
          onClick={onZoomIn}
          className={`${buttonClass} h-10 w-10 text-xl leading-none`}
        >
          +
        </button>
        <button
          type="button"
          aria-label="Alejar"
          onClick={onZoomOut}
          className={`${buttonClass} h-10 w-10 text-xl leading-none`}
        >
          −
        </button>
      </div>

      {/* Acceso a la teoría con scroll suave (Lenis). En móvil va arriba al centro
          (el bottom sheet ocupa la parte inferior); en escritorio, abajo al centro. */}
      <div className="absolute inset-x-0 top-4 flex justify-center md:bottom-6 md:top-auto">
        <button
          type="button"
          onClick={() => lenis?.scrollTo(theoryTarget, { duration: 1.6 })}
          className={`${buttonClass} animate-pulse px-5 py-2.5 text-xs uppercase tracking-[0.25em]`}
        >
          Conoce la Teoría ↓
        </button>
      </div>
    </>
  );
}
