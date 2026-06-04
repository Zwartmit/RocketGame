"use client";

import type { GameState, GameTelemetry } from "@/lib/types";
import { TARGET_DISTANCE } from "@/lib/types";

interface GameHUDProps {
  state: GameState;
  telemetry: GameTelemetry;
  onStart: () => void;
  onRestart: () => void;
}

function EnergyBar({ energy }: { energy: number }) {
  const pct = Math.max(0, Math.min(100, energy * 100));
  const barColor =
    pct > 50
      ? "from-cyan-400 to-cyan-300"
      : pct > 25
        ? "from-yellow-400 to-orange-400"
        : "from-red-500 to-red-400";

  return (
    <div className="flex items-center gap-3">
      <span className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-cyan-300/80">
        Energía
      </span>
      <div className="relative h-3 w-40 overflow-hidden rounded-full border border-cyan-400/30 bg-zinc-900/70 shadow-[0_0_12px_-4px_rgba(34,211,238,0.4)]">
        <div
          className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${barColor} transition-[width] duration-150`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function DistanceCounter({
  distance,
}: {
  distance: number;
}) {
  const remaining = Math.max(0, TARGET_DISTANCE - distance);
  return (
    <div className="flex flex-col items-end">
      <span className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-fuchsia-300/80">
        Distancia al Planeta
      </span>
      <span className="font-mono text-2xl font-bold tabular-nums text-fuchsia-300 drop-shadow-[0_0_8px_rgba(232,121,249,0.6)]">
        {remaining.toFixed(0)}
        <span className="ml-1 text-sm font-normal text-fuchsia-300/60">m</span>
      </span>
    </div>
  );
}

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md">
      <div className="flex flex-col items-center gap-6 text-center">
        {children}
      </div>
    </div>
  );
}

function NeonButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl border border-cyan-400/50 bg-cyan-500/10 px-8 py-3 font-mono text-sm uppercase tracking-[0.3em] text-cyan-300 shadow-[0_0_24px_-4px_rgba(34,211,238,0.5)] transition-all duration-200 hover:border-cyan-300 hover:bg-cyan-400/20 hover:text-white hover:shadow-[0_0_32px_0px_rgba(34,211,238,0.6)] active:scale-95"
    >
      {children}
    </button>
  );
}

export default function GameHUD({
  state,
  telemetry,
  onStart,
  onRestart,
}: GameHUDProps) {
  return (
    <>
      {/* HUD en juego (visible durante PLAYING) */}
      {state === "PLAYING" && (
        <div className="pointer-events-none fixed inset-0 z-30 flex flex-col justify-between p-4 sm:p-6">
          {/* Barra superior */}
          <div className="flex items-start justify-between">
            <EnergyBar energy={telemetry.energy} />
            <DistanceCounter distance={telemetry.distance} />
          </div>
          {/* Indicación inferior */}
          <div className="flex justify-center">
            <span className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-zinc-500 hidden sm:inline">
              A/D o flechas para moverse
            </span>
            <span className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-zinc-500 sm:hidden">
              Arrastra para moverse
            </span>
          </div>
        </div>
      )}

      {/* Pantalla de INICIO */}
      {state === "START" && (
        <Overlay>
          <h1 className="font-mono text-4xl font-black uppercase tracking-[0.4em] text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-cyan-400 drop-shadow-[0_0_20px_rgba(34,211,238,0.5)] sm:text-5xl">
            Rocket Run
          </h1>
          <p className="max-w-xs font-mono text-xs leading-relaxed text-zinc-400">
            Esquiva los obstáculos. Llega al planeta antes de quedarte sin energía.
          </p>
          <NeonButton onClick={onStart}>Iniciar Juego</NeonButton>
        </Overlay>
      )}

      {/* Flash rojo en GAME OVER */}
      {state === "GAME_OVER" && (
        <div className="fixed inset-0 z-40 bg-red-500/40 animate-shake pointer-events-none" />
      )}

      {/* Flash cyan en VICTORIA */}
      {state === "VICTORY" && (
        <div className="fixed inset-0 z-40 bg-cyan-400/50 animate-warp-flash pointer-events-none" />
      )}

      {/* Pantalla de GAME OVER */}
      {state === "GAME_OVER" && (
        <Overlay>
          <h2 className="font-mono text-3xl font-black uppercase tracking-[0.3em] text-red-400 drop-shadow-[0_0_16px_rgba(239,68,68,0.6)] sm:text-4xl">
            Fin del Juego
          </h2>
          <p className="font-mono text-sm text-zinc-400">
            Distancia: {telemetry.distance.toFixed(0)} m
          </p>
          <NeonButton onClick={onRestart}>Reiniciar</NeonButton>
        </Overlay>
      )}

      {/* Pantalla de VICTORIA */}
      {state === "VICTORY" && (
        <Overlay>
          <h2 className="font-mono text-3xl font-black uppercase tracking-[0.3em] text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-400 drop-shadow-[0_0_20px_rgba(232,121,249,0.5)] sm:text-4xl">
            ¡Victoria!
          </h2>
          <p className="font-mono text-sm text-zinc-400">
            ¡Llegaste al planeta!
          </p>
          <NeonButton onClick={onRestart}>Jugar de Nuevo</NeonButton>
        </Overlay>
      )}
    </>
  );
}
