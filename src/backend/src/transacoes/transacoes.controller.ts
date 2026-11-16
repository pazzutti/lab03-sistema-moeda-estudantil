import { Body, Controller, Get, Post } from '@nestjs/common';
import {
  type UsuarioAutenticado,
  UsuarioLogado,
} from '../auth/auth.decorators.js';
import { EnviarMoedasDto } from './dto/enviar-moedas.dto.js';
import { ResgatarVantagemDto } from './dto/resgatar-vantagem.dto.js';
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

  /** Aluno troca moedas por uma vantagem e recebe o cupom (HU08). */
  @Post('resgates')
  resgatarVantagem(
    @Body() dto: ResgatarVantagemDto,
    @UsuarioLogado() usuario: UsuarioAutenticado,
  ) {
    return this.transacoesService.resgatarVantagem(usuario, dto);
  }

  /** Vantagens resgatadas pelo aluno logado, com o codigo de cada cupom. */
  @Get('resgates')
  listarResgates(@UsuarioLogado() usuario: UsuarioAutenticado) {
    return this.transacoesService.listarResgates(usuario);
  }

  /** Extrato da conta do usuario logado (aluno ou professor). */
  @Get('extrato')
  consultarExtrato(@UsuarioLogado() usuario: UsuarioAutenticado) {
    return this.transacoesService.consultarExtrato(usuario);
  }
}
