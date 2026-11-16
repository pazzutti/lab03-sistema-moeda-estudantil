import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { Aluno } from '../alunos/aluno.entity.js';
import { UsuarioAutenticado } from '../auth/auth.decorators.js';
import { gerarCodigoCupom } from '../common/cupom.js';
import { NotificacoesService } from '../notificacoes/notificacoes.service.js';
import { Professor } from '../professores/professor.entity.js';
import { TipoUsuario } from '../usuarios/usuario.entity.js';
import { Vantagem } from '../vantagens/vantagem.entity.js';
import { CreditoSemestral } from './credito-semestral.entity.js';
import { EnviarMoedasDto } from './dto/enviar-moedas.dto.js';
import { ResgatarVantagemDto } from './dto/resgatar-vantagem.dto.js';
import { EnvioMoedas } from './envio-moedas.entity.js';
import { Resgate } from './resgate.entity.js';

interface Movimentacao {
  /** Unico apenas dentro do mesmo "tipo": cada tipo vem de uma tabela. */
  id: number;
  data: Date;
  /** Sempre positiva; o "tipo" diz se entrou ou saiu da conta. */
  quantidade: number;
}

/** Moedas que o professor enviou a um aluno (saida). */
export interface EnvioNoExtrato extends Movimentacao {
  tipo: 'ENVIO';
  motivo: string;
  /** Nulo se o aluno excluiu a conta depois de receber. */
  aluno: string | null;
}

/** Recarga semestral do professor (entrada, HU16). */
export interface CreditoNoExtrato extends Movimentacao {
  tipo: 'CREDITO_SEMESTRAL';
  semestre: string;
}

/** Moedas que o aluno recebeu de um professor (entrada). */
export interface RecebimentoNoExtrato extends Movimentacao {
  tipo: 'RECEBIMENTO';
  motivo: string;
  professor: string;
}

/** Vantagem que o aluno trocou por moedas (saida, HU06/HU08). */
export interface ResgateNoExtrato extends Movimentacao {
  tipo: 'RESGATE';
  codigo: string;
  /** Nulos se a empresa excluiu a conta, levando a vantagem junto. */
  vantagem: string | null;
  empresa: string | null;
}

export type ItemDoExtrato =
  EnvioNoExtrato | CreditoNoExtrato | RecebimentoNoExtrato | ResgateNoExtrato;

export interface Extrato {
  saldo: number;
  transacoes: ItemDoExtrato[];
}

/** Item da lista de vantagens resgatadas pelo aluno. */
export interface ResgateDoAluno {
  id: number;
  data: Date;
  /** Custo pago no resgate, mesmo que a empresa mude o preco depois. */
  quantidade: number;
  codigo: string;
  /** Nula se a empresa excluiu a conta, levando a vantagem junto. */
  vantagem: {
    id: number;
    nome: string;
    descricao: string;
    foto: string;
    empresa: string;
  } | null;
}

function resgateDoAluno(resgate: Resgate): ResgateDoAluno {
  const { vantagem } = resgate;
  return {
    id: resgate.id,
    data: resgate.data,
    quantidade: resgate.quantidade,
    codigo: resgate.codigoCupom,
    vantagem: vantagem && {
      id: vantagem.id,
      nome: vantagem.nome,
      descricao: vantagem.descricao,
      foto: vantagem.foto,
      empresa: vantagem.empresa.nome,
    },
  };
}

/**
 * Junta as listas em ordem cronologica decrescente (HU06). Cada lista ja vem
 * ordenada do banco; como "data" tem precisao de segundos, o sort estavel
 * mantem a ordem das listas nos empates.
 */
function maisRecentesPrimeiro(...listas: ItemDoExtrato[][]): ItemDoExtrato[] {
  return listas.flat().sort((a, b) => b.data.getTime() - a.data.getTime());
}

const MAIS_RECENTES = { data: 'DESC', id: 'DESC' } as const;

