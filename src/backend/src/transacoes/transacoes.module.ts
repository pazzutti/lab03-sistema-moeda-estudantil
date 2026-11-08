import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificacoesModule } from '../notificacoes/notificacoes.module.js';
import { EnvioMoedas } from './envio-moedas.entity.js';
import { TransacoesController } from './transacoes.controller.js';
import { TransacoesService } from './transacoes.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([EnvioMoedas]), NotificacoesModule],
  controllers: [TransacoesController],
  providers: [TransacoesService],
})
export class TransacoesModule {}
