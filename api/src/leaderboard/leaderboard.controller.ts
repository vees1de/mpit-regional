import { Controller, Get, Param, Query } from "@nestjs/common";
import { LeaderboardService } from "./leaderboard.service";
import { PaginationDto } from "../common/dto/pagination.dto";

@Controller("leaderboard")
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get(":slug")
  getByGame(@Param("slug") slug: string, @Query() pagination: PaginationDto) {
    return this.leaderboardService.getLeaderboard(slug, pagination);
  }
}
