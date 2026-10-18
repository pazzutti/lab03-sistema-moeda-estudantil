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
  Public,
  type UsuarioAutenticado,
  UsuarioLogado,
} from '../auth/auth.decorators.js';
import { CreateEmpresaDto } from './dto/create-empresa.dto.js';
import { UpdateEmpresaDto } from './dto/update-empresa.dto.js';
import { EmpresasService } from './empresas.service.js';

@Controller('empresas')
export class EmpresasController {
  constructor(private readonly empresasService: EmpresasService) {}

  /** Cadastro e publico: a empresa ainda nao tem login. */
  @Public()
  @Post()
  criar(@Body() dto: CreateEmpresaDto) {
    return this.empresasService.criar(dto);
  }

  @Get()
  listar() {
    return this.empresasService.listar();
  }

  @Get(':id')
  buscar(@Param('id', ParseIntPipe) id: number) {
    return this.empresasService.buscar(id);
  }

  @Patch(':id')
  atualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEmpresaDto,
    @UsuarioLogado() usuario: UsuarioAutenticado,
  ) {
    return this.empresasService.atualizar(id, dto, usuario);
  }

  @Delete(':id')
  @HttpCode(204)
  remover(
    @Param('id', ParseIntPipe) id: number,
    @UsuarioLogado() usuario: UsuarioAutenticado,
  ) {
    return this.empresasService.remover(id, usuario);
  }
}
