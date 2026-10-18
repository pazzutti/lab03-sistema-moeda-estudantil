import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuariosModule } from '../usuarios/usuarios.module.js';
import { EmpresaParceira } from './empresa-parceira.entity.js';
import { EmpresasController } from './empresas.controller.js';
import { EmpresasService } from './empresas.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([EmpresaParceira]), UsuariosModule],
  controllers: [EmpresasController],
  providers: [EmpresasService],
})
export class EmpresasModule {}
