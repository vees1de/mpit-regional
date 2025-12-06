import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { VkOAuthService } from "./vk-oauth.service";

@Module({
  providers: [AuthService, VkOAuthService],
  controllers: [AuthController],
})
export class AuthModule {}
