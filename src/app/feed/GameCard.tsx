"use client";

import { useEffect, useRef } from "react";
import {
  createSwipeDetector,
  type SwipeDirection,
} from "@/lib/swipeDetector";

export type FeedItem = {
  id: string;
  name: string;
  entry: string;
};

type GameModule = {
  start?: (container: HTMLElement) => void;
  stop?: (container: HTMLElement) => void;
  onSwipe?: (direction: SwipeDirection) => void;
  gameConfig?: {
    handlesSwipe?: boolean;
    swipeDirections?: SwipeDirection[];
  };
};

type Props = {
  item: FeedItem;
  onFeedSwipe: (direction: SwipeDirection, distance: number) => void;
};

export default function GameCard({ item, onFeedSwipe }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const gameModuleRef = useRef<GameModule | null>(null);
  const isActiveRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    let isRunning = false;
    let destroyed = false;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;

        const visible = entry.isIntersecting;
        isActiveRef.current = visible;

        if (visible && !isRunning) {
          isRunning = true;
          (async () => {
            const module = (await import(
              /* webpackIgnore: true */ item.entry
            )) as GameModule;
            if (destroyed) return;
            gameModuleRef.current = module;
            module.start?.(el);
          })().catch(() => {
            isRunning = false;
          });
        } else if (!visible && isRunning) {
          isRunning = false;
          gameModuleRef.current?.stop?.(el);
          gameModuleRef.current = null;
        }
      },
      { threshold: 0.5 },
    );

    observer.observe(el);

    return () => {
      destroyed = true;
      observer.disconnect();
      gameModuleRef.current?.stop?.(el);
      gameModuleRef.current = null;
      isActiveRef.current = false;
    };
  }, [item.entry]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    const cleanup = createSwipeDetector(
      el,
      ({ direction, distance }) => {
        const game = gameModuleRef.current;
        const gameHandlesSwipe = Boolean(game?.gameConfig?.handlesSwipe);

        if (isActiveRef.current && gameHandlesSwipe) {
          game?.onSwipe?.(direction);
          return;
        }

        if (distance < 40) return;
        onFeedSwipe(direction, distance);
      },
      {
        shouldBlockScroll: () =>
          isActiveRef.current &&
          Boolean(gameModuleRef.current?.gameConfig?.handlesSwipe),
      },
    );

    return cleanup;
  }, [onFeedSwipe]);

  return (
    <div
      ref={ref}
      style={{
        width: "100%",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#111",
        color: "white",
        flexDirection: "column",
        fontFamily: "sans-serif",
        borderBottom: "2px solid #000",
        touchAction: "none",
      }}
    >
      <div style={{ marginBottom: "20px", opacity: 0.7 }}>{item.name}</div>
      <div style={{ width: "100%" }} />
    </div>
  );
}
