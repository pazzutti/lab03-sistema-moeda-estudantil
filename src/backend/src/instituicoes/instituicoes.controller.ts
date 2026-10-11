import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/auth.decorators.js';
import { InstituicoesService } from './instituicoes.service.js';

@Controller('instituicoes')
export class InstituicoesController {
  constructor(private readonly instituicoesService: InstituicoesService) {}

  /** Publica: o formulario de cadastro do aluno precisa listar as opcoes. */
  @Public()
  @Get()
  listar() {
    return this.instituicoesService.listar();
  }
}
