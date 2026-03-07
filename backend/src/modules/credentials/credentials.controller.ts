import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Request, Headers, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { CredentialsService, CreateCredentialDto } from './credentials.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../../common/guards/roles.guard';
import { UserRole } from '../users/user.entity';

@Controller('credentials')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.CONTADOR)  // Clientes nunca acceden
export class CredentialsController {
  constructor(
    private credService: CredentialsService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) { }

  /** Listar credenciales de un cliente — sin mostrar passwords */
  @Get('client/:clientId')
  findByClient(@Param('clientId') clientId: string, @Request() req) {
    return this.credService.findByClient(clientId, req.user.role);
  }

  /**
   * Obtener una credencial con su password desencriptada.
   * Endpoint separado y explícito — requiere acción consciente del contador.
   */
  @Get(':id/reveal')
  async reveal(@Param('id') id: string, @Request() req, @Headers('x-credentials-token') credToken: string) {
    if (!credToken) throw new UnauthorizedException('Token de credenciales requerido');

    try {
      const payload = this.jwtService.verify(credToken, {
        secret: this.configService.get('JWT_SECRET'),
      });
      if (payload.scope !== 'credentials_reveal' || payload.sub !== req.user.id) {
        throw new UnauthorizedException('Token inválido para esta acción');
      }
    } catch {
      throw new UnauthorizedException('Token de credenciales inválido o expirado');
    }

    return this.credService.findOneWithPassword(id, req.user.role);
  }

  @Post('client/:clientId')
  create(
    @Param('clientId') clientId: string,
    @Body() dto: CreateCredentialDto,
    @Request() req,
  ) {
    return this.credService.create(clientId, dto, req.user.role);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateCredentialDto>,
    @Request() req,
  ) {
    return this.credService.update(id, dto, req.user.role);
  }

  @Delete(':id')
  deactivate(@Param('id') id: string, @Request() req) {
    return this.credService.deactivate(id, req.user.role);
  }
}
