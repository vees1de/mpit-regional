import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";
import { ExchangeCodeDto } from "./dto/exchange-code.dto";
import { VkOAuthService } from "./vk-oauth.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly vkOAuth: VkOAuthService
  ) {}

  startOAuth(redirect?: string) {
    const vkClientId = this.config.get<string>("VK_CLIENT_ID");
    const redirectUri = this.config.get<string>("VK_REDIRECT_URI");
    if (!vkClientId || !redirectUri) {
      throw new Error("VK OAuth is not configured");
    }

    return this.vkOAuth.createAuthRequest(vkClientId, redirectUri, redirect);
  }

  async exchangeCode(dto: ExchangeCodeDto) {
    const redirectUri = this.config.get<string>("VK_REDIRECT_URI");
    if (!redirectUri) {
      throw new Error("VK_REDIRECT_URI is not configured");
    }

    const token = await this.vkOAuth.exchangeCode({
      code: dto.code,
      redirectUri,
      verifier: dto.codeVerifier,
    });

    const userInfo = await this.vkOAuth.fetchUserInfo(token.access_token);

    const user = await this.prisma.user.upsert({
      where: { vkId: userInfo.sub },
      update: {
        vkId: userInfo.sub,
        fullName: userInfo.name ?? null,
        avatarUrl: userInfo.picture ?? null,
        updatedAt: new Date(),
      },
      create: {
        vkId: userInfo.sub,
        fullName: userInfo.name ?? null,
        avatarUrl: userInfo.picture ?? null,
      },
    });

    return {
      user,
      expiresAt: new Date(Date.now() + token.expires_in * 1000),
    };
  }

  async fetchProfile(vkId: string) {
    const user = await this.prisma.user.findUnique({
      where: { vkId },
      include: {
        leaderboardEntries: {
          include: { game: true },
          orderBy: { score: "desc" },
        },
      },
    });

    return { user };
  }
}
