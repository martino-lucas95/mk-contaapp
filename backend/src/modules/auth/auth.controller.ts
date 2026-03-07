// ─── auth.controller.ts ───────────────────────────────────────────────────────
import { Controller, Post, Body, HttpCode, Request, UseGuards, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { IsEmail, IsString, MinLength } from 'class-validator';

class LoginDto {
  @IsEmail() email: string;
  @IsString() @MinLength(6) password: string;
}

class RefreshDto {
  @IsString() refreshToken: string;
}

class CredentialsTokenDto {
  @IsString() @MinLength(6) password: string;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto) {
    const user = await this.authService.validateUser(dto.email, dto.password);
    return this.authService.login(user);
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(@Body() dto: RefreshDto) {
    return this.authService.refreshToken(dto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('credentials-token')
  @HttpCode(200)
  async getCredentialsToken(@Body() dto: CredentialsTokenDto, @Request() req) {
    // Only accessible if already authenticated
    if (!req.user || !req.user.email) throw new UnauthorizedException();
    await this.authService.validateUser(req.user.email, dto.password);
    return {
      token: await this.authService.generateCredentialsToken(req.user.id),
    };
  }
}
