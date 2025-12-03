"use client";

import { useEffect, useState } from "react";
import GameCard, { type FeedItem } from "./GameCard";

export default function FeedPage() {
  const [items, setItems] = useState<FeedItem[]>([]);

  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/feed");
      const data = (await res.json()) as { items: FeedItem[] };
      setItems(data.items);
    };

    void load();
  }, []);

  return (
    <div
      style={{
        scrollSnapType: "y mandatory",
        overflowY: "scroll",
        height: "100vh",
      }}
    >
      {items.map((item, index) => (
        <div key={`${item.id}-${index}`} style={{ scrollSnapAlign: "start" }}>
          <GameCard item={item} />
        </div>
      ))}
    </div>
  );
}
