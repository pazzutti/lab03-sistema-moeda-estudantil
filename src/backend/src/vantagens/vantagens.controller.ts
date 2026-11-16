import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  type UsuarioAutenticado,
  UsuarioLogado,
} from '../auth/auth.decorators.js';
import { CreateVantagemDto } from './dto/create-vantagem.dto.js';
import { UpdateVantagemDto } from './dto/update-vantagem.dto.js';
import { VantagensService } from './vantagens.service.js';

@Controller('vantagens')
export class VantagensController {
  constructor(private readonly vantagensService: VantagensService) {}

  @Post()
  criar(
    @Body() dto: CreateVantagemDto,
    @UsuarioLogado() usuario: UsuarioAutenticado,
  ) {
    return this.vantagensService.criar(dto, usuario);
  }

  @Get()
  listar() {
    return this.vantagensService.listar();
  }

  /** Vantagens da empresa logada. Declarada antes de ":id". */
  @Get('minhas')
  listarMinhas(@UsuarioLogado() usuario: UsuarioAutenticado) {
    return this.vantagensService.listarDaEmpresa(usuario);
  }

  @Get(':id')
  buscar(@Param('id', ParseIntPipe) id: number) {
    return this.vantagensService.buscar(id);
  }

  @Patch(':id')
  atualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateVantagemDto,
    @UsuarioLogado() usuario: UsuarioAutenticado,
  ) {
    return this.vantagensService.atualizar(id, dto, usuario);
  }

  @Delete(':id')
  @HttpCode(204)
  remover(
    @Param('id', ParseIntPipe) id: number,
    @UsuarioLogado() usuario: UsuarioAutenticado,
  ) {
    return this.vantagensService.remover(id, usuario);
  }
}
