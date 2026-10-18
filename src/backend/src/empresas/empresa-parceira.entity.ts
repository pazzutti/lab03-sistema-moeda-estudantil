import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  type Relation,
} from 'typeorm';
import { Usuario } from '../usuarios/usuario.entity.js';

/**
 * Perfil da empresa parceira. A PK e a propria FK para "usuario" (1:1), que
 * guarda login, senha e email.
 */
@Entity('empresa_parceira')
export class EmpresaParceira {
  @PrimaryColumn({ name: 'usuario_id' })
  id: number;

  @OneToOne(() => Usuario, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Relation<Usuario>;

  @Column({ length: 120 })
  nome: string;

  /** Apenas digitos; nao pode ser alterado apos o cadastro. */
  @Column({ length: 14, unique: true })
  cnpj: string;
}
