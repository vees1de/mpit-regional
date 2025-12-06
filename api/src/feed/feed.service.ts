import { Injectable } from "@nestjs/common";
import { GameType, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

type FeedGame = {
  slug: string;
  title: string;
  description?: string | null;
  coverUrl?: string | null;
  entryUrl: string;
  maxMoves?: number | null;
  gameType?: GameType | null;
  topPlayers: Array<{
    vkId: string;
    fullName?: string | null;
    score: number;
  }>;
};

@Injectable()
export class FeedService {
  private readonly defaultGames: Array<
    Prisma.GameCreateInput & { leaderboardEntries?: undefined }
  > = [
    {
      slug: "match3",
      title: "Match 3",
      description: "Собери комбинации из 3 и более фигур",
      entryUrl: "/games/match3/index.js",
      maxMoves: 10,
      gameType: GameType.MATCH3,
    },
    {
      slug: "mini-2048",
      title: "Mini 2048",
      description: "Классическая 2048 в компактном виде",
      entryUrl: "/games/mini-2048/index.js",
      gameType: GameType.GAME2048,
    },
  ];

  constructor(private readonly prisma: PrismaService) {}

  async getFeed(): Promise<{ items: FeedGame[] }> {
    await this.ensureDefaultGames();

    const games = await this.prisma.game.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        leaderboardEntries: {
          orderBy: { score: "desc" },
          take: 5,
          include: {
            user: true,
          },
        },
      },
    });

    const items: FeedGame[] = games.map((game) => ({
      slug: game.slug,
      title: game.title,
      description: game.description,
      coverUrl: game.coverUrl,
      entryUrl: game.entryUrl,
      maxMoves: game.maxMoves,
      gameType: game.gameType,
      topPlayers: game.leaderboardEntries.map((entry) => ({
        vkId: entry.user.vkId,
        fullName: entry.user.fullName,
        score: entry.score,
      })),
    }));

    return { items };
  }

  private async ensureDefaultGames() {
    await Promise.all(
      this.defaultGames.map((game) =>
        this.prisma.game.upsert({
          where: { slug: game.slug },
          update: {
            title: game.title,
            description: game.description,
            entryUrl: game.entryUrl,
            maxMoves: game.maxMoves,
            gameType: game.gameType,
          },
          create: game,
        })
      )
    );
  }
}
