import { Module } from '@nestjs/common';
import { UsuariosModule } from '../usuarios/usuarios.module.js';
import { SeedService } from './seed.service.js';

@Module({
  imports: [UsuariosModule],
  providers: [SeedService],
})
export class SeedModule {}
