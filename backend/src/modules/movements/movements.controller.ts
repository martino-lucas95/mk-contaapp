import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { MovementsService, CreateMovimientoDto } from './movements.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../../common/guards/roles.guard';
import { UserRole } from '../users/user.entity';
import { TipoMovimiento } from './movimiento.entity';

@Controller('movements')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MovementsController {
  constructor(private movService: MovementsService) {}

  /** Listar movimientos de un cliente con filtros opcionales */
  @Get('client/:clientId')
  findByClient(
    @Param('clientId') clientId: string,
    @Query('tipo')  tipo?:  TipoMovimiento,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
  ) {
    return this.movService.findByClient(clientId, { tipo, desde, hasta });
  }

  /** Resumen mensual (IVA, ventas, compras, gastos, resultado) */
  @Get('client/:clientId/resumen/:periodo')
  resumenMensual(
    @Param('clientId') clientId: string,
    @Param('periodo')  periodo:  string,   // "YYYY-MM"
  ) {
    return this.movService.resumenMensual(clientId, periodo);
  }

  /** Resumen de los últimos N meses */
  @Get('client/:clientId/resumen-historico')
  resumenHistorico(
    @Param('clientId') clientId: string,
    @Query('meses') meses?: string,
  ) {
    return this.movService.resumenUltimosMeses(clientId, meses ? parseInt(meses) : 6);
  }

  /** Crear movimiento — el cliente puede cargar sus propias ventas */
  @Post('client/:clientId')
  create(
    @Param('clientId') clientId: string,
    @Body() dto: CreateMovimientoDto,
    @Request() req,
  ) {
    return this.movService.create(clientId, dto);
  }

  /** Actualizar movimiento */
  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.CONTADOR)
  update(@Param('id') id: string, @Body() dto: Partial<CreateMovimientoDto>) {
    return this.movService.update(id, dto);
  }

  /** Eliminar movimiento */
  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.CONTADOR)
  delete(@Param('id') id: string) {
    return this.movService.delete(id);
  }
}
