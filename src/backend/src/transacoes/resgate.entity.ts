import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  type Relation,
} from 'typeorm';
import { Aluno } from '../alunos/aluno.entity.js';
import { Vantagem } from '../vantagens/vantagem.entity.js';
import { Transacao } from './transacao.entity.js';

/**
 * Troca de moedas por uma vantagem (HU08). "quantidade" e o custo da
 * vantagem no momento do resgate: o historico nao muda se a empresa mudar o
 * preco depois.
 */
@Entity('resgate')
@Check('"quantidade" > 0')
export class Resgate extends Transacao {
  /** Fica nulo se o aluno excluir a conta: o registro do cupom continua. */
  @ManyToOne(() => Aluno, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'aluno_id' })
  aluno: Relation<Aluno> | null;

  /**
   * Remover a vantagem so a desativa, entao ela continua aqui. Fica nula
   * apenas se a empresa excluir a conta, o que apaga as vantagens dela.
   */
  @ManyToOne(() => Vantagem, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'vantagem_id' })
  vantagem: Relation<Vantagem> | null;

  /** Mesmo codigo no email do aluno e no da empresa (HU08/HU15). */
  @Column({ name: 'codigo_cupom', length: 20, unique: true })
  codigoCupom: string;
}
