import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    items: [
      {
        id: "match3",
        name: "Match-3",
        entry: "/games/match3/index.js",
      },
      {
        id: "counter-game",
        name: "Counter",
        entry: "/games/counter-game/index.js",
      },
      {
        id: "mini-2048",
        name: "Mini 2048",
        entry: "/games/mini-2048/index.js",
      },
      {
        id: "counter-game-clone",
        name: "Counter Clone 2",
        entry: "/games/counter-game/index.js",
      },
    ],
  });
}
