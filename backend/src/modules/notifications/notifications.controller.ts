import { Controller, Get, Post, Body, Patch, Delete, Param, UseGuards, Request } from '@nestjs/common';
import { NotificationsService, CreateNotificationDto } from './notifications.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../../common/guards/roles.guard';
import { UserRole } from '../users/user.entity';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private notifService: NotificationsService) { }

  @Get()
  findAll(@Request() req) {
    return this.notifService.findByUser(req.user.id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.CONTADOR)
  createManual(@Body() dto: CreateNotificationDto) {
    return this.notifService.createManual(dto);
  }

  @Get('unread-count')
  unreadCount(@Request() req) {
    return this.notifService.countUnread(req.user.id);
  }

  @Patch(':id/read')
  markAsRead(@Param('id') id: string) {
    return this.notifService.markAsRead(id);
  }

  @Patch('read-all')
  markAllAsRead(@Request() req) {
    return this.notifService.markAllAsRead(req.user.id);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.notifService.delete(id);
  }
}
