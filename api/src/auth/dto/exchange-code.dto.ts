import { IsString, MinLength } from "class-validator";

export class ExchangeCodeDto {
  @IsString()
  code: string;

  @IsString()
  @MinLength(32)
  codeVerifier: string;
}
