import { Module } from '@nestjs/common';
import { EmailService } from './email.service.js';
import { NotificacoesService } from './notificacoes.service.js';

@Module({
  providers: [EmailService, NotificacoesService],
  exports: [NotificacoesService],
})
export class NotificacoesModule {}
