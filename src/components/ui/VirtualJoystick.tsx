"use client";

import { useRef, useCallback, type RefObject } from "react";
import type { KeyMap } from "@/lib/useKeyboard";

interface VirtualJoystickProps {
  keysRef: RefObject<KeyMap>;
}

const RADIUS = 50;

export default function VirtualJoystick({ keysRef }: VirtualJoystickProps) {
  const baseRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const touchIdRef = useRef<number | null>(null);
  const centerRef = useRef({ x: 0, y: 0 });

  const resetKnob = useCallback(() => {
    if (knobRef.current) {
      knobRef.current.style.transform = "translate(-50%,-50%)";
    }
    keysRef.current.joyX = 0;
    keysRef.current.joyY = 0;
    touchIdRef.current = null;
  }, [keysRef]);

  const handleMove = useCallback((clientX: number, clientY: number) => {
    const dx = clientX - centerRef.current.x;
    const dy = clientY - centerRef.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const clamped = Math.min(dist, RADIUS);
    const angle = Math.atan2(dy, dx);
    const nx = Math.cos(angle) * clamped;
    const ny = Math.sin(angle) * clamped;

    if (knobRef.current) {
      knobRef.current.style.transform = `translate(calc(-50% + ${nx}px), calc(-50% + ${ny}px))`;
    }

    keysRef.current.joyX = nx / RADIUS;
    keysRef.current.joyY = -ny / RADIUS; // Invert Y: touch down = negative
  }, [keysRef]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (touchIdRef.current !== null) return;
    const touch = e.changedTouches[0];
    touchIdRef.current = touch.identifier;
    const rect = baseRef.current?.getBoundingClientRect();
    if (rect) {
      centerRef.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    }
    handleMove(touch.clientX, touch.clientY);
  }, [handleMove]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier === touchIdRef.current) {
        handleMove(t.clientX, t.clientY);
        break;
      }
    }
  }, [handleMove]);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchIdRef.current) {
        resetKnob();
        break;
      }
    }
  }, [resetKnob]);

  return (
    <div
      ref={baseRef}
      className="fixed bottom-8 left-8 z-40 md:hidden touch-none"
      style={{ width: RADIUS * 2 + 20, height: RADIUS * 2 + 20 }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
    >
      {/* Base ring */}
      <div
        className="absolute inset-0 rounded-full border-2 border-cyan-400/30 bg-black/30 backdrop-blur-sm"
      />
      {/* Knob */}
      <div
        ref={knobRef}
        className="absolute top-1/2 left-1/2 w-12 h-12 rounded-full bg-cyan-400/40 border border-cyan-400/60 shadow-[0_0_12px_rgba(34,211,238,0.4)]"
        style={{ transform: "translate(-50%,-50%)" }}
      />
    </div>
  );
}
