"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import GameCard, { type FeedItem } from "./GameCard";
import { type SwipeDirection } from "@/lib/swipeDetector";

export default function FeedPage() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/feed");
      const data = (await res.json()) as { items: FeedItem[] };
      setItems(data.items);
    };

    void load();
  }, []);

  const handleFeedSwipe = useCallback(
    (direction: SwipeDirection, distance: number) => {
      if (distance < 40) return;
      if (direction !== "up" && direction !== "down") return;

      const container = containerRef.current;
      if (!container) return;

      const viewportHeight = container.clientHeight || window.innerHeight;
      const delta = direction === "up" ? viewportHeight : -viewportHeight;

      container.scrollBy({
        top: delta,
        behavior: "smooth",
      });
    },
    [],
  );

  return (
    <div
      ref={containerRef}
      style={{
        scrollSnapType: "y mandatory",
        overflowY: "scroll",
        height: "100vh",
      }}
    >
      {items.map((item, index) => (
        <div key={`${item.id}-${index}`} style={{ scrollSnapAlign: "start" }}>
          <GameCard item={item} onFeedSwipe={handleFeedSwipe} />
        </div>
      ))}
    </div>
  );
}
