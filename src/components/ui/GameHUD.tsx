"use client";

import { useRef, useState, useEffect, type RefObject, type MutableRefObject } from "react";
import type { GameState, GameTelemetry } from "@/lib/types";
import { TARGET_DISTANCE } from "@/lib/types";
import type { KeyMap } from "@/lib/useKeyboard";
import VirtualJoystick from "./VirtualJoystick";

interface GameHUDProps {
  state: GameState;
  telemetry: GameTelemetry;
  keysRef: RefObject<KeyMap>;
  onStart: () => void;
  onRestart: () => void;
  proximityRef: MutableRefObject<boolean>;
  weaponHeatRef: MutableRefObject<number>;
}

/* ─── Corner Brackets ─── */
function CornerBrackets() {
  const base =
    "absolute w-8 h-8 border-cyan-400/60 drop-shadow-[0_0_6px_rgba(34,211,238,0.6)] pointer-events-none";
  return (
    <>
      <div className={`${base} top-2 left-2 border-t-2 border-l-2`} />
      <div className={`${base} top-2 right-2 border-t-2 border-r-2`} />
      <div className={`${base} bottom-2 left-2 border-b-2 border-l-2`} />
      <div className={`${base} bottom-2 right-2 border-b-2 border-r-2`} />
      {/* Inner chamfer lines */}
      <div className="absolute top-2 left-12 right-12 h-px bg-gradient-to-r from-cyan-400/40 via-transparent to-cyan-400/40 pointer-events-none" />
      <div className="absolute bottom-2 left-12 right-12 h-px bg-gradient-to-r from-cyan-400/40 via-transparent to-cyan-400/40 pointer-events-none" />
      <div className="absolute left-2 top-12 bottom-12 w-px bg-gradient-to-b from-cyan-400/40 via-transparent to-cyan-400/40 pointer-events-none" />
      <div className="absolute right-2 top-12 bottom-12 w-px bg-gradient-to-b from-cyan-400/40 via-transparent to-cyan-400/40 pointer-events-none" />
    </>
  );
}

/* ─── Ambient Telemetry (visual fluff) ─── */
function AmbientTelemetry() {
  return (
    <>
      {/* Top-left */}
      <div className="absolute top-4 left-12 font-mono text-[9px] leading-tight text-cyan-400/50 pointer-events-none select-none">
        <div>SYS.ALIGNMENT: <span className="text-cyan-300/70">OK</span></div>
        <div>NAV.FREQ: <span className="text-fuchsia-400/60">427.8 MHz</span></div>
        <div>GRID.LOCK: <span className="text-cyan-300/70">ACTIVE</span></div>
      </div>
      {/* Top-right */}
      <div className="absolute top-4 right-12 font-mono text-[9px] leading-tight text-right text-fuchsia-400/50 pointer-events-none select-none">
        <div>COORD X:<span className="text-fuchsia-300/70"> 0.42°</span></div>
        <div>COORD Z:<span className="text-fuchsia-300/70"> -12.7°</span></div>
        <div>SIGNAL: <span className="text-cyan-400/60">■■■■□</span></div>
      </div>
      {/* Bottom-left */}
      <div className="absolute bottom-4 left-12 font-mono text-[9px] leading-tight text-cyan-400/40 pointer-events-none select-none hidden sm:block">
        <div>THRUST.VEC: <span className="text-cyan-300/60">NOMINAL</span></div>
        <div>SHIELD: <span className="text-fuchsia-400/50">72%</span></div>
      </div>
      {/* Bottom-right */}
      <div className="absolute bottom-4 right-12 font-mono text-[9px] leading-tight text-right text-fuchsia-400/40 pointer-events-none select-none hidden sm:block">
        <div>FUEL.MIX: <span className="text-cyan-400/50">OPT</span></div>
        <div>COMM.CH: <span className="text-fuchsia-300/50">7-ALPHA</span></div>
      </div>
    </>
  );
}

