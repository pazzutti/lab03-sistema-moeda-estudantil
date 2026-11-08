import { Body, Controller, Post } from '@nestjs/common';
import {
  type UsuarioAutenticado,
  UsuarioLogado,
} from '../auth/auth.decorators.js';
import { EnviarMoedasDto } from './dto/enviar-moedas.dto.js';
import { TransacoesService } from './transacoes.service.js';

@Controller('transacoes')
export class TransacoesController {
  constructor(private readonly transacoesService: TransacoesService) {}

  @Post('envios')
  enviarMoedas(
    @Body() dto: EnviarMoedasDto,
    @UsuarioLogado() usuario: UsuarioAutenticado,
  ) {
    return this.transacoesService.enviarMoedas(usuario, dto);
  }
}
