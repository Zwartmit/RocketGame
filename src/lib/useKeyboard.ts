"use client";

import { useEffect, useRef } from "react";

export interface KeyMap {
  left: boolean;
  right: boolean;
  shoot: boolean;
}

export function useKeyboard(): React.RefObject<KeyMap> {
  const keys = useRef<KeyMap>({ left: false, right: false, shoot: false });

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (e.key === "a" || e.key === "A" || e.key === "ArrowLeft") {
        keys.current.left = true;
      }
      if (e.key === "d" || e.key === "D" || e.key === "ArrowRight") {
        keys.current.right = true;
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
