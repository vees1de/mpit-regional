import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

const parseCookies = (cookieHeader?: string | null) => {
  const map = new Map<string, string>();
  cookieHeader
    ?.split(";")
    .map((c) => c.trim())
    .forEach((pair) => {
      const [name, ...rest] = pair.split("=");
      if (!name) return;
      map.set(name, rest.join("="));
    });
  return map;
};

export async function GET(request: Request) {
  const cookies = parseCookies(request.headers.get("cookie"));
  const sub = cookies.get("vk_session");

  if (!sub) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const db = await getDb();
  const user = await db.collection("users").findOne(
    { sub },
    {
      projection: {
        access_token: 0,
        refresh_token: 0,
      },
    }
  );

  return NextResponse.json({ user });
}