/* ─── CSS Vignette ─── */
function Vignette() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-20"
      style={{
        background:
          "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.55) 80%, rgba(0,0,0,0.85) 100%)",
      }}
    />
  );
}

/* ─── Vertical Data Bars (left & right edges) ─── */
function VerticalDataBars() {
  const segments = 12;
  return (
    <>
      {/* Left bar */}
      <div className="absolute left-3 top-1/2 -translate-y-1/2 flex flex-col gap-[3px] pointer-events-none select-none">
        {Array.from({ length: segments }).map((_, i) => (
          <div
            key={`l${i}`}
            className="w-[3px] h-4 rounded-sm"
            style={{
              background: i < segments / 2
                ? `rgba(34,211,238,${0.15 + (i / segments) * 0.4})`
                : `rgba(232,121,249,${0.15 + ((segments - i) / segments) * 0.4})`,
              animation: `pulse-glow ${1.5 + i * 0.2}s ease-in-out infinite`,
            }}
          />
        ))}
      </div>
      {/* Right bar */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-[3px] pointer-events-none select-none">
        {Array.from({ length: segments }).map((_, i) => (
          <div
            key={`r${i}`}
            className="w-[3px] h-4 rounded-sm"
            style={{
              background: i < segments / 2
                ? `rgba(232,121,249,${0.15 + (i / segments) * 0.4})`
                : `rgba(34,211,238,${0.15 + ((segments - i) / segments) * 0.4})`,
              animation: `pulse-glow ${1.8 + i * 0.15}s ease-in-out infinite`,
            }}
          />
        ))}
      </div>
    </>
  );
}

/* ─── Central Reticle (faint cyan crosshair) ─── */
function CentralReticle() {
  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none">
      {/* Horizontal line */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-px bg-gradient-to-r from-transparent via-cyan-400/25 to-transparent" />
      {/* Vertical line */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-16 w-px bg-gradient-to-b from-transparent via-cyan-400/25 to-transparent" />
      {/* Center dot */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-cyan-400/30 shadow-[0_0_6px_rgba(34,211,238,0.4)]" />
      {/* Corner ticks */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 border border-cyan-400/10 rounded-full" />
    </div>
  );
}

/* ─── Energy Gauge (angled tech bar with gradient) ─── */
function EnergyGauge({ energy }: { energy: number }) {
  const pct = Math.max(0, Math.min(100, energy * 100));
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs uppercase tracking-wider font-bold text-cyan-400/90">
          Energía
        </span>
        <span className="font-mono text-xs font-bold text-cyan-300/70">{pct.toFixed(0)}%</span>
      </div>
      <div
        className="relative h-4 w-44 sm:w-56 overflow-hidden border border-cyan-400/30 bg-zinc-900/60"
        style={{ clipPath: "polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%)" }}
      >
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-cyan-400 transition-[width] duration-150"
          style={{ width: `${pct}%` }}
        />
        {/* Scanline overlay */}
        <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.15)_2px,rgba(0,0,0,0.15)_4px)]" />
      </div>
      {/* Mini ticks */}
      <div className="flex justify-between w-44 sm:w-56">
        {[0, 25, 50, 75, 100].map((v) => (
          <span key={v} className="font-mono text-[8px] text-cyan-400/30">{v}</span>
        ))}
      </div>
    </div>
  );
}

