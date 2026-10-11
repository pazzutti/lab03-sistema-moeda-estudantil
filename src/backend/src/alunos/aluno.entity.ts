import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryColumn,
  type Relation,
} from 'typeorm';
import { Instituicao } from '../instituicoes/instituicao.entity.js';
import { Usuario } from '../usuarios/usuario.entity.js';

/**
 * Perfil do aluno. A PK e a propria FK para "usuario" (1:1), que guarda
 * login, senha e email.
 */
@Entity('aluno')
export class Aluno {
  @PrimaryColumn({ name: 'usuario_id' })
  id: number;

  @OneToOne(() => Usuario, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Relation<Usuario>;

  @ManyToOne(() => Instituicao, { eager: true, nullable: false })
  @JoinColumn({ name: 'instituicao_id' })
  instituicao: Relation<Instituicao>;

  @Column({ length: 120 })
  nome: string;

  /** Apenas digitos; nao pode ser alterado apos o cadastro (HU04). */
  @Column({ length: 11, unique: true })
  cpf: string;

  @Column({ length: 20 })
  rg: string;

  @Column({ length: 255 })
  endereco: string;

  @Column({ length: 120 })
  curso: string;

  /** Todo aluno comeca com 0 moedas (HU03). */
  @Column({ type: 'integer', default: 0 })
  saldo: number;
}
