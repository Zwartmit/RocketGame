"use client";

import { useEffect, useRef } from "react";

export interface KeyMap {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  shoot: boolean;
  /** Joystick normalized X: -1 (left) to 1 (right), 0 = center */
  joyX: number;
  /** Joystick normalized Y: -1 (down) to 1 (up), 0 = center */
  joyY: number;
}

export function useKeyboard(): React.RefObject<KeyMap> {
  const keys = useRef<KeyMap>({
    left: false, right: false, up: false, down: false, shoot: false,
    joyX: 0, joyY: 0,
  });

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (e.key === "a" || e.key === "A" || e.key === "ArrowLeft") {
        keys.current.left = true;
      }
      if (e.key === "d" || e.key === "D" || e.key === "ArrowRight") {
        keys.current.right = true;
      }
      if (e.key === "w" || e.key === "W" || e.key === "ArrowUp") {
        keys.current.up = true;
      }
      if (e.key === "s" || e.key === "S" || e.key === "ArrowDown") {
        keys.current.down = true;
      }
      if (e.key === " ") {
        e.preventDefault();
        keys.current.shoot = true;
      }
    };
    const onUp = (e: KeyboardEvent) => {
      if (e.key === "a" || e.key === "A" || e.key === "ArrowLeft") {
        keys.current.left = false;
      }
      if (e.key === "d" || e.key === "D" || e.key === "ArrowRight") {
        keys.current.right = false;
      }
      if (e.key === "w" || e.key === "W" || e.key === "ArrowUp") {
        keys.current.up = false;
      }
      if (e.key === "s" || e.key === "S" || e.key === "ArrowDown") {
        keys.current.down = false;
      }
      if (e.key === " ") {
        keys.current.shoot = false;
      }
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, []);

  return keys;
}
