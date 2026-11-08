import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CREDITO_SEMESTRAL, semestreDaRecarga } from '../common/semestre.js';
import { CreditoSemestral } from '../transacoes/credito-semestral.entity.js';
import { Professor } from './professor.entity.js';

const UMA_HORA = 60 * 60 * 1000;

@Injectable()
export class ProfessoresService
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(ProfessoresService.name);
  private verificacaoDaRecarga?: NodeJS.Timeout;

  constructor(
    @InjectRepository(Professor)
    private readonly professorRepository: Repository<Professor>,
    private readonly dataSource: DataSource,
  ) {}

  buscar(id: number): Promise<Professor> {
    return this.professorRepository.findOneByOrFail({ id });
  }

  async onApplicationBootstrap() {
    await this.creditarSemestre(new Date());
    // Verificar com frequencia garante a recarga mesmo que o servidor so
    // fique ligado em parte da semana; o registro por semestre evita repetir.
    this.verificacaoDaRecarga = setInterval(() => {
      this.creditarSemestre(new Date()).catch((erro) =>
        this.logger.error('Falha na recarga semestral', erro),
      );
    }, UMA_HORA);
    this.verificacaoDaRecarga.unref();
  }

  onModuleDestroy() {
    clearInterval(this.verificacaoDaRecarga);
  }

  /** Soma o credito aos professores que ainda nao o receberam no semestre. */
  async creditarSemestre(data: Date): Promise<void> {
    const semestre = semestreDaRecarga(data);
    if (!semestre) {
      return;
    }

    for (const { id } of await this.professorRepository.find()) {
      await this.dataSource.transaction(async (manager) => {
        const jaRecebeu = await manager.existsBy(CreditoSemestral, {
          professor: { id },
          semestre,
        });
        if (jaRecebeu) {
          return;
        }
        await manager.insert(CreditoSemestral, {
          professor: { id },
          semestre,
          quantidade: CREDITO_SEMESTRAL,
        });
        await manager.increment(Professor, { id }, 'saldo', CREDITO_SEMESTRAL);
      });
    }
  }
}
