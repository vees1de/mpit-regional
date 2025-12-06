import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { PaginationDto } from "../common/dto/pagination.dto";

@Injectable()
export class LeaderboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getLeaderboard(slug: string, pagination: PaginationDto) {
    const game = await this.prisma.game.findUnique({
      where: { slug },
    });
    if (!game) {
      throw new NotFoundException("Game not found");
    }

    const [total, entries] = await Promise.all([
      this.prisma.leaderboardEntry.count({
        where: { gameId: game.id },
      }),
      this.prisma.leaderboardEntry.findMany({
        where: { gameId: game.id },
        orderBy: { score: "desc" },
        skip: pagination.skip,
        take: pagination.take,
        include: { user: true },
      }),
    ]);

    return {
      game: {
        slug: game.slug,
        title: game.title,
      },
      total,
      entries: entries.map((entry, index) => ({
        position: (pagination.skip ?? 0) + index + 1,
        score: entry.score,
        vkId: entry.user.vkId,
        fullName: entry.user.fullName,
      })),
    };
  }
}
