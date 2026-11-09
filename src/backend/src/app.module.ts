import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlunosModule } from './alunos/alunos.module.js';
import { AuthModule } from './auth/auth.module.js';
import { EmpresasModule } from './empresas/empresas.module.js';
import { InstituicoesModule } from './instituicoes/instituicoes.module.js';
import { ProfessoresModule } from './professores/professores.module.js';
import { SeedModule } from './seeds/seed.module.js';
import { TransacoesModule } from './transacoes/transacoes.module.js';
import { UsuariosModule } from './usuarios/usuarios.module.js';
import { VantagensModule } from './vantagens/vantagens.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // SQLite embarcado: nao precisa de container nem instalacao externa.
    // DB_DATABASE=":memory:" recria o banco vazio a cada reinicio.
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'better-sqlite3',
        database: config.get('DB_DATABASE', 'moeda.sqlite'),
        autoLoadEntities: true,
        // Cria/atualiza as tabelas a partir das entidades (apenas para dev).
        synchronize: true,
      }),
    }),
    UsuariosModule,
    AuthModule,
    InstituicoesModule,
    AlunosModule,
    EmpresasModule,
    ProfessoresModule,
    TransacoesModule,
    VantagensModule,
    SeedModule,
  ],
})
export class AppModule {}
