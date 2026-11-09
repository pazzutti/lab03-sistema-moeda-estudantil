import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { EmpresaParceira } from '../empresas/empresa-parceira.entity.js';

/** Vantagem oferecida por uma empresa parceira em troca de moedas (HU13). */
@Entity('vantagem')
@Check('"custo" > 0')
export class Vantagem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => EmpresaParceira, {
    eager: true,
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'empresa_id' })
  empresa: Relation<EmpresaParceira>;

  @Column({ length: 120 })
  nome: string;

  @Column({ type: 'text' })
  descricao: string;

  /** URL da imagem (http/https). */
  @Column({ length: 500 })
  foto: string;

  /** Custo em moedas: inteiro maior que zero. */
  @Column({ type: 'integer' })
  custo: number;

  /**
   * Remover uma vantagem so a desativa (HU14): os resgates ja feitos
   * continuam apontando para ela no extrato.
   */
  @Column({ default: true })
  ativa: boolean;
}
