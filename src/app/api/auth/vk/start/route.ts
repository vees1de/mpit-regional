import { NextResponse } from "next/server";
import { createPkcePair, createState } from "@/lib/vkAuth";

export async function GET(request: Request) {
  const clientId = process.env.VK_CLIENT_ID;
  const redirectUri = process.env.VK_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: "VK OAuth is not configured" },
      { status: 500 }
    );
  }

  const secure = process.env.NODE_ENV === "production";
  const { verifier, challenge } = createPkcePair();
  const state = createState();

  const authUrl = new URL("https://id.vk.ru/authorize");
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("scope", "openid email");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("code_challenge", challenge);
  authUrl.searchParams.set("code_challenge_method", "S256");

  const response = NextResponse.redirect(authUrl.toString());
  response.cookies.set("vk_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 600,
  });
  response.cookies.set("vk_code_verifier", verifier, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 600,
  });

  return response;
}
