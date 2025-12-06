import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { GameType } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { SubmitScoreDto } from "./dto/submit-score.dto";

@Injectable()
export class ScoresService {
  constructor(private readonly prisma: PrismaService) {}

  async submitScore(dto: SubmitScoreDto) {
    const user = await this.prisma.user.findUnique({
      where: { vkId: dto.vkId },
    });
    if (!user) {
      throw new NotFoundException("User not found");
    }

    const game = await this.prisma.game.findUnique({
      where: { slug: dto.gameSlug },
    });
    if (!game) {
      throw new NotFoundException("Game not found");
    }

    this.assertScoreRequirements(game.gameType, game.maxMoves, dto);

    const result = await this.prisma.$transaction(async (tx) => {
      const scoreRecord = await tx.gameScore.create({
        data: {
          score: dto.score,
          movesUsed: dto.movesUsed,
          maxMoves: dto.maxMoves ?? game.maxMoves,
          completed: dto.completed ?? false,
          userId: user.id,
          gameId: game.id,
          metadata: {
            submittedAt: new Date().toISOString(),
          },
        },
      });

      const existingEntry = await tx.leaderboardEntry.findUnique({
        where: { gameId_userId: { gameId: game.id, userId: user.id } },
      });

      if (!existingEntry || existingEntry.score < dto.score) {
        const betterScores = await tx.leaderboardEntry.count({
          where: { gameId: game.id, score: { gt: dto.score } },
        });

        await tx.leaderboardEntry.upsert({
          where: { gameId_userId: { gameId: game.id, userId: user.id } },
          update: {
            score: dto.score,
            position: betterScores + 1,
          },
          create: {
            score: dto.score,
            position: betterScores + 1,
            gameId: game.id,
            userId: user.id,
          },
        });
      }

      return scoreRecord;
    });

    return {
      scoreId: result.id,
      score: result.score,
    };
  }

  private assertScoreRequirements(
    gameType: GameType | null,
    maxMoves: number | null | undefined,
    dto: SubmitScoreDto
  ) {
    if (dto.score < 0) {
      throw new BadRequestException("Score must be non-negative");
    }

    if (gameType === GameType.MATCH3) {
      if (!maxMoves || maxMoves <= 0) {
        throw new BadRequestException("Game is not configured for Match3");
      }
      if (dto.movesUsed === undefined || dto.movesUsed < maxMoves) {
        throw new BadRequestException("All moves must be used in Match3");
      }
      if (!dto.completed) {
        throw new BadRequestException("Match3 session must be completed");
      }
    }

    if (gameType === GameType.GAME2048) {
      if (!dto.completed) {
        throw new BadRequestException("2048 session must end before submit");
      }
    }
  }
}
