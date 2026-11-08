import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  type Relation,
} from 'typeorm';
import { Aluno } from '../alunos/aluno.entity.js';
import { Professor } from '../professores/professor.entity.js';
import { Transacao } from './transacao.entity.js';

@Entity('envio_moedas')
@Check('"quantidade" > 0')
export class EnvioMoedas extends Transacao {
  @ManyToOne(() => Professor, { nullable: false })
  @JoinColumn({ name: 'professor_id' })
  professor: Relation<Professor>;

  /** Fica nulo se o aluno excluir a conta: o professor nao perde o historico. */
  @ManyToOne(() => Aluno, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'aluno_id' })
  aluno: Relation<Aluno> | null;

  @Column({ type: 'text' })
  motivo: string;
}
