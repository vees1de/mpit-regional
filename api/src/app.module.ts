import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./auth/auth.module";
import { FeedModule } from "./feed/feed.module";
import { LeaderboardModule } from "./leaderboard/leaderboard.module";
import { ScoresModule } from "./scores/scores.module";
import { PrismaModule } from "./prisma/prisma.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    FeedModule,
    LeaderboardModule,
    ScoresModule,
  ],
})
export class AppModule {}
