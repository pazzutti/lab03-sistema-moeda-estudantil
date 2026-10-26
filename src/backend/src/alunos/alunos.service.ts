import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { UsuarioAutenticado } from '../auth/auth.decorators.js';
import { conflito } from '../common/erros.js';
import { InstituicoesService } from '../instituicoes/instituicoes.service.js';
import { TipoUsuario, Usuario } from '../usuarios/usuario.entity.js';
import { UsuariosService } from '../usuarios/usuarios.service.js';
import { Aluno } from './aluno.entity.js';
import { CreateAlunoDto } from './dto/create-aluno.dto.js';
import { UpdateAlunoDto } from './dto/update-aluno.dto.js';

@Injectable()
export class AlunosService {
  constructor(
    @InjectRepository(Aluno)
    private readonly alunoRepository: Repository<Aluno>,
    private readonly dataSource: DataSource,
    private readonly usuariosService: UsuariosService,
    private readonly instituicoesService: InstituicoesService,
  ) {}

  listar(): Promise<Aluno[]> {
    return this.alunoRepository.find({ order: { nome: 'ASC' } });
  }

  async buscar(id: number): Promise<Aluno> {
    const aluno = await this.alunoRepository.findOneBy({ id });
    if (!aluno) {
      throw new NotFoundException('Aluno não encontrado.');
    }
    return aluno;
  }

  async criar(dto: CreateAlunoDto): Promise<Aluno> {
    const instituicao = await this.instituicoesService.buscar(
      dto.instituicaoId,
    );

    const id = await this.dataSource.transaction(async (manager) => {
      if (await manager.existsBy(Aluno, { cpf: dto.cpf })) {
        throw conflito('cpf', 'Já existe um aluno cadastrado com este CPF.');
      }
      const usuario = await this.usuariosService.criar(
        manager,
        dto,
        TipoUsuario.ALUNO,
      );
      await manager.insert(Aluno, {
        id: usuario.id,
        instituicao,
        nome: dto.nome,
        cpf: dto.cpf,
        rg: dto.rg,
        endereco: dto.endereco,
        curso: dto.curso,
      });
      return usuario.id;
    });

    return this.buscar(id);
  }

  async atualizar(
    id: number,
    dto: UpdateAlunoDto,
    usuarioLogado: UsuarioAutenticado,
  ): Promise<Aluno> {
    this.garantirProprioAluno(id, usuarioLogado);
    const aluno = await this.buscar(id);
    const { email, senha, instituicaoId, ...perfil } = dto;

    if (instituicaoId !== undefined) {
      aluno.instituicao = await this.instituicoesService.buscar(instituicaoId);
    }
    Object.assign(aluno, perfil);

    await this.dataSource.transaction(async (manager) => {
      await this.usuariosService.atualizar(manager, aluno.usuario, {
        email,
        senha,
      });
      await manager.save(aluno);
    });

    return this.buscar(id);
  }

  /** A confirmacao da exclusao (HU04) e feita no frontend antes da chamada. */
  async remover(id: number, usuarioLogado: UsuarioAutenticado): Promise<void> {
    this.garantirProprioAluno(id, usuarioLogado);
    await this.buscar(id);

    await this.dataSource.transaction(async (manager) => {
      await manager.delete(Aluno, { id });
      await manager.delete(Usuario, { id });
    });
  }

  /** Cada aluno so pode editar ou excluir o proprio cadastro. */
  private garantirProprioAluno(id: number, usuario: UsuarioAutenticado) {
    if (usuario.tipo !== TipoUsuario.ALUNO || usuario.id !== id) {
      throw new ForbiddenException(
        'Você só pode alterar o seu próprio cadastro.',
      );
    }
  }
}
