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
 * Perfil do professor. A PK e a propria FK para "usuario" (1:1), que guarda
 * login, senha e email.
 */
@Entity('professor')
export class Professor {
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

  /** Apenas digitos. */
  @Column({ length: 11, unique: true })
  cpf: string;

  @Column({ length: 120 })
  departamento: string;

  @Column({ type: 'integer', default: 0 })
  saldo: number;
}
