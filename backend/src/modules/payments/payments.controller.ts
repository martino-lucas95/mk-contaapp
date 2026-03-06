import { Controller, Get, Post, Put, Delete, Patch, Param, Body, UseGuards, Request } from '@nestjs/common';
import { PaymentsService, CreateBoletoDto } from './payments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../../common/guards/roles.guard';
import { UserRole } from '../users/user.entity';

@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Get('pendientes')
  @Roles(UserRole.ADMIN, UserRole.CONTADOR)
  pendientes(@Request() req) {
    return this.paymentsService.findPendientesByContador(req.user.id);
  }

  @Get('client/:clientId')
  findByClient(@Param('clientId') clientId: string) {
    return this.paymentsService.findByClient(clientId);
  }

  @Post('client/:clientId')
  @Roles(UserRole.ADMIN, UserRole.CONTADOR)
  create(@Param('clientId') clientId: string, @Body() dto: CreateBoletoDto) {
    return this.paymentsService.create(clientId, dto);
  }

  /** Cliente confirma el pago desde su portal */
  @Patch(':id/confirmar-pago')
  confirmarPago(@Param('id') id: string, @Request() req) {
    return this.paymentsService.confirmarPago(id, req.user.id);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.CONTADOR)
  update(@Param('id') id: string, @Body() dto: Partial<CreateBoletoDto>) {
    return this.paymentsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.CONTADOR)
  delete(@Param('id') id: string) {
    return this.paymentsService.delete(id);
  }

  @Post('marcar-vencidos')
  @Roles(UserRole.ADMIN)
  marcarVencidos() {
    return this.paymentsService.marcarVencidos();
  }
}
