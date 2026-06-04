"use client";

import { useEffect, useRef } from "react";

export interface KeyMap {
  left: boolean;
  right: boolean;
}

export function useKeyboard(): React.RefObject<KeyMap> {
  const keys = useRef<KeyMap>({ left: false, right: false });
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (e.key === "a" || e.key === "A" || e.key === "ArrowLeft") {
        keys.current.left = true;
      }
      if (e.key === "d" || e.key === "D" || e.key === "ArrowRight") {
        keys.current.right = true;
      }
    };
    const onUp = (e: KeyboardEvent) => {
      if (e.key === "a" || e.key === "A" || e.key === "ArrowLeft") {
        keys.current.left = false;
      }
      if (e.key === "d" || e.key === "D" || e.key === "ArrowRight") {
        keys.current.right = false;
      }
    };

    const TOUCH_THRESHOLD = 10;

    const onTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
      keys.current.left = false;
      keys.current.right = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (touchStartX.current === null) return;
      e.preventDefault();
      const dx = e.touches[0].clientX - touchStartX.current;
      keys.current.left = dx < -TOUCH_THRESHOLD;
      keys.current.right = dx > TOUCH_THRESHOLD;
    };

    const onTouchEnd = () => {
      touchStartX.current = null;
      keys.current.left = false;
      keys.current.right = false;
    };

    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
    };
  }, []);

  return keys;
}
