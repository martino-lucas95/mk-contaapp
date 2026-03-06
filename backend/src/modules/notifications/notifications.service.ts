import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, TipoNotificacion } from './notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification) private notifRepo: Repository<Notification>,
  ) {}

  async findByUser(usuarioId: string): Promise<Notification[]> {
    return this.notifRepo.find({
      where: { usuarioId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async countUnread(usuarioId: string): Promise<number> {
    return this.notifRepo.count({ where: { usuarioId, leido: false } });
  }

  async create(dto: {
    usuarioId: string;
    tipo: TipoNotificacion;
    mensaje: string;
    referenciaId?: string;
    referenciaTipo?: string;
  }): Promise<Notification> {
    const n = this.notifRepo.create(dto);
    return this.notifRepo.save(n);
  }

  async markAsRead(id: string): Promise<void> {
    await this.notifRepo.update(id, { leido: true });
  }

  async markAllAsRead(usuarioId: string): Promise<void> {
    await this.notifRepo.update({ usuarioId, leido: false }, { leido: true });
  }

  async delete(id: string): Promise<void> {
    await this.notifRepo.delete(id);
  }

  /** Crear notificación de vencimiento próximo para el contador */
  async notificarVencimientoProximo(
    contadorId: string,
    tipoVenc: string,
    clienteNombre: string,
    diasRestantes: number,
  ): Promise<void> {
    const urgente = diasRestantes <= 3;
    await this.create({
      usuarioId:      contadorId,
      tipo:           TipoNotificacion.VENCIMIENTO_PROXIMO,
      mensaje:        `${urgente ? '🚨 URGENTE' : '⏰'} ${tipoVenc} de ${clienteNombre} vence en ${diasRestantes} día${diasRestantes !== 1 ? 's' : ''}.`,
      referenciaTipo: 'vencimiento',
    });
  }

  /** Notificar al contador que un cliente confirmó un pago */
  async notificarPagoConfirmado(
    contadorId: string,
    clienteNombre: string,
    tipoImpuesto: string,
    boletoId: string,
  ): Promise<void> {
    await this.create({
      usuarioId:      contadorId,
      tipo:           TipoNotificacion.PAGO_CONFIRMADO,
      mensaje:        `✅ ${clienteNombre} confirmó el pago de ${tipoImpuesto}.`,
      referenciaId:   boletoId,
      referenciaTipo: 'boleto',
    });
  }
}
