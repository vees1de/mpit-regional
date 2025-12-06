import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { StartAuthDto } from "./dto/start-auth.dto";
import { ExchangeCodeDto } from "./dto/exchange-code.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("vk/start")
  start(@Body() dto: StartAuthDto) {
    return this.authService.startOAuth(dto.redirect);
  }

  @Post("vk/exchange")
  exchange(@Body() dto: ExchangeCodeDto) {
    return this.authService.exchangeCode(dto);
  }

  @Get("me/:vkId")
  getProfile(@Param("vkId") vkId: string) {
    return this.authService.fetchProfile(vkId);
  }
}