/* ─── Weapon Heat Gauge ─── */
function WeaponHeatGauge({ heat }: { heat: number }) {
  const pct = Math.max(0, Math.min(100, heat * 100));
  const overheated = heat >= 1;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <span className={`font-mono text-xs uppercase tracking-wider font-bold ${
          overheated ? "text-red-400 animate-pulse" : "text-orange-400/90"
        }`}>
          Arma
        </span>
        <span className={`font-mono text-xs font-bold ${
          overheated ? "text-red-300" : "text-orange-300/70"
        }`}>{pct.toFixed(0)}%</span>
      </div>
      <div
        className={`relative h-3.5 w-36 sm:w-44 overflow-hidden border bg-zinc-900/60 ${
          overheated ? "border-red-500/60" : "border-orange-400/30"
        }`}
        style={{ clipPath: "polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%)" }}
      >
        <div
          className={`absolute inset-y-0 left-0 transition-[width] duration-100 ${
            overheated
              ? "bg-gradient-to-r from-red-500 via-orange-500 to-red-500"
              : "bg-gradient-to-r from-orange-400 via-red-500 to-orange-400"
          }`}
          style={{ width: `${pct}%` }}
        />
        <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.15)_2px,rgba(0,0,0,0.15)_4px)]" />
      </div>
    </div>
  );
}

/* ─── Distance Gauge ─── */
function DistanceGauge({ distance }: { distance: number }) {
  const remaining = Math.max(0, TARGET_DISTANCE - distance);
  const pct = Math.min(100, (distance / TARGET_DISTANCE) * 100);
  return (
    <div className="flex flex-col items-end gap-1">
      <span className="font-mono text-xs uppercase tracking-wider font-bold text-fuchsia-400/90">
        Distancia al Planeta
      </span>
      <span className="font-mono text-3xl font-bold tabular-nums text-fuchsia-300 drop-shadow-[0_0_10px_rgba(232,121,249,0.6)]">
        {remaining.toFixed(0)}
        <span className="ml-1 text-xs font-normal text-fuchsia-300/50">m</span>
      </span>
      <div
        className="relative h-2 w-28 sm:w-36 overflow-hidden border border-fuchsia-400/30 bg-zinc-900/60"
        style={{ clipPath: "polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%)" }}
      >
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-fuchsia-500 via-cyan-400 to-fuchsia-500 transition-[width] duration-300"
          style={{ width: `${pct}%` }}
        />
        <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.15)_2px,rgba(0,0,0,0.15)_4px)]" />
      </div>
    </div>
  );
}

/* ─── Proximity Warning ─── */
function ProximityWarning({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div className="absolute bottom-20 sm:bottom-16 left-1/2 -translate-x-1/2 animate-pulse">
      <div className="px-5 py-2 bg-red-950/70 backdrop-blur-sm border border-red-500/60 shadow-[0_0_20px_rgba(239,68,68,0.4)]">
        <span className="font-mono text-xs sm:text-sm font-bold uppercase tracking-wider text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]">
          ⚠ PROXIMITY ALERT — EVADE
        </span>
      </div>
    </div>
  );
}

/* ─── Thruster Indicators ─── */
function ThrusterIndicators({ left, right }: { left: boolean; right: boolean }) {
  const chevrons = 4;
  return (
    <>
      {/* Left thruster */}
      <div className="absolute left-5 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1 pointer-events-none select-none">
        {Array.from({ length: chevrons }).map((_, i) => (
          <div
            key={`lt${i}`}
            className="w-3 h-3 transition-all duration-75"
            style={{
              clipPath: "polygon(100% 0, 0 50%, 100% 100%)",
              background: left
                ? `rgba(34,211,238,${0.5 + i * 0.15})`
                : "rgba(34,211,238,0.08)",
              boxShadow: left ? "0 0 8px rgba(34,211,238,0.6)" : "none",
            }}
          />
        ))}
        <span className={`font-mono text-[8px] uppercase tracking-wider mt-1 transition-colors duration-75 ${
          left ? "text-cyan-300" : "text-cyan-400/20"
        }`}>L</span>
      </div>
      {/* Right thruster */}
      <div className="absolute right-5 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1 pointer-events-none select-none">
        {Array.from({ length: chevrons }).map((_, i) => (
          <div
            key={`rt${i}`}
            className="w-3 h-3 transition-all duration-75"
            style={{
              clipPath: "polygon(0 0, 100% 50%, 0 100%)",
              background: right
                ? `rgba(232,121,249,${0.5 + i * 0.15})`
                : "rgba(232,121,249,0.08)",
              boxShadow: right ? "0 0 8px rgba(232,121,249,0.6)" : "none",
            }}
          />
        ))}
        <span className={`font-mono text-[8px] uppercase tracking-wider mt-1 transition-colors duration-75 ${
          right ? "text-fuchsia-300" : "text-fuchsia-400/20"
        }`}>R</span>
      </div>
    </>
  );
}

