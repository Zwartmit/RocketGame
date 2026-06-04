"use client";

import type { SimParams } from "@/lib/types";

interface SliderProps {
  label: string;
  /** Etiqueta corta para móvil (ahorra espacio en el bottom sheet). */
  shortLabel: string;
  unit: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  hint?: string;
  disabled?: boolean;
}

function Slider({
  label,
  shortLabel,
  unit,
  value,
  min,
  max,
  step,
  onChange,
  hint,
  disabled,
}: SliderProps) {
  return (
    <div className={`flex flex-col gap-1 md:gap-1.5 ${disabled ? "opacity-50" : ""}`}>
      <div className="flex items-baseline justify-between">
        <label className="text-xs font-medium text-zinc-200 md:text-sm">
          <span className="md:hidden">{shortLabel}</span>
          <span className="hidden md:inline">{label}</span>
        </label>
        <span className="font-mono text-xs tabular-nums text-cyan-300 md:text-sm">
          {value.toFixed(step < 1 ? 1 : 0)} {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-zinc-700 accent-cyan-400 disabled:cursor-not-allowed md:h-2"
      />
      {hint ? (
        <p className="hidden text-xs text-zinc-500 md:block">{hint}</p>
      ) : null}
    </div>
  );
}

interface ControlPanelProps {
  params: SimParams;
  onChange: (params: SimParams) => void;
  onIgnition: () => void;
  onReset: () => void;
  /** Hay un encendido activo (la quema en curso). */
  thrusting: boolean;
  /** El cohete está en vuelo (desde la ignición hasta que se reinicia). */
  inFlight: boolean;
}

export default function ControlPanel({
  params,
  onChange,
  onIgnition,
  onReset,
  thrusting,
  inFlight,
}: ControlPanelProps) {
  const set = (patch: Partial<SimParams>) => onChange({ ...params, ...patch });

  return (
    <div className="pointer-events-auto fixed inset-x-0 bottom-0 z-20 max-h-[75dvh] w-full overflow-y-auto rounded-t-2xl border border-white/10 bg-zinc-900/80 p-4 shadow-2xl backdrop-blur-md md:static md:inset-auto md:z-auto md:max-h-[calc(100dvh-2rem)] md:w-[20rem] md:max-w-[calc(100vw-2rem)] md:rounded-2xl md:p-5">
      <div className="mb-2 md:mb-4">
        <h1 className="text-sm font-semibold text-white md:text-lg">
          Segunda Ley de Newton
        </h1>
        <p className="hidden text-xs text-zinc-400 md:block">
          Relación entre Fuerza, Masa y Aceleración
        </p>
      </div>

      <div className="flex flex-col gap-2.5 md:gap-4">
        <Slider
          label="Masa del propelente"
          shortLabel="Propelente"
          unit="kg"
          value={params.propellantMass}
          min={0.5}
          max={8}
          step={0.5}
          onChange={(v) => set({ propellantMass: v })}
          hint="Más propelente = encendido más largo (no cambia la aceleración)"
          disabled={inFlight}
        />
        <Slider
          label="Fuerza de eyección"
          shortLabel="Fuerza"
          unit="N"
          value={params.ejectionForce}
          min={5}
          max={120}
          step={1}
          onChange={(v) => set({ ejectionForce: v })}
          hint="Mayor fuerza → mayor aceleración (a = F/m)"
          disabled={inFlight}
        />
        <Slider
          label="Masa del cohete"
          shortLabel="Masa cohete"
          unit="kg"
          value={params.droneMass}
          min={4}
          max={40}
          step={1}
          onChange={(v) => set({ droneMass: v })}
          hint="Mayor masa → menor aceleración (a = F/m)"
          disabled={inFlight}
        />
      </div>

      <div className="mt-3 flex flex-col gap-2 md:mt-5 md:flex-row md:gap-3">
        <button
          onClick={onIgnition}
          disabled={inFlight}
          className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:from-orange-400 hover:to-red-400 disabled:cursor-not-allowed disabled:opacity-50 md:flex-1"
        >
          {thrusting ? "Encendido…" : inFlight ? "En vuelo…" : "🔥 Ignición"}
        </button>
        <button
          onClick={onReset}
          className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-zinc-200 transition hover:bg-white/10 md:w-auto"
        >
          Reiniciar
        </button>
      </div>
    </div>
  );
}
