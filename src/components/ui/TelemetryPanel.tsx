"use client";

import type { Telemetry } from "@/lib/types";

function Readout({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: number;
  unit: string;
  color: string;
}) {
  return (
    <div className="flex flex-col">
      <span className="text-xs uppercase tracking-wider text-zinc-400">
        {label}
      </span>
      <span className="font-mono text-2xl font-semibold tabular-nums" style={{ color }}>
        {value.toFixed(2)}
        <span className="ml-1 text-sm font-normal text-zinc-400">{unit}</span>
      </span>
    </div>
  );
}

export default function TelemetryPanel({ telemetry }: { telemetry: Telemetry }) {
  return (
    <div className="pointer-events-auto w-[16rem] max-w-[calc(100vw-2rem)] rounded-2xl border border-white/10 bg-zinc-900/70 p-5 shadow-2xl backdrop-blur-md">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-300">
        Telemetría
      </h2>
      <div className="flex flex-col gap-4">
        <Readout
          label="Velocidad"
          value={telemetry.velocity}
          unit="m/s"
          color="#22d3ee"
        />
        <Readout
          label="Aceleración"
          value={telemetry.acceleration}
          unit="m/s²"
          color="#a78bfa"
        />
      </div>
    </div>
  );
}
