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
import { AlunosService } from './alunos.service.js';
import { CreateAlunoDto } from './dto/create-aluno.dto.js';
import { UpdateAlunoDto } from './dto/update-aluno.dto.js';

@Controller('alunos')
export class AlunosController {
  constructor(private readonly alunosService: AlunosService) {}

  /** Cadastro e publico: o aluno ainda nao tem login (HU03). */
  @Public()
  @Post()
  criar(@Body() dto: CreateAlunoDto) {
    return this.alunosService.criar(dto);
  }

  @Get()
  listar() {
    return this.alunosService.listar();
  }

  @Get(':id')
  buscar(@Param('id', ParseIntPipe) id: number) {
    return this.alunosService.buscar(id);
  }

  @Patch(':id')
  atualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAlunoDto,
    @UsuarioLogado() usuario: UsuarioAutenticado,
  ) {
    return this.alunosService.atualizar(id, dto, usuario);
  }

  @Delete(':id')
  @HttpCode(204)
  remover(
    @Param('id', ParseIntPipe) id: number,
    @UsuarioLogado() usuario: UsuarioAutenticado,
  ) {
    return this.alunosService.remover(id, usuario);
  }
}
