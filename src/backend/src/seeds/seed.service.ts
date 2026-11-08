import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CREDITO_SEMESTRAL, semestreAtual } from '../common/semestre.js';
import { Instituicao } from '../instituicoes/instituicao.entity.js';
import { Professor } from '../professores/professor.entity.js';
import { CreditoSemestral } from '../transacoes/credito-semestral.entity.js';
import { TipoUsuario } from '../usuarios/usuario.entity.js';
import { UsuariosService } from '../usuarios/usuarios.service.js';

/** Instituicoes participantes ja vem pre-cadastradas (nao ha CRUD publico). */
const INSTITUICOES_PARCEIRAS = [
  'PUC Minas',
  'Universidade Federal de Minas Gerais',
  'CEFET-MG',
];

/** Professores ja vem pre-cadastrados pelas instituicoes (nao ha cadastro). */
const PROFESSORES_PRE_CADASTRADOS = [
  {
    login: 'prof.ana',
    email: 'ana.souza@example.com',
    nome: 'Ana Souza',
    cpf: '11144477735',
    departamento: 'Engenharia de Software',
    instituicao: 'PUC Minas',
  },
  {
    login: 'prof.carlos',
    email: 'carlos.lima@example.com',
    nome: 'Carlos Lima',
    cpf: '12345678909',
    departamento: 'Ciência da Computação',
    instituicao: 'CEFET-MG',
  },
];

/** Dados iniciais do sistema; cada tabela so e populada se estiver vazia. */
@Injectable()
export class SeedService implements OnApplicationBootstrap {
  constructor(
    private readonly dataSource: DataSource,
    private readonly usuariosService: UsuariosService,
  ) {}

  async onApplicationBootstrap() {
    await this.criarInstituicoes();
    await this.criarProfessores();
  }

  private async criarInstituicoes(): Promise<void> {
    const repo = this.dataSource.getRepository(Instituicao);
    if ((await repo.count()) === 0) {
      await repo.save(INSTITUICOES_PARCEIRAS.map((nome) => ({ nome })));
    }
  }

  /** O saldo inicial conta como o credito do semestre em que foi criado. */
  private async criarProfessores(): Promise<void> {
    if ((await this.dataSource.getRepository(Professor).count()) > 0) {
      return;
    }
    await this.dataSource.transaction(async (manager) => {
      for (const dados of PROFESSORES_PRE_CADASTRADOS) {
        const { login, email, instituicao, ...perfil } = dados;
        const usuario = await this.usuariosService.criar(
          manager,
          { login, email, senha: 'senha123' },
          TipoUsuario.PROFESSOR,
        );
        await manager.insert(Professor, {
          ...perfil,
          id: usuario.id,
          instituicao: await manager.findOneByOrFail(Instituicao, {
            nome: instituicao,
          }),
          saldo: CREDITO_SEMESTRAL,
        });
        await manager.insert(CreditoSemestral, {
          professor: { id: usuario.id },
          semestre: semestreAtual(new Date()),
          quantidade: CREDITO_SEMESTRAL,
        });
      }
    });
  }
}
