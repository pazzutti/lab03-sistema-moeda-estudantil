import { Exclude } from 'class-transformer';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum TipoUsuario {
  ALUNO = 'ALUNO',
  PROFESSOR = 'PROFESSOR',
  EMPRESA = 'EMPRESA',
}

/**
 * Credenciais de todo usuario do sistema: quem tem login/senha para
 * autenticar. Aluno, Professor e EmpresaParceira referenciam esta tabela em
 * 1:1 -- ver docs/diagramas/modelo-entidade-relacionamento.puml.
 */
@Entity('usuario')
export class Usuario {
  @PrimaryGeneratedColumn()
  id: number;

  /** Login e imutavel depois do cadastro. */
  @Column({ length: 60, unique: true })
  login: string;

  /** Sempre armazenada com hash (bcrypt), nunca em texto puro. */
  @Exclude()
  @Column({ length: 100 })
  senha: string;

  @Column({ length: 120, unique: true })
  email: string;

  @Column({ name: 'tipo_usuario', type: 'varchar', length: 20 })
  tipoUsuario: TipoUsuario;
}
