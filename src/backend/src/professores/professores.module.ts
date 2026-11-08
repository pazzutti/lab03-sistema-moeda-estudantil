import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreditoSemestral } from '../transacoes/credito-semestral.entity.js';
import { Professor } from './professor.entity.js';
import { ProfessoresController } from './professores.controller.js';
import { ProfessoresService } from './professores.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Professor, CreditoSemestral])],
  controllers: [ProfessoresController],
  providers: [ProfessoresService],
})
export class ProfessoresModule {}
