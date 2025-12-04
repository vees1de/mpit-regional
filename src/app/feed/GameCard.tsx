"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createSwipeDetector, type SwipeDirection } from "@/lib/swipeDetector";

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
  const gameSurfaceRef = useRef<HTMLDivElement | null>(null);
  const swipeZoneRef = useRef<HTMLDivElement | null>(null);
  const gameModuleRef = useRef<GameModule | null>(null);
  const isActiveRef = useRef(false);
  const [handlesGameSwipe, setHandlesGameSwipe] = useState(false);

  const triggerFeedScroll = useCallback(
    (direction: "up" | "down", distance?: number) => {
      const resolvedDistance =
        distance ??
        Math.max(
          ref.current?.clientHeight ?? 0,
          typeof window !== "undefined" ? window.innerHeight : 0,
          120,
        );

      onFeedSwipe(direction, resolvedDistance);
    },
    [onFeedSwipe],
  );

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    const getSurface = () => gameSurfaceRef.current ?? el;

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
            const entryUrl = new URL(
              item.entry,
              typeof window !== "undefined" ? window.location.origin : "",
            ).toString();
            const module = (await import(
              /* webpackIgnore: true */ entryUrl
            )) as GameModule;
            if (destroyed) return;
            gameModuleRef.current = module;
            setHandlesGameSwipe(Boolean(module.gameConfig?.handlesSwipe));
            module.start?.(getSurface());
          })().catch(() => {
            isRunning = false;
          });
        } else if (!visible && isRunning) {
          isRunning = false;
          gameModuleRef.current?.stop?.(getSurface());
          gameModuleRef.current = null;
          setHandlesGameSwipe(false);
        }
      },
      { threshold: 0.5 },
    );

    observer.observe(el);

    return () => {
      destroyed = true;
      observer.disconnect();
      gameModuleRef.current?.stop?.(getSurface());
      gameModuleRef.current = null;
      setHandlesGameSwipe(false);
      isActiveRef.current = false;
    };
  }, [item.entry]);

  useEffect(() => {
    if (!handlesGameSwipe) return undefined;

    const surface = gameSurfaceRef.current ?? ref.current;
    if (!surface) return undefined;

    return createSwipeDetector(
      surface,
      ({ direction }) => {
        if (!isActiveRef.current) return;
        gameModuleRef.current?.onSwipe?.(direction);
      },
      {
        shouldBlockScroll: () => true,
      },
    );
  }, [handlesGameSwipe]);

  useEffect(() => {
    const swipeZone = swipeZoneRef.current;
    if (!swipeZone) return undefined;

    return createSwipeDetector(
      swipeZone,
      ({ direction, distance }) => {
        if (direction !== "up" && direction !== "down") return;
        triggerFeedScroll(direction, Math.max(distance, 60));
      },
      {
        shouldBlockScroll: () => true,
      },
    );
  }, [triggerFeedScroll]);

  return (
    <div
      ref={ref}
      style={{
        width: "100%",
        height: "100dvh",
        display: "flex",
        justifyContent: "flex-start",
        alignItems: "center",
        background: "#111",
        color: "white",
        flexDirection: "column",
        fontFamily: "sans-serif",
        borderBottom: "2px solid #000",
        position: "relative",
        overflow: "hidden",
        paddingBottom: "140px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          marginBottom: "12px",
          opacity: 0.85,
          letterSpacing: "0.04em",
          fontWeight: 600,
          textTransform: "uppercase",
          paddingTop: "12px",
        }}
      >
        {item.name}
      </div>

      <div
        ref={gameSurfaceRef}
        style={{
          width: "100%",
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      />

      <div
        ref={swipeZoneRef}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: "140px",
          background:
            "linear-gradient(180deg, rgba(17,17,17,0.4) 0%, rgba(17,17,17,0.95) 45%, rgba(17,17,17,1) 100%)",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: "10px",
          padding: "12px 16px 18px",
          touchAction: "none",
          backdropFilter: "blur(6px)",
        }}
      >
        <div
          style={{
            fontSize: "12px",
            opacity: 0.8,
            textAlign: "center",
            letterSpacing: "0.03em",
          }}
        >
          Свайпай снизу или жми кнопки для перехода
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: "12px",
          }}
        >
          <button
            type="button"
            onClick={() => triggerFeedScroll("up")}
            style={{
              background: "#1f8efa",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              padding: "12px 14px",
              fontSize: "14px",
              fontWeight: 700,
              letterSpacing: "0.02em",
            }}
          >
            Вверх
          </button>
          <button
            type="button"
            onClick={() => triggerFeedScroll("down")}
            style={{
              background: "#0bcf83",
              color: "#0b1c0f",
              border: "none",
              borderRadius: "10px",
              padding: "12px 14px",
              fontSize: "14px",
              fontWeight: 700,
              letterSpacing: "0.02em",
            }}
          >
            Вниз
          </button>
        </div>
      </div>
    </div>
  );
}
