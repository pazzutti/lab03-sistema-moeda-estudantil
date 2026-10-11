import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { IsNotEmpty, IsString } from 'class-validator';
import { UsuariosService } from '../usuarios/usuarios.service.js';
import {
  Public,
  type UsuarioAutenticado,
  UsuarioLogado,
} from './auth.decorators.js';

class LoginDto {
  @IsString()
  @IsNotEmpty()
  login: string;

  @IsString()
  @IsNotEmpty()
  senha: string;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly jwtService: JwtService,
  ) {}

  /** A mensagem de erro nao indica qual campo esta errado (HU01). */
  @Public()
  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto) {
    const usuario = await this.usuariosService.validarCredenciais(
      dto.login,
      dto.senha,
    );
    if (!usuario) {
      throw new UnauthorizedException('Login ou senha invalidos');
    }
    const token = await this.jwtService.signAsync({
      sub: usuario.id,
      login: usuario.login,
      tipo: usuario.tipoUsuario,
    });
    return { accessToken: token, tipo: usuario.tipoUsuario };
  }

  /**
   * Usado pelo frontend para saber se o token ainda e valido (ex.: ao
   * recarregar a pagina) e qual o tipo do usuario logado.
   */
  @Get('me')
  me(@UsuarioLogado() usuario: UsuarioAutenticado) {
    return usuario;
  }
}