/* ─── FUI Overlay Container ─── */
function FuiOverlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md">
      {/* Central container with chamfered clip-path */}
      <div
        className="relative flex flex-col items-center gap-6 px-12 py-10 border border-cyan-400/20 bg-zinc-950/80"
        style={{
          clipPath:
            "polygon(16px 0, calc(100% - 16px) 0, 100% 16px, 100% calc(100% - 16px), calc(100% - 16px) 100%, 16px 100%, 0 calc(100% - 16px), 0 16px)",
        }}
      >
        {/* Corner glows */}
        <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />
        <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-fuchsia-400/60 to-transparent" />
        <div className="absolute left-0 top-4 bottom-4 w-px bg-gradient-to-b from-transparent via-cyan-400/40 to-transparent" />
        <div className="absolute right-0 top-4 bottom-4 w-px bg-gradient-to-b from-transparent via-fuchsia-400/40 to-transparent" />
        {children}
      </div>
    </div>
  );
}

/* ─── FUI Button ─── */
function FuiButton({
  onClick,
  children,
  color = "cyan",
}: {
  onClick: () => void;
  children: React.ReactNode;
  color?: "cyan" | "fuchsia" | "red";
}) {
  const colors = {
    cyan: "border-cyan-400/50 text-cyan-300 shadow-[0_0_20px_-4px_rgba(34,211,238,0.5)] hover:border-cyan-300 hover:bg-cyan-400/15 hover:shadow-[0_0_30px_0px_rgba(34,211,238,0.5)]",
    fuchsia: "border-fuchsia-400/50 text-fuchsia-300 shadow-[0_0_20px_-4px_rgba(232,121,249,0.5)] hover:border-fuchsia-300 hover:bg-fuchsia-400/15 hover:shadow-[0_0_30px_0px_rgba(232,121,249,0.5)]",
    red: "border-red-400/50 text-red-300 shadow-[0_0_20px_-4px_rgba(239,68,68,0.5)] hover:border-red-300 hover:bg-red-400/15 hover:shadow-[0_0_30px_0px_rgba(239,68,68,0.5)]",
  };
  return (
    <button
      onClick={onClick}
      className={`relative px-10 py-4 font-mono text-base uppercase tracking-[0.3em] bg-zinc-900/60 transition-all duration-200 active:scale-95 ${colors[color]}`}
      style={{
        clipPath:
          "polygon(8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px), 0 8px)",
        border: "1px solid",
      }}
    >
      {children}
    </button>
  );
}

/* ─── Targeting Reticle ─── */
function TargetingReticle({ onClick }: { onClick: () => void }) {
  return (
    <div className="relative flex items-center justify-center">
      {/* Outer ring — slow spin */}
      <div className="absolute w-72 h-72 rounded-full border-2 border-dashed border-cyan-400/25 animate-[spin_20s_linear_infinite]" />
      {/* Middle ring — reverse spin */}
      <div className="absolute w-56 h-56 rounded-full border border-dashed border-fuchsia-400/30 animate-[spin_15s_linear_infinite_reverse]" />
      {/* Inner ring */}
      <div className="absolute w-40 h-40 rounded-full border border-cyan-400/20 animate-[spin_10s_linear_infinite]" />
      {/* Crosshairs */}
      <div className="absolute w-80 h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent" />
      <div className="absolute h-80 w-px bg-gradient-to-b from-transparent via-cyan-400/20 to-transparent" />
      {/* Center button */}
      <FuiButton onClick={onClick}>Iniciar Misión</FuiButton>
    </div>
  );
}

