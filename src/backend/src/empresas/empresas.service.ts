import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { UsuarioAutenticado } from '../auth/auth.decorators.js';
import { TipoUsuario, Usuario } from '../usuarios/usuario.entity.js';
import { UsuariosService } from '../usuarios/usuarios.service.js';
import { CreateEmpresaDto } from './dto/create-empresa.dto.js';
import { UpdateEmpresaDto } from './dto/update-empresa.dto.js';
import { EmpresaParceira } from './empresa-parceira.entity.js';

@Injectable()
export class EmpresasService {
  constructor(
    @InjectRepository(EmpresaParceira)
    private readonly empresaRepository: Repository<EmpresaParceira>,
    private readonly dataSource: DataSource,
    private readonly usuariosService: UsuariosService,
  ) {}

  listar(): Promise<EmpresaParceira[]> {
    return this.empresaRepository.find({ order: { nome: 'ASC' } });
  }

  async buscar(id: number): Promise<EmpresaParceira> {
    const empresa = await this.empresaRepository.findOneBy({ id });
    if (!empresa) {
      throw new NotFoundException(`Empresa ${id} nao encontrada`);
    }
    return empresa;
  }

  async criar(dto: CreateEmpresaDto): Promise<EmpresaParceira> {
    const id = await this.dataSource.transaction(async (manager) => {
      if (await manager.existsBy(EmpresaParceira, { cnpj: dto.cnpj })) {
        throw new ConflictException(
          'Ja existe uma empresa cadastrada com este CNPJ',
        );
      }
      const usuario = await this.usuariosService.criar(
        manager,
        dto,
        TipoUsuario.EMPRESA,
      );
      await manager.insert(EmpresaParceira, {
        id: usuario.id,
        nome: dto.nome,
        cnpj: dto.cnpj,
      });
      return usuario.id;
    });

    return this.buscar(id);
  }

  async atualizar(
    id: number,
    dto: UpdateEmpresaDto,
    usuarioLogado: UsuarioAutenticado,
  ): Promise<EmpresaParceira> {
    this.garantirPropriaEmpresa(id, usuarioLogado);
    const empresa = await this.buscar(id);
    const { email, senha, ...perfil } = dto;
    Object.assign(empresa, perfil);

    await this.dataSource.transaction(async (manager) => {
      await this.usuariosService.atualizar(manager, empresa.usuario, {
        email,
        senha,
      });
      await manager.save(empresa);
    });

    return this.buscar(id);
  }

  /** A confirmacao da exclusao e feita no frontend antes da chamada. */
  async remover(id: number, usuarioLogado: UsuarioAutenticado): Promise<void> {
    this.garantirPropriaEmpresa(id, usuarioLogado);
    await this.buscar(id);

    await this.dataSource.transaction(async (manager) => {
      await manager.delete(EmpresaParceira, { id });
      await manager.delete(Usuario, { id });
    });
  }

  /** Cada empresa so pode editar ou excluir o proprio cadastro. */
  private garantirPropriaEmpresa(id: number, usuario: UsuarioAutenticado) {
    if (usuario.tipo !== TipoUsuario.EMPRESA || usuario.id !== id) {
      throw new ForbiddenException('Acesso negado');
    }
  }
}
