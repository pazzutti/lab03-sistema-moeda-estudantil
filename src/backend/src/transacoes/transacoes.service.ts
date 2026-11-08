import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Aluno } from '../alunos/aluno.entity.js';
import { UsuarioAutenticado } from '../auth/auth.decorators.js';
import { NotificacoesService } from '../notificacoes/notificacoes.service.js';
import { Professor } from '../professores/professor.entity.js';
import { TipoUsuario } from '../usuarios/usuario.entity.js';
import { EnviarMoedasDto } from './dto/enviar-moedas.dto.js';
import { EnvioMoedas } from './envio-moedas.entity.js';

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
}
