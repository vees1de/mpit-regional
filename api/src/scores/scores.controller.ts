import { Body, Controller, Post } from "@nestjs/common";
import { ScoresService } from "./scores.service";
import { SubmitScoreDto } from "./dto/submit-score.dto";

@Controller("scores")
export class ScoresController {
  constructor(private readonly scoresService: ScoresService) {}

  @Post()
  submit(@Body() dto: SubmitScoreDto) {
    return this.scoresService.submitScore(dto);
  }
}
