import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { EntityManager, Not, Repository } from 'typeorm';
import { conflito } from '../common/erros.js';
import { TipoUsuario, Usuario } from './usuario.entity.js';

const CUSTO_BCRYPT = 10;

/**
 * Validacoes e criptografia de senha comuns a todo cadastro de usuario
 * (Aluno, Professor, EmpresaParceira).
 */
@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
  ) {}

  /**
   * Cria as credenciais dentro da transacao do cadastro do perfil, para que
   * usuario e perfil sejam gravados juntos ou nenhum dos dois.
   */
  async criar(
    manager: EntityManager,
    dados: { login: string; senha: string; email: string },
    tipoUsuario: TipoUsuario,
  ): Promise<Usuario> {
    const repo = manager.getRepository(Usuario);
    if (await repo.existsBy({ login: dados.login })) {
      throw conflito('login', `O login "${dados.login}" já está em uso.`);
    }
    await this.garantirEmailDisponivel(repo, dados.email);

    return repo.save(
      repo.create({
        login: dados.login,
        email: dados.email,
        senha: await bcrypt.hash(dados.senha, CUSTO_BCRYPT),
        tipoUsuario,
      }),
    );
  }

  async atualizar(
    manager: EntityManager,
    usuario: Usuario,
    dados: { email?: string; senha?: string },
  ): Promise<Usuario> {
    const repo = manager.getRepository(Usuario);
    if (dados.email !== undefined && dados.email !== usuario.email) {
      await this.garantirEmailDisponivel(repo, dados.email, usuario.id);
      usuario.email = dados.email;
    }
    if (dados.senha !== undefined) {
      usuario.senha = await bcrypt.hash(dados.senha, CUSTO_BCRYPT);
    }
    return repo.save(usuario);
  }

  /** Usado pelo login; devolve null se login ou senha nao conferem. */
  async validarCredenciais(
    login: string,
    senha: string,
  ): Promise<Usuario | null> {
    const usuario = await this.usuarioRepository.findOneBy({ login });
    if (!usuario || !(await bcrypt.compare(senha, usuario.senha))) {
      return null;
    }
    return usuario;
  }

  private async garantirEmailDisponivel(
    repo: Repository<Usuario>,
    email: string,
    idAtual?: number,
  ): Promise<void> {
    const emUso = await repo.existsBy(
      idAtual === undefined ? { email } : { email, id: Not(idAtual) },
    );
    if (emUso) {
      throw conflito('email', `O email ${email} já está em uso.`);
    }
  }
}
