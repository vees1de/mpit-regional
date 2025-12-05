import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { fetchVkToken, fetchVkUserInfo } from "@/lib/vkAuth";

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
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const returnedState = searchParams.get("state");

  const redirectUri = process.env.VK_REDIRECT_URI;
  if (!redirectUri) {
    return NextResponse.json(
      { error: "VK_REDIRECT_URI is not configured" },
      { status: 500 }
    );
  }

  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  const cookies = parseCookies(request.headers.get("cookie"));

  const storedState = cookies.get("vk_state");
  if (!storedState || returnedState !== storedState) {
    return NextResponse.json({ error: "Invalid state" }, { status: 400 });
  }

  const codeVerifier = cookies.get("vk_code_verifier");
  if (!codeVerifier) {
    return NextResponse.json(
      { error: "Missing code verifier" },
      { status: 400 }
    );
  }

  try {
    const token = await fetchVkToken({
      code,
      redirectUri,
      codeVerifier,
    });

    const userInfo = await fetchVkUserInfo(token.access_token);

    const expiresAt = Date.now() + token.expires_in * 1000;
    const db = await getDb();
    await db.collection("users").updateOne(
      { sub: userInfo.sub },
      {
        $set: {
          sub: userInfo.sub,
          email: userInfo.email,
          name: userInfo.name,
          given_name: userInfo.given_name,
          family_name: userInfo.family_name,
          picture: userInfo.picture,
          access_token: token.access_token,
          refresh_token: token.refresh_token,
          expires_at: expiresAt,
          updated_at: new Date(),
        },
        $setOnInsert: {
          created_at: new Date(),
        },
      },
      { upsert: true }
    );

    const redirectTarget = new URL("/", request.url);
    const secure = process.env.NODE_ENV === "production";
    const response = NextResponse.redirect(redirectTarget);
    response.cookies.set("vk_session", userInfo.sub, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    response.cookies.delete("vk_state");
    response.cookies.delete("vk_code_verifier");

    return response;
  } catch (error) {
    console.error("[vk_callback]", error);
    return NextResponse.json(
      { error: "VK authorization failed" },
      { status: 500 }
    );
  }
}
