import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from "class-validator";

export class SubmitScoreDto {
  @IsString()
  vkId: string;

  @IsString()
  gameSlug: string;

  @IsInt()
  @Min(0)
  score: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  movesUsed?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxMoves?: number;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}