@Injectable()
export class TransacoesService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly notificacoes: NotificacoesService,
  ) {}

  /**
   * Debita o professor, credita o aluno e registra o envio na mesma transacao
   * do banco (HU09). Os emails saem so depois do commit (HU05).
   */
  async enviarMoedas(usuario: UsuarioAutenticado, dto: EnviarMoedasDto) {
    if (usuario.tipo !== TipoUsuario.PROFESSOR) {
      throw new ForbiddenException('Apenas professores podem enviar moedas.');
    }

    const { envio, professor, aluno } = await this.dataSource.transaction(
      async (manager) => {
        const aluno = await manager.findOneBy(Aluno, { id: dto.alunoId });
        if (!aluno) {
          throw new NotFoundException('Aluno não encontrado.');
        }
        const professor = await manager.findOneByOrFail(Professor, {
          id: usuario.id,
        });
        if (aluno.instituicao.id !== professor.instituicao.id) {
          throw new ForbiddenException(
            'Você só pode enviar moedas para alunos da sua instituição.',
          );
        }

        // A condicao no proprio UPDATE impede saldo negativo em envios
        // simultaneos, o que uma leitura previa do saldo nao garantiria.
        const { affected } = await manager
          .createQueryBuilder()
          .update(Professor)
          .set({ saldo: () => 'saldo - :quantidade' })
          .where('usuario_id = :id AND saldo >= :quantidade', {
            id: professor.id,
            quantidade: dto.quantidade,
          })
          .execute();
        if (!affected) {
          const mensagem = `Saldo insuficiente: você tem ${professor.saldo} moedas.`;
          throw new BadRequestException({
            statusCode: 400,
            error: 'Bad Request',
            message: mensagem,
            campos: { quantidade: mensagem },
          });
        }
        await manager.increment(
          Aluno,
          { id: aluno.id },
          'saldo',
          dto.quantidade,
        );

        const envio = await manager.save(
          manager.create(EnvioMoedas, {
            professor,
            aluno,
            quantidade: dto.quantidade,
            motivo: dto.motivo,
          }),
        );
        professor.saldo -= dto.quantidade;
        return { envio, professor, aluno };
      },
    );

    // Sem await: os emails saem em fila e nao devem atrasar a resposta.
    void this.notificacoes.notificarEnvioDeMoedas({
      professor: { nome: professor.nome, email: professor.usuario.email },
      aluno: { nome: aluno.nome, email: aluno.usuario.email },
      quantidade: envio.quantidade,
      motivo: envio.motivo,
      saldoProfessor: professor.saldo,
    });

    return {
      id: envio.id,
      data: envio.data,
      quantidade: envio.quantidade,
      motivo: envio.motivo,
      aluno: aluno.nome,
      saldo: professor.saldo,
    };
  }

  /**
   * Debita o custo do aluno e registra o resgate com um codigo de cupom novo,
   * na mesma transacao do banco (HU08). Depois do commit, o mesmo codigo vai
   * por email ao aluno e a empresa (HU15).
   */
  async resgatarVantagem(
    usuario: UsuarioAutenticado,
    dto: ResgatarVantagemDto,
  ): Promise<ResgateDoAluno & { saldo: number }> {
    this.garantirAluno(usuario, 'Apenas alunos podem resgatar vantagens.');

    const { resgate, aluno, vantagem } = await this.dataSource.transaction(
      async (manager) => {
        const vantagem = await manager.findOneBy(Vantagem, {
          id: dto.vantagemId,
          ativa: true,
        });
        if (!vantagem) {
          throw new NotFoundException('Vantagem não encontrada.');
        }
        const aluno = await manager.findOneBy(Aluno, { id: usuario.id });
        if (!aluno) {
          throw new NotFoundException('Aluno não encontrado.');
        }

        // Como no envio de moedas, a condicao no UPDATE impede saldo
        // negativo em resgates simultaneos.
        const { affected } = await manager
          .createQueryBuilder()
          .update(Aluno)
          .set({ saldo: () => 'saldo - :custo' })
          .where('usuario_id = :id AND saldo >= :custo', {
            id: aluno.id,
            custo: vantagem.custo,
          })
          .execute();
        if (!affected) {
          throw new BadRequestException(
            `Saldo insuficiente: você tem ${aluno.saldo} moedas e a vantagem custa ${vantagem.custo}.`,
          );
        }

        const resgate = await manager.save(
          manager.create(Resgate, {
            aluno,
            vantagem,
            quantidade: vantagem.custo,
            codigoCupom: await this.codigoCupomNovo(manager),
          }),
        );
        aluno.saldo -= vantagem.custo;
        return { resgate, aluno, vantagem };
      },
    );

    // Sem await: os emails saem em fila e nao devem atrasar a resposta.
    void this.notificacoes.notificarResgate({
      aluno: { nome: aluno.nome, email: aluno.usuario.email },
      empresa: {
        nome: vantagem.empresa.nome,
        email: vantagem.empresa.usuario.email,
      },
      vantagem: vantagem.nome,
      custo: resgate.quantidade,
      codigo: resgate.codigoCupom,
      saldoAluno: aluno.saldo,
    });

    return { ...resgateDoAluno(resgate), saldo: aluno.saldo };
  }

  /** Vantagens que o aluno logado resgatou, da mais recente a mais antiga. */
  async listarResgates(usuario: UsuarioAutenticado): Promise<ResgateDoAluno[]> {
    this.garantirAluno(usuario, 'Apenas alunos possuem vantagens resgatadas.');
    const resgates = await this.resgatesDoAluno(usuario.id);
    return resgates.map(resgateDoAluno);
  }

  /**
   * Saldo atual e movimentacoes do usuario logado (HU06/HU10): o professor ve
   * os envios e os creditos semestrais (HU16); o aluno, as moedas recebidas.
   */
  consultarExtrato(usuario: UsuarioAutenticado): Promise<Extrato> {
    switch (usuario.tipo) {
      case TipoUsuario.PROFESSOR:
        return this.extratoDoProfessor(usuario.id);
      case TipoUsuario.ALUNO:
        return this.extratoDoAluno(usuario.id);
      default:
        throw new ForbiddenException(
          'O extrato está disponível apenas para alunos e professores.',
        );
    }
  }

  private async extratoDoProfessor(id: number): Promise<Extrato> {
    const { manager } = this.dataSource;
    const professor = await manager.findOneBy(Professor, { id });
    if (!professor) {
      throw new NotFoundException('Professor não encontrado.');
    }
    // Sem as relacoes eager (usuario, instituicao): o extrato so usa o nome.
    const envios = await manager.find(EnvioMoedas, {
      where: { professor: { id } },
      relations: { aluno: true },
      loadEagerRelations: false,
      order: MAIS_RECENTES,
    });
    const creditos = await manager.find(CreditoSemestral, {
      where: { professor: { id } },
      order: MAIS_RECENTES,
    });

    return {
      saldo: professor.saldo,
      // Envios antes dos creditos: num empate de data, o envio aparece como o
      // mais recente, pois e o credito do semestre que da saldo para enviar.
      transacoes: maisRecentesPrimeiro(
        envios.map((envio) => ({
          tipo: 'ENVIO',
          id: envio.id,
          data: envio.data,
          quantidade: envio.quantidade,
          motivo: envio.motivo,
          aluno: envio.aluno?.nome ?? null,
        })),
        creditos.map((credito) => ({
          tipo: 'CREDITO_SEMESTRAL',
          id: credito.id,
          data: credito.data,
          quantidade: credito.quantidade,
          semestre: credito.semestre,
        })),
      ),
    };
  }

  private async extratoDoAluno(id: number): Promise<Extrato> {
    const { manager } = this.dataSource;
    const aluno = await manager.findOneBy(Aluno, { id });
    if (!aluno) {
      throw new NotFoundException('Aluno não encontrado.');
    }
    const recebimentos = await manager.find(EnvioMoedas, {
      where: { aluno: { id } },
      relations: { professor: true },
      loadEagerRelations: false,
      order: MAIS_RECENTES,
    });
    const resgates = await this.resgatesDoAluno(id);

    return {
      saldo: aluno.saldo,
      // Resgates antes dos recebimentos: num empate de data, o resgate
      // aparece como o mais recente, pois sao as moedas recebidas que o pagam.
      transacoes: maisRecentesPrimeiro(
        resgates.map((resgate) => ({
          tipo: 'RESGATE',
          id: resgate.id,
          data: resgate.data,
          quantidade: resgate.quantidade,
          codigo: resgate.codigoCupom,
          vantagem: resgate.vantagem?.nome ?? null,
          empresa: resgate.vantagem?.empresa.nome ?? null,
        })),
        recebimentos.map((envio) => ({
          tipo: 'RECEBIMENTO',
          id: envio.id,
          data: envio.data,
          quantidade: envio.quantidade,
          motivo: envio.motivo,
          professor: envio.professor.nome,
        })),
      ),
    };
  }

  /** Sem as relacoes eager de aluno e empresa: so os nomes sao usados. */
  private resgatesDoAluno(id: number): Promise<Resgate[]> {
    return this.dataSource.manager.find(Resgate, {
      where: { aluno: { id } },
      relations: { vantagem: { empresa: true } },
      loadEagerRelations: false,
      order: MAIS_RECENTES,
    });
  }

  /**
   * Sorteia ate achar um codigo livre. Com 29^8 combinacoes a repeticao e
   * rarissima, mas o UNIQUE do banco transformaria ela num erro 500.
   */
  private async codigoCupomNovo(manager: EntityManager): Promise<string> {
    let codigo: string;
    do {
      codigo = gerarCodigoCupom();
    } while (await manager.existsBy(Resgate, { codigoCupom: codigo }));
    return codigo;
  }

  private garantirAluno(usuario: UsuarioAutenticado, mensagem: string) {
    if (usuario.tipo !== TipoUsuario.ALUNO) {
      throw new ForbiddenException(mensagem);
    }
  }
}
