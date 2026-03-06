import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ClientsService, CreateClientDto } from './clients.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../../common/guards/roles.guard';
import { UserRole } from '../users/user.entity';

@Controller('clients')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClientsController {
  constructor(private clientsService: ClientsService) {}

  @Get()
  findAll(@Request() req) {
    return this.clientsService.findAll(req.user.id, req.user.role);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.clientsService.findOne(id, req.user.id, req.user.role);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.CONTADOR)
  create(@Body() dto: CreateClientDto, @Request() req) {
    return this.clientsService.create(dto, req.user.id);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.CONTADOR)
  update(@Param('id') id: string, @Body() dto: Partial<CreateClientDto>, @Request() req) {
    return this.clientsService.update(id, dto, req.user.id, req.user.role);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.CONTADOR)
  deactivate(@Param('id') id: string, @Request() req) {
    return this.clientsService.deactivate(id, req.user.id, req.user.role);
  }
}
