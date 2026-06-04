"use client";

import { useCallback, useRef, useState } from "react";
import {
  type GameState,
  type GameTelemetry,
  MAX_ENERGY,
  TARGET_DISTANCE,
  ENERGY_DRAIN_PER_SEC,
  HEAT_COOLDOWN_PER_SEC,
} from "./types";

export interface GameStore {
  state: GameState;
  telemetry: GameTelemetry;
  start: () => void;
  restart: () => void;
  setGameOver: () => void;
  tick: (dt: number, distanceDelta: number) => void;
  addDistanceBonus: (amount: number) => void;
  addEnergy: (amount: number) => void;
  setShield: (on: boolean) => void;
  addScore: (pts: number) => void;
  setWeaponHeat: (heat: number) => void;
}

const INITIAL_TELEMETRY: GameTelemetry = {
  distance: 0,
  energy: MAX_ENERGY,
  weaponHeat: 0,
  score: 0,
  hasShield: false,
};

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
    const nextHeat = Math.max(0, t.weaponHeat - HEAT_COOLDOWN_PER_SEC * dt);

    if (nextDist >= TARGET_DISTANCE) {
      telRef.current = { ...t, distance: TARGET_DISTANCE, energy: nextEnergy, weaponHeat: nextHeat };
      setTelemetry(telRef.current);
      setState("VICTORY");
      return;
    }

    if (nextEnergy <= 0) {
      telRef.current = { ...t, distance: nextDist, energy: 0, weaponHeat: nextHeat };
      setTelemetry(telRef.current);
      setState("GAME_OVER");
      return;
    }

    telRef.current = { ...t, distance: nextDist, energy: nextEnergy, weaponHeat: nextHeat };
    setTelemetry(telRef.current);
  }, []);

  const addDistanceBonus = useCallback((amount: number) => {
    const t = telRef.current;
    telRef.current = { ...t, distance: t.distance + amount };
    setTelemetry(telRef.current);
  }, []);

  const addEnergy = useCallback((amount: number) => {
    const t = telRef.current;
    telRef.current = { ...t, energy: Math.min(MAX_ENERGY, t.energy + amount) };
    setTelemetry(telRef.current);
  }, []);

  const setShield = useCallback((on: boolean) => {
    const t = telRef.current;
    telRef.current = { ...t, hasShield: on };
    setTelemetry(telRef.current);
  }, []);

  const addScore = useCallback((pts: number) => {
    const t = telRef.current;
    telRef.current = { ...t, score: t.score + pts };
    setTelemetry(telRef.current);
  }, []);

  const setWeaponHeat = useCallback((heat: number) => {
    const t = telRef.current;
    telRef.current = { ...t, weaponHeat: heat };
    setTelemetry(telRef.current);
  }, []);

  return {
    state, telemetry, start, restart, setGameOver, tick,
    addDistanceBonus, addEnergy, setShield, addScore, setWeaponHeat,
  };
}
