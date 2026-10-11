import {
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import { TipoUsuario } from '../usuarios/usuario.entity.js';

/** Dados do usuario autenticado, extraidos do token. */
export interface UsuarioAutenticado {
  id: number;
  login: string;
  tipo: TipoUsuario;
}

export const ROTA_PUBLICA = 'rotaPublica';

/** Libera a rota do AuthGuard global (ex.: login e cadastros publicos). */
export const Public = () => SetMetadata(ROTA_PUBLICA, true);

export const UsuarioLogado = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UsuarioAutenticado =>
    ctx.switchToHttp().getRequest().usuario,
);
