import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";
import crypto from "node:crypto";

type VkTokenResponse = {
  access_token: string;
  expires_in: number;
  token_type: string;
  refresh_token?: string;
  id_token?: string;
  scope?: string;
};

type VkUserInfoResponse = {
  sub: string;
  name?: string;
  email?: string;
  picture?: string;
};

@Injectable()
export class VkOAuthService {
  constructor(private readonly config: ConfigService) {}

  createAuthRequest(clientId: string, redirectUri: string, redirect?: string) {
    const verifier = this.createVerifier();
    const challenge = this.createChallenge(verifier);
    const state = this.createState();

    const authUrl = new URL("https://id.vk.ru/authorize");
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("scope", "openid email");
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("code_challenge", challenge);
    authUrl.searchParams.set("code_challenge_method", "S256");

    if (redirect) {
      authUrl.searchParams.set("redirect_state", redirect);
    }

    return {
      authUrl: authUrl.toString(),
      state,
      verifier,
    };
  }

  async exchangeCode(params: {
    code: string;
    verifier: string;
    redirectUri: string;
  }): Promise<VkTokenResponse> {
    const clientSecret = this.config.get<string>("VK_CLIENT_SECRET");
    const clientId = this.config.get<string>("VK_CLIENT_ID");
    if (!clientId || !clientSecret) {
      throw new Error("VK credentials are not configured");
    }

    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code: params.code,
      redirect_uri: params.redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
      code_verifier: params.verifier,
    });

    const { data } = await axios.post<VkTokenResponse>(
      "https://id.vk.com/oauth2/token",
      body.toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    return data;
  }

  async fetchUserInfo(accessToken: string): Promise<VkUserInfoResponse> {
    const { data } = await axios.get<VkUserInfoResponse>(
      "https://id.vk.ru/oauth2/user_info",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return data;
  }

  private createVerifier() {
    return crypto.randomBytes(32).toString("base64url");
  }

  private createChallenge(verifier: string) {
    return crypto.createHash("sha256").update(verifier).digest("base64url");
  }

  private createState() {
    return crypto.randomBytes(16).toString("base64url");
  }
}
