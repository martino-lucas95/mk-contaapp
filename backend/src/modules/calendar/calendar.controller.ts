import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../../common/guards/roles.guard';
import { UserRole } from '../users/user.entity';
import { TipoVencimiento } from './vencimiento.entity';

@Controller('calendar')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CalendarController {
  constructor(private calendarService: CalendarService) {}

  /** Próximos vencimientos de todos los clientes del contador logueado */
  @Get('proximos')
  findProximos(@Request() req, @Query('dias') dias?: string) {
    return this.calendarService.findProximos(req.user.id, dias ? parseInt(dias) : 30);
  }

  /** Vencimientos de un cliente específico */
  @Get('client/:clientId')
  findByClient(@Param('clientId') clientId: string) {
    return this.calendarService.findByClient(clientId);
  }

  /** Preview de vencimientos generados para un cliente (sin persistir) */
  @Get('client/:clientId/preview')
  preview(@Param('clientId') clientId: string, @Query('year') year?: string) {
    return this.calendarService.previewParaCliente(clientId, year ? parseInt(year) : undefined);
  }

  /** Generar y persistir vencimientos anuales para un cliente */
  @Post('client/:clientId/generar')
  @Roles(UserRole.ADMIN, UserRole.CONTADOR)
  generar(@Param('clientId') clientId: string, @Query('year') year?: string) {
    return this.calendarService.generarParaCliente(clientId, year ? parseInt(year) : undefined);
  }

  /** Generar para todos los clientes del contador */
  @Post('generar-todos')
  @Roles(UserRole.ADMIN, UserRole.CONTADOR)
  generarTodos(@Request() req, @Query('year') year?: string) {
    return this.calendarService.generarParaTodosLosClientes(
      req.user.id,
      year ? parseInt(year) : undefined,
    );
  }

  /** Marcar vencimiento como completado */
  @Patch(':id/completar')
  completar(@Param('id') id: string) {
    return this.calendarService.completar(id);
  }

  /** Crear vencimiento personalizado */
  @Post('client/:clientId/personalizado')
  @Roles(UserRole.ADMIN, UserRole.CONTADOR)
  crearPersonalizado(
    @Param('clientId') clientId: string,
    @Body() body: {
      tipo: TipoVencimiento;
      descripcion: string;
      fechaVencimiento: string;
      periodo?: string;
      notas?: string;
    },
  ) {
    return this.calendarService.crearPersonalizado(clientId, body);
  }
}
