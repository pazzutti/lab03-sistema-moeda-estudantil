import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Instituicao } from './instituicao.entity.js';

@Injectable()
export class InstituicoesService {
  constructor(
    @InjectRepository(Instituicao)
    private readonly instituicaoRepository: Repository<Instituicao>,
  ) {}

  listar(): Promise<Instituicao[]> {
    return this.instituicaoRepository.find({ order: { nome: 'ASC' } });
  }

  async buscar(id: number): Promise<Instituicao> {
    const instituicao = await this.instituicaoRepository.findOneBy({ id });
    if (!instituicao) {
      throw new NotFoundException('Instituição de ensino não encontrada.');
    }
    return instituicao;
  }
}
