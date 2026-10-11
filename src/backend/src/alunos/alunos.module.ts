import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InstituicoesModule } from '../instituicoes/instituicoes.module.js';
import { UsuariosModule } from '../usuarios/usuarios.module.js';
import { Aluno } from './aluno.entity.js';
import { AlunosController } from './alunos.controller.js';
import { AlunosService } from './alunos.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Aluno]),
    UsuariosModule,
    InstituicoesModule,
  ],
  controllers: [AlunosController],
  providers: [AlunosService],
})
export class AlunosModule {}
