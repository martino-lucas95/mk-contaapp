import { Controller, Get, Post, Body, Req, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { WebauthnService } from './webauthn.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthService } from '../../modules/auth/auth.service';

@Controller('auth/webauthn')
export class WebauthnController {
    constructor(
        private readonly webauthnService: WebauthnService,
        private readonly authService: AuthService,
    ) { }

    @UseGuards(JwtAuthGuard)
    @Get('register/options')
    async getRegistrationOptions(@Req() req) {
        return this.webauthnService.getRegistrationOptions(req.user);
    }

    @UseGuards(JwtAuthGuard)
    @Post('register/verify')
    async verifyRegistration(@Req() req, @Body() body: any) {
        const verified = await this.webauthnService.verifyRegistration(req.user, body);
        if (!verified) {
            throw new HttpException('Registration failed', HttpStatus.BAD_REQUEST);
        }
        return { success: true };
    }

    @UseGuards(JwtAuthGuard)
    @Get('login/options')
    async getAuthenticationOptions(@Req() req) {
        return this.webauthnService.getAuthenticationOptions(req.user);
    }

    @UseGuards(JwtAuthGuard)
    @Post('login/verify')
    async verifyAuthentication(@Req() req, @Body() body: any) {
        const verified = await this.webauthnService.verifyAuthentication(req.user, body);
        if (!verified) {
            throw new HttpException('Authentication failed', HttpStatus.UNAUTHORIZED);
        }

        // Si la autenticación biométrica es correcta, generamos el token corto para ver credenciales
        const token = await this.authService.generateCredentialsToken(req.user);
        return { token };
    }
}
