import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backendClient";

export async function POST(request: Request) {
  try {
    const cookies = request.headers.get("cookie") ?? "";
    const match = cookies
      .split(";")
      .map((entry) => entry.trim())
      .map((entry) => entry.split("="))
      .find(([name]) => name === "vk_session");

    const vkId = match?.[1];
    if (!vkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = (await request.json()) as {
      score?: number;
      movesUsed?: number;
      maxMoves?: number;
      completed?: boolean;
    };

    const response = await backendFetch<{ scoreId: number }>("/scores", {
      method: "POST",
      body: {
        vkId,
        ...payload,
      },
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("[games/scores]", error);
    return NextResponse.json(
      { error: "Failed to submit score" },
      { status: 500 }
    );
  }
}
