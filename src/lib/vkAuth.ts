import { createHash, randomBytes } from "crypto";

export type VkTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  id_token?: string;
  scope?: string;
};

export type VkUserInfo = {
  sub: string;
  email?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
};

export function createPkcePair() {
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

export function createState() {
  return randomBytes(16).toString("base64url");
}

export async function fetchVkToken(params: {
  code: string;
  redirectUri: string;
  codeVerifier: string;
}) {
  const clientId = process.env.VK_CLIENT_ID;
  const clientSecret = process.env.VK_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Missing VK_CLIENT_ID or VK_CLIENT_SECRET");
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: params.code,
    redirect_uri: params.redirectUri,
    client_id: clientId,
    client_secret: clientSecret,
    code_verifier: params.codeVerifier,
  });

  const res = await fetch("https://id.vk.ru/oauth2/auth", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`VK token exchange failed: ${res.status} ${text}`);
  }

  return (await res.json()) as VkTokenResponse;
}

export async function fetchVkUserInfo(accessToken: string) {
  const res = await fetch("https://id.vk.ru/oauth2/user_info", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`VK user info failed: ${res.status} ${text}`);
  }

  return (await res.json()) as VkUserInfo;
}
