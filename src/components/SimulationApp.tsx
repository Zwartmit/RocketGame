"use client";

import { useRef } from "react";
import Scene from "./Scene";
import GameHUD from "./ui/GameHUD";
import { useGameStore } from "@/lib/useGameStore";
import { useKeyboard } from "@/lib/useKeyboard";

export default function SimulationApp() {
  const game = useGameStore();
  const keysRef = useKeyboard();
  const proximityRef = useRef(false);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-black">
      <Scene
        gameState={game.state}
        keysRef={keysRef}
        onCollision={game.setGameOver}
        onTick={game.tick}
        proximityRef={proximityRef}
      />
      <GameHUD
        state={game.state}
        telemetry={game.telemetry}
        keysRef={keysRef}
        onStart={game.start}
        onRestart={game.restart}
        proximityRef={proximityRef}
      />
    </main>
  );
}
