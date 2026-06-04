"use client";

import { useCallback, useRef } from "react";
import Scene from "./Scene";
import GameHUD from "./ui/GameHUD";
import { useGameStore } from "@/lib/useGameStore";
import { useKeyboard } from "@/lib/useKeyboard";

export default function SimulationApp() {
  const game = useGameStore();
  const keysRef = useKeyboard();
  const proximityRef = useRef(false);
  const weaponHeatRef = useRef(0);

  const handleShieldBreak = useCallback(() => {
    game.setShield(false);
  }, [game]);

  const handleCollectShield = useCallback(() => {
    game.setShield(true);
  }, [game]);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-black">
      <Scene
        gameState={game.state}
        keysRef={keysRef}
        onCollision={game.setGameOver}
        onTick={game.tick}
        proximityRef={proximityRef}
        hasShield={game.telemetry.hasShield}
        onShieldBreak={handleShieldBreak}
        onAddDistanceBonus={game.addDistanceBonus}
        onAddScore={game.addScore}
        onAddEnergy={game.addEnergy}
        onCollectShield={handleCollectShield}
        weaponHeatRef={weaponHeatRef}
      />
      <GameHUD
        state={game.state}
        telemetry={game.telemetry}
        keysRef={keysRef}
        onStart={game.start}
        onRestart={game.restart}
        proximityRef={proximityRef}
        weaponHeatRef={weaponHeatRef}
      />
    </main>
  );
}
