import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsuarioAutenticado } from '../auth/auth.decorators.js';
import { TipoUsuario } from '../usuarios/usuario.entity.js';
import { CreateVantagemDto } from './dto/create-vantagem.dto.js';
import { UpdateVantagemDto } from './dto/update-vantagem.dto.js';
import { Vantagem } from './vantagem.entity.js';

@Injectable()
export class VantagensService {
  constructor(
    @InjectRepository(Vantagem)
    private readonly vantagemRepository: Repository<Vantagem>,
  ) {}

  /** Vantagens disponiveis para troca, de todas as empresas (HU07). */
  listar(): Promise<Vantagem[]> {
    return this.vantagemRepository.find({
      where: { ativa: true },
      order: { custo: 'ASC', nome: 'ASC' },
    });
  }

  /** Vantagens ativas da empresa logada, para ela gerenciar (HU14). */
  listarDaEmpresa(usuario: UsuarioAutenticado): Promise<Vantagem[]> {
    this.garantirEmpresa(usuario);
    return this.vantagemRepository.find({
      where: { ativa: true, empresa: { id: usuario.id } },
      order: { nome: 'ASC' },
    });
  }

  async buscar(id: number): Promise<Vantagem> {
    const vantagem = await this.vantagemRepository.findOneBy({
      id,
      ativa: true,
    });
    if (!vantagem) {
      throw new NotFoundException('Vantagem não encontrada.');
    }
    return vantagem;
  }

  async criar(
    dto: CreateVantagemDto,
    usuario: UsuarioAutenticado,
  ): Promise<Vantagem> {
    this.garantirEmpresa(usuario);
    const { id } = await this.vantagemRepository.save(
      this.vantagemRepository.create({ ...dto, empresa: { id: usuario.id } }),
    );
    return this.buscar(id);
  }

  async atualizar(
    id: number,
    dto: UpdateVantagemDto,
    usuario: UsuarioAutenticado,
  ): Promise<Vantagem> {
    const vantagem = await this.buscarDaEmpresa(id, usuario);
    await this.vantagemRepository.save(Object.assign(vantagem, dto));
    return this.buscar(id);
  }

  async remover(id: number, usuario: UsuarioAutenticado): Promise<void> {
    await this.buscarDaEmpresa(id, usuario);
    await this.vantagemRepository.update({ id }, { ativa: false });
  }

  /** Cada empresa so pode editar ou remover as proprias vantagens. */
  private async buscarDaEmpresa(
    id: number,
    usuario: UsuarioAutenticado,
  ): Promise<Vantagem> {
    this.garantirEmpresa(usuario);
    const vantagem = await this.buscar(id);
    if (vantagem.empresa.id !== usuario.id) {
      throw new ForbiddenException(
        'Você só pode alterar as vantagens da sua empresa.',
      );
    }
    return vantagem;
  }

  private garantirEmpresa(usuario: UsuarioAutenticado) {
    if (usuario.tipo !== TipoUsuario.EMPRESA) {
      throw new ForbiddenException(
        'Apenas empresas parceiras podem gerenciar vantagens.',
      );
    }
  }
}
