import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  type Relation,
  Unique,
} from 'typeorm';
import { Professor } from '../professores/professor.entity.js';
import { Transacao } from './transacao.entity.js';

/** Um credito por professor por semestre; o saldo e acumulavel (HU16). */
@Entity('credito_semestral')
@Unique(['professor', 'semestre'])
export class CreditoSemestral extends Transacao {
  @ManyToOne(() => Professor, { nullable: false })
  @JoinColumn({ name: 'professor_id' })
  professor: Relation<Professor>;

  /** Ex.: 2026.2 */
  @Column({ length: 6 })
  semestre: string;
}
