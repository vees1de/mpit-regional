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
        id: "counter-game",
        name: "Counter Clone 2",
        entry: "/games/counter-game/index.js",
      },
      {
        id: "counter-game",
        name: "Counter Clone 3",
        entry: "/games/counter-game/index.js",
      },
    ],
  });
}
