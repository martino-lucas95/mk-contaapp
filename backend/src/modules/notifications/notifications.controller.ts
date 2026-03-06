import { Controller, Get, Patch, Delete, Param, UseGuards, Request } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private notifService: NotificationsService) {}

  @Get()
  findAll(@Request() req) {
    return this.notifService.findByUser(req.user.id);
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
