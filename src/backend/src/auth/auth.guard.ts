import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ROTA_PUBLICA, UsuarioAutenticado } from './auth.decorators.js';

/**
 * Registrado como guard global: toda rota exige um token valido
 * (Authorization: Bearer <token>), exceto as marcadas com @Public().
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const publica = this.reflector.getAllAndOverride<boolean>(ROTA_PUBLICA, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (publica) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const [esquema, token] = request.headers.authorization?.split(' ') ?? [];
    if (esquema !== 'Bearer' || !token) {
      throw new UnauthorizedException('Faça login para continuar.');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      request.usuario = {
        id: payload.sub,
        login: payload.login,
        tipo: payload.tipo,
      } satisfies UsuarioAutenticado;
    } catch {
      throw new UnauthorizedException('Sua sessão expirou. Entre novamente.');
    }
    return true;
  }
}
