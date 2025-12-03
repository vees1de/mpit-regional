"use client";

import { useEffect, useRef } from "react";

export type FeedItem = {
  id: string;
  name: string;
  entry: string;
};

type GameModule = {
  start: (container: HTMLElement) => void;
  stop?: (container: HTMLElement) => void;
};

export default function GameCard({ item }: { item: FeedItem }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    let isRunning = false;
    let gameModule: GameModule | null = null;

    const observer = new IntersectionObserver(
      async (entries) => {
        const entry = entries[0];
        if (!entry) return;

        const visible = entry.isIntersecting;

        if (visible && !isRunning) {
          isRunning = true;
          // Load game from /public at runtime; ignore bundler resolution.
          gameModule = (await import(
            /* webpackIgnore: true */ item.entry
          )) as GameModule;
          gameModule.start(el);
        } else if (!visible && isRunning) {
          isRunning = false;
          gameModule?.stop?.(el);
        }
      },
      { threshold: 0.5 },
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
      gameModule?.stop?.(el);
    };
  }, [item.entry]);

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
      }}
    >
      <div style={{ marginBottom: "20px", opacity: 0.7 }}>{item.name}</div>
      <div style={{ width: "100%" }} />
    </div>
  );
}
