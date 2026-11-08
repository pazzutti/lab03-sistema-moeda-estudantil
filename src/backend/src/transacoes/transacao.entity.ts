import { Column, CreateDateColumn, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Campos comuns a toda movimentacao de moedas. Cada especializacao vira uma
 * tabela propria -- ver docs/diagramas/modelo-entidade-relacionamento.puml.
 */
export abstract class Transacao {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn({ name: 'data' })
  data: Date;

  @Column({ type: 'integer' })
  quantidade: number;
}
