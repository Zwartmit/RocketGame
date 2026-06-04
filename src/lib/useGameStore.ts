"use client";

import { useCallback, useRef, useState } from "react";
import {
  type GameState,
  type GameTelemetry,
  MAX_ENERGY,
  TARGET_DISTANCE,
  ENERGY_DRAIN_PER_SEC,
} from "./types";

export interface GameStore {
  state: GameState;
  telemetry: GameTelemetry;
  start: () => void;
  restart: () => void;
  setGameOver: () => void;
  tick: (dt: number, distanceDelta: number) => void;
}

const INITIAL_TELEMETRY: GameTelemetry = { distance: 0, energy: MAX_ENERGY };

export function useGameStore(): GameStore {
  const [state, setState] = useState<GameState>("START");
  const [telemetry, setTelemetry] = useState<GameTelemetry>(INITIAL_TELEMETRY);
  const telRef = useRef<GameTelemetry>(INITIAL_TELEMETRY);

  const start = useCallback(() => {
    telRef.current = { ...INITIAL_TELEMETRY };
    setTelemetry({ ...INITIAL_TELEMETRY });
    setState("PLAYING");
  }, []);

  const restart = useCallback(() => {
    telRef.current = { ...INITIAL_TELEMETRY };
    setTelemetry({ ...INITIAL_TELEMETRY });
    setState("START");
  }, []);

  const setGameOver = useCallback(() => {
    setState((prev) => (prev === "PLAYING" ? "GAME_OVER" : prev));
  }, []);

  const tick = useCallback((dt: number, distanceDelta: number) => {
    const t = telRef.current;
    const nextDist = t.distance + distanceDelta;
    const nextEnergy = Math.max(0, t.energy - ENERGY_DRAIN_PER_SEC * dt);

    if (nextDist >= TARGET_DISTANCE) {
      telRef.current = { distance: TARGET_DISTANCE, energy: nextEnergy };
      setTelemetry({ distance: TARGET_DISTANCE, energy: nextEnergy });
      setState("VICTORY");
      return;
    }

    if (nextEnergy <= 0) {
      telRef.current = { distance: nextDist, energy: 0 };
      setTelemetry({ distance: nextDist, energy: 0 });
      setState("GAME_OVER");
      return;
    }

    telRef.current = { distance: nextDist, energy: nextEnergy };
    setTelemetry({ distance: nextDist, energy: nextEnergy });
  }, []);

  return { state, telemetry, start, restart, setGameOver, tick };
}
