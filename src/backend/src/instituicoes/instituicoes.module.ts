import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Instituicao } from './instituicao.entity.js';
import { InstituicoesController } from './instituicoes.controller.js';
import { InstituicoesService } from './instituicoes.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Instituicao])],
  controllers: [InstituicoesController],
  providers: [InstituicoesService],
  exports: [InstituicoesService],
})
export class InstituicoesModule {}
