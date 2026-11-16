import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vantagem } from './vantagem.entity.js';
import { VantagensController } from './vantagens.controller.js';
import { VantagensService } from './vantagens.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Vantagem])],
  controllers: [VantagensController],
  providers: [VantagensService],
})
export class VantagensModule {}
