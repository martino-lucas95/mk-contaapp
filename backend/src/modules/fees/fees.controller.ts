import { Controller, Get, Post, Put, Delete, Patch, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { FeesService, CreateHonorarioDto } from './fees.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../../common/guards/roles.guard';
import { UserRole } from '../users/user.entity';
import { FormaPago } from './honorario.entity';

@Controller('fees')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FeesController {
  constructor(private feesService: FeesService) {}

  /** Resumen global para el dashboard del contador */
  @Get('resumen')
  @Roles(UserRole.ADMIN, UserRole.CONTADOR)
  resumen(@Request() req, @Query('periodo') periodo?: string) {
    return this.feesService.resumenPorContador(req.user.id, periodo);
  }

  /** Historial de honorarios de un cliente */
  @Get('client/:clientId')
  findByClient(@Param('clientId') clientId: string) {
    return this.feesService.findByClient(clientId);
  }

  /** Crear honorario de un período */
  @Post('client/:clientId')
  @Roles(UserRole.ADMIN, UserRole.CONTADOR)
  create(@Param('clientId') clientId: string, @Body() dto: CreateHonorarioDto) {
    return this.feesService.create(clientId, dto);
  }

  /** Registrar pago (parcial o total) */
  @Patch(':id/pago')
  @Roles(UserRole.ADMIN, UserRole.CONTADOR)
  registrarPago(
    @Param('id') id: string,
    @Body() body: { montoCobrado: number; fechaCobro: string; formaPago: FormaPago; notas?: string },
  ) {
    return this.feesService.registrarPago(id, body);
  }

  /** Actualizar honorario */
  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.CONTADOR)
  update(@Param('id') id: string, @Body() dto: Partial<CreateHonorarioDto>) {
    return this.feesService.update(id, dto);
  }

  /** Eliminar honorario */
  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.CONTADOR)
  delete(@Param('id') id: string) {
    return this.feesService.delete(id);
  }

  /** Marcar vencidos (útil para un endpoint admin/cron) */
  @Post('marcar-vencidos')
  @Roles(UserRole.ADMIN)
  marcarVencidos(@Query('dias') dias?: string) {
    return this.feesService.marcarVencidos(dias ? parseInt(dias) : 30);
  }
}
