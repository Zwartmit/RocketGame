"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ReactLenis } from "@studio-freight/react-lenis";
import gsap from "gsap";
import Scene from "./Scene";
import ControlPanel from "./ui/ControlPanel";
import TelemetryPanel from "./ui/TelemetryPanel";
import AnalysisPanel from "./ui/AnalysisPanel";
import CanvasControls from "./ui/CanvasControls";
import { DEFAULT_FOV, FOV_STEP, MAX_FOV, MIN_FOV } from "@/lib/physics";
import {
  DEFAULT_PARAMS,
  type AnalysisSnapshot,
  type SimParams,
  type Telemetry,
} from "@/lib/types";

const THEORY_ID = "teoria";

export default function SimulationApp() {
  const [params, setParams] = useState<SimParams>(DEFAULT_PARAMS);
  const [ignitionId, setIgnitionId] = useState(0);
  const [resetId, setResetId] = useState(0);
  const [thrusting, setThrusting] = useState(false);
  // El cohete está "en vuelo" desde que se enciende hasta que se reinicia
  // (auto al superar la altura máxima, o manual con Reiniciar). Mientras dure,
  // no se puede volver a encender ni cambiar los parámetros.
  const [inFlight, setInFlight] = useState(false);
  // El panel de análisis solo se revela cuando concluye el vuelo (auto-reinicio).
  const [showAnalysis, setShowAnalysis] = useState(false);
  // Instantánea congelada de fuerza/masa/aceleración al concluir el vuelo: el
  // modal lee de aquí, así mover los sliders con el informe abierto no lo altera.
  const [analysis, setAnalysis] = useState<AnalysisSnapshot | null>(null);
  const [fov, setFov] = useState(DEFAULT_FOV);
  const [telemetry, setTelemetry] = useState<Telemetry>({
    velocity: 0,
    acceleration: 0,
  });

  const rootRef = useRef<HTMLElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);

  const handleTelemetry = useCallback((t: Telemetry) => setTelemetry(t), []);

  // El estado de encendido lo reporta el motor físico (Drone), de modo que la
  // interfaz siempre coincide con la duración real del empuje aunque se cambien
  // los parámetros a mitad del encendido.
  const handleThrustingChange = useCallback(
    (value: boolean) => setThrusting(value),
    [],
  );

  // El panel queda oculto al iniciar el vuelo; solo reaparece al concluir. Un
  // nuevo encendido es una de las dos únicas formas de cerrarlo (junto con ✕).
  const handleIgnition = useCallback(() => {
    setIgnitionId((n) => n + 1);
    setInFlight(true);
    setShowAnalysis(false);
  }, []);

  const handleReset = useCallback(() => {
    setResetId((n) => n + 1);
    setInFlight(false);
    setTelemetry({ velocity: 0, acceleration: 0 });
  }, []);

  // Cambiar parámetros ya no cierra el panel: permanece hasta que el usuario
  // pulse ✕ o dispare un nuevo encendido.
  const handleParamsChange = useCallback((next: SimParams) => {
    setParams(next);
  }, []);

  // Cierre explícito del panel (botón ✕).
  const handleCloseAnalysis = useCallback(() => setShowAnalysis(false), []);

  // El vuelo concluyó (el cohete superó la altitud máxima y se reinició solo).
  // Congelamos los valores actuales en una instantánea para el informe.
  const handleFlightComplete = useCallback(() => {
    setParams((current) => {
      setAnalysis({
        force: current.ejectionForce,
        mass: current.droneMass,
        acceleration:
          current.droneMass > 0 ? current.ejectionForce / current.droneMass : 0,
      });
      return current;
    });
    setInFlight(false);
    setShowAnalysis(true);
  }, []);

  const handleZoomIn = useCallback(
    () => setFov((f) => Math.max(MIN_FOV, f - FOV_STEP)),
    [],
  );
  const handleZoomOut = useCallback(
    () => setFov((f) => Math.min(MAX_FOV, f + FOV_STEP)),
    [],
  );

  // Animaciones de entrada con GSAP.
  useEffect(() => {
    const ctx = gsap.context(() => {
      if (overlayRef.current) {
        gsap.from(overlayRef.current.querySelectorAll("[data-anim]"), {
          y: 24,
          opacity: 0,
          duration: 0.8,
          ease: "power3.out",
          stagger: 0.15,
          delay: 0.2,
        });
      }
      if (infoRef.current) {
        gsap.from(infoRef.current.querySelectorAll("[data-card]"), {
          y: 40,
          opacity: 0,
          duration: 0.7,
          ease: "power2.out",
          stagger: 0.12,
          delay: 0.6,
        });
      }
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <ReactLenis root>
      <main ref={rootRef} className="relative">
        {/* Escena 3D (fondo fijo) */}
        <Scene
          params={params}
          ignitionId={ignitionId}
          resetId={resetId}
          fov={fov}
          onTelemetry={handleTelemetry}
          onThrustingChange={handleThrustingChange}
          onFlightComplete={handleFlightComplete}
        />

        {/* Capa de interfaz */}
        <div
          ref={overlayRef}
          className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-between p-4 sm:p-6"
        >
          <div className="flex items-start justify-between gap-4">
            {/* En móvil el panel es un bottom sheet (position: fixed). No se
                envuelve con [data-anim] porque el transform de la animación de
                entrada de GSAP rompería el posicionamiento fixed. */}
            <div>
              <ControlPanel
                params={params}
                onChange={handleParamsChange}
                onIgnition={handleIgnition}
                onReset={handleReset}
                thrusting={thrusting}
                inFlight={inFlight}
              />
            </div>
            <div className="flex flex-col items-end gap-4">
              <div data-anim className="hidden md:block">
                <TelemetryPanel telemetry={telemetry} />
              </div>
              <AnalysisPanel
                show={showAnalysis}
                thrusting={thrusting}
                snapshot={analysis}
                onClose={handleCloseAnalysis}
              />
            </div>
          </div>

          <div className="flex items-end justify-between gap-4">
            <div
              data-anim
              className="pointer-events-auto hidden rounded-xl border border-white/10 bg-zinc-900/60 px-4 py-3 text-xs backdrop-blur-md md:block"
            >
              <div className="flex items-center gap-2">
                <span className="inline-block h-2.5 w-6 rounded-full bg-green-500" />
                <span className="text-zinc-300">Fuerza aplicada (F)</span>
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="inline-block h-2.5 w-6 rounded-full bg-red-500" />
                <span className="text-zinc-300">Gases expulsados</span>
              </div>
            </div>
            <div
              data-anim
              className="pointer-events-none hidden text-right text-xs text-zinc-500 md:block"
            >
              Arrastra para orbitar · Usa +/− para acercar
            </div>
          </div>

          {/* Controles flotantes: zoom manual + acceso a la teoría */}
          <CanvasControls
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            theoryTarget={`#${THEORY_ID}`}
          />
        </div>

        {/* Espaciador para revelar la sección teórica al desplazar */}
        <div className="h-screen" aria-hidden />

        {/* Sección teórica (scroll suave con Lenis) */}
        <section
          id={THEORY_ID}
          ref={infoRef}
          className="relative z-20 border-t border-white/10 bg-zinc-950/85 px-6 py-20 backdrop-blur-xl"
        >
          <div className="mx-auto max-w-3xl">
            <h2 data-card className="text-3xl font-bold text-white">
              La física detrás del experimento
            </h2>
            <p data-card className="mt-4 text-zinc-300">
              La <strong>Segunda Ley de Newton</strong> (o Ley de la Dinámica)
              establece que la aceleración de un objeto es directamente
              proporcional a la fuerza neta que actúa sobre él, e inversamente
              proporcional a su masa. En este entorno de gravedad cero, la fuerza
              del propulsor genera una aceleración constante según la fórmula
              a = F / m.
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div
                data-card
                className="rounded-xl border border-white/10 bg-white/5 p-5"
              >
                <h3 className="font-semibold text-cyan-300">
                  Fuerza de eyección (Empuje)
                </h3>
                <p className="mt-2 text-sm text-zinc-400">
                  Define la magnitud de la fuerza neta aplicada. A mayor fuerza,
                  mayor aceleración resultante (proporcionalidad directa).
                </p>
              </div>
              <div
                data-card
                className="rounded-xl border border-white/10 bg-white/5 p-5"
              >
                <h3 className="font-semibold text-cyan-300">
                  Masa del cohete (Inercia)
                </h3>
                <p className="mt-2 text-sm text-zinc-400">
                  Representa la resistencia al cambio de movimiento. A mayor masa
                  estructural, menor aceleración bajo una fuerza constante
                  (proporcionalidad inversa).
                </p>
              </div>
              <div
                data-card
                className="rounded-xl border border-white/10 bg-white/5 p-5"
              >
                <h3 className="font-semibold text-cyan-300">
                  Masa del propelente (Combustible)
                </h3>
                <p className="mt-2 text-sm text-zinc-400">
                  No altera el cálculo de la aceleración, pero determina la
                  cantidad de energía disponible, definiendo el tiempo total que
                  dura la ignición de los motores.
                </p>
              </div>
            </div>

            <p data-card className="mt-10 text-sm text-zinc-500">
              Ajusta los parámetros y pulsa <strong>Ignición</strong> para lanzar
              el cohete. Usa <strong>Reiniciar</strong> para devolverlo al centro.
            </p>
          </div>
        </section>
      </main>
    </ReactLenis>
  );
}
