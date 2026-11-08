import { Controller, ForbiddenException, Get } from '@nestjs/common';
import {
  type UsuarioAutenticado,
  UsuarioLogado,
} from '../auth/auth.decorators.js';
import { TipoUsuario } from '../usuarios/usuario.entity.js';
import { ProfessoresService } from './professores.service.js';

@Controller('professores')
export class ProfessoresController {
  constructor(private readonly professoresService: ProfessoresService) {}

  /** Perfil e saldo do professor logado. */
  @Get('me')
  me(@UsuarioLogado() usuario: UsuarioAutenticado) {
    if (usuario.tipo !== TipoUsuario.PROFESSOR) {
      throw new ForbiddenException('Disponível apenas para professores.');
    }
    return this.professoresService.buscar(usuario.id);
  }
}
