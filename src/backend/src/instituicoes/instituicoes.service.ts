import {
  Injectable,
  NotFoundException,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Instituicao } from './instituicao.entity.js';

/** Instituicoes participantes ja vem pre-cadastradas (nao ha CRUD publico). */
const INSTITUICOES_PARCEIRAS = [
  'PUC Minas',
  'Universidade Federal de Minas Gerais',
  'CEFET-MG',
];

@Injectable()
export class InstituicoesService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(Instituicao)
    private readonly instituicaoRepository: Repository<Instituicao>,
  ) {}

  async onApplicationBootstrap() {
    if ((await this.instituicaoRepository.count()) === 0) {
      await this.instituicaoRepository.save(
        INSTITUICOES_PARCEIRAS.map((nome) => ({ nome })),
      );
    }
  }

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
