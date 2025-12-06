import { IsOptional, IsString, Matches } from "class-validator";

export class StartAuthDto {
  @IsOptional()
  @IsString()
  @Matches(/^\/(?!\/)/, {
    message: "redirect must be a relative path starting with '/'",
  })
  redirect?: string;
}