/* ─── Delays ─── */
const GAME_OVER_DELAY = 1800;
const VICTORY_DELAY = 2200;

/* ═══════════════════════════════════════════════════════
   Main HUD
   ═══════════════════════════════════════════════════════ */
export default function GameHUD({
  state,
  telemetry,
  keysRef,
  onStart,
  onRestart,
  proximityRef,
  weaponHeatRef,
}: GameHUDProps) {
  const [showGameOver, setShowGameOver] = useState(false);
  const [showVictory, setShowVictory] = useState(false);
  const [proximity, setProximity] = useState(false);
  const [thrusterL, setThrusterL] = useState(false);
  const [thrusterR, setThrusterR] = useState(false);
  const [weaponHeat, setWeaponHeat] = useState(0);
  const prevState = useRef(state);

  // Poll keysRef and proximityRef via RAF
  useEffect(() => {
    if (state !== "PLAYING") return;
    let raf = 0;
    const loop = () => {
      setProximity(proximityRef.current);
      setThrusterL(keysRef.current.left);
      setThrusterR(keysRef.current.right);
      setWeaponHeat(weaponHeatRef.current);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [state, proximityRef, keysRef, weaponHeatRef]);

  useEffect(() => {
    const prev = prevState.current;
    prevState.current = state;

    if (state === "GAME_OVER" && prev !== "GAME_OVER") {
      const timer = setTimeout(() => setShowGameOver(true), GAME_OVER_DELAY);
      return () => clearTimeout(timer);
    }
    if (state === "VICTORY" && prev !== "VICTORY") {
      const timer = setTimeout(() => setShowVictory(true), VICTORY_DELAY);
      return () => clearTimeout(timer);
    }
    if (state !== "GAME_OVER" && prev === "GAME_OVER") {
      setShowGameOver(false);
    }
    if (state !== "VICTORY" && prev === "VICTORY") {
      setShowVictory(false);
    }
  }, [state]);

  return (
    <>
      {/* ── Playing HUD ── */}
      {/* Always-on vignette */}
      <Vignette />

      {state === "PLAYING" && (
        <div className="pointer-events-none fixed inset-0 z-30">
          <CornerBrackets />
          <AmbientTelemetry />
          <VerticalDataBars />
          <CentralReticle />
          <ThrusterIndicators left={thrusterL} right={thrusterR} />
          <ProximityWarning active={proximity} />
          {/* Gauges in sci-fi panels */}
          <div className="absolute top-4 left-10 sm:left-12">
            <div className="skew-x-[-12deg] bg-black/60 backdrop-blur-sm border border-cyan-500/50 px-5 py-3.5 shadow-[0_0_12px_-4px_rgba(34,211,238,0.3)]">
              <div className="skew-x-[12deg]">
                <EnergyGauge energy={telemetry.energy} />
                <div className="mt-2">
                  <WeaponHeatGauge heat={weaponHeat} />
                </div>
                {telemetry.hasShield && (
                  <div className="mt-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-blue-400 drop-shadow-[0_0_6px_rgba(59,130,246,0.6)]">
                    ● ESCUDO ACTIVO
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="absolute top-4 right-10 sm:right-12">
            <div className="skew-x-[12deg] bg-black/60 backdrop-blur-sm border border-fuchsia-500/50 px-5 py-3.5 shadow-[0_0_12px_-4px_rgba(232,121,249,0.3)]">
              <div className="skew-x-[-12deg]">
                <DistanceGauge distance={telemetry.distance} />
              </div>
            </div>
          </div>
          {/* Controls hint (desktop only) */}
          {/* Score */}
          {telemetry.score > 0 && (
            <div className="absolute top-20 sm:top-4 left-1/2 -translate-x-1/2">
              <span className="font-mono text-lg font-bold tabular-nums text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]">
                {telemetry.score}
              </span>
            </div>
          )}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 hidden sm:block">
            <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-zinc-500/60">
              WASD para moverse · ESPACIO para disparar
            </span>
          </div>
        </div>
      )}

      {/* Mobile virtual joystick */}
      {state === "PLAYING" && <VirtualJoystick keysRef={keysRef} />}

      {/* ── Start Screen ── */}
      {state === "START" && (
        <FuiOverlay>
          {/* Subtitle */}
          <span className="font-mono text-[9px] uppercase tracking-[0.35em] text-cyan-400/50">
            {"// ARCADE SYNTHWAVE //"}
          </span>
          {/* Title */}
          <h1 className="font-mono text-5xl sm:text-7xl font-black uppercase tracking-[0.4em] text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-cyan-400 drop-shadow-[0_0_20px_rgba(34,211,238,0.5)]">
            Super Rocket
          </h1>
          <p className="max-w-xs font-mono text-[11px] leading-relaxed text-zinc-500 text-center">
            Esquiva los asteroides. Llega al planeta antes de quedarte sin energía.
          </p>
          {/* Targeting reticle with start button */}
          <TargetingReticle onClick={onStart} />
          {/* Bottom flourish */}
          <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-fuchsia-400/30">
            SYS.READY — AWAITING PILOT INPUT
          </span>
        </FuiOverlay>
      )}

      {/* Flash effects */}
      {state === "GAME_OVER" && (
        <div className="fixed inset-0 z-40 bg-red-500/40 animate-shake pointer-events-none" />
      )}
      {state === "VICTORY" && (
        <div className="fixed inset-0 z-40 bg-cyan-400/50 animate-warp-flash pointer-events-none" />
      )}

      {/* ── Game Over Screen ── */}
      {state === "GAME_OVER" && showGameOver && (
        <FuiOverlay>
          <span className="font-mono text-[9px] uppercase tracking-[0.35em] text-red-400/50">
            {"// SYSTEM FAILURE //"}
          </span>
          <h2 className="font-mono text-3xl sm:text-4xl font-black uppercase tracking-[0.3em] text-red-400 drop-shadow-[0_0_16px_rgba(239,68,68,0.6)]">
            Fin del Juego
          </h2>
          <div className="flex flex-col items-center gap-1">
            <span className="font-mono text-sm text-zinc-500">
              Distancia: <span className="text-fuchsia-300">{telemetry.distance.toFixed(0)} m</span>
            </span>
            {telemetry.score > 0 && (
              <span className="font-mono text-sm text-zinc-500">
                Puntuación: <span className="text-yellow-300">{telemetry.score}</span>
              </span>
            )}
            <span className="font-mono text-[9px] text-zinc-600">
              MISSION.STATUS: <span className="text-red-400/70">ABORTED</span>
            </span>
          </div>
          <FuiButton onClick={onRestart} color="red">Reiniciar</FuiButton>
        </FuiOverlay>
      )}

      {/* ── Victory Screen ── */}
      {state === "VICTORY" && showVictory && (
        <FuiOverlay>
          <span className="font-mono text-[9px] uppercase tracking-[0.35em] text-cyan-400/50">
            {"// MISSION COMPLETE //"}
          </span>
          <h2 className="font-mono text-3xl sm:text-4xl font-black uppercase tracking-[0.3em] text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-400 drop-shadow-[0_0_20px_rgba(232,121,249,0.5)]">
            ¡Victoria!
          </h2>
          <div className="flex flex-col items-center gap-1">
            <span className="font-mono text-sm text-zinc-500">
              ¡Llegaste al planeta!
            </span>
            {telemetry.score > 0 && (
              <span className="font-mono text-sm text-zinc-500">
                Puntuación: <span className="text-yellow-300">{telemetry.score}</span>
              </span>
            )}
            <span className="font-mono text-[9px] text-zinc-600">
              PILOT.RANK: <span className="text-fuchsia-400/70">ACE</span>
            </span>
          </div>
          <FuiButton onClick={onRestart} color="fuchsia">Jugar de Nuevo</FuiButton>
        </FuiOverlay>
      )}
    </>
  );
}
