import { Module } from '@nestjs/common';
import {
  Identidades,
  RepositorioUsuarios,
} from './aplicacao/portas-usuarios.js';
import { ServicoUsuarios } from './aplicacao/servico-usuarios.js';
import { IdentidadesSupabase } from './infraestrutura/identidades-supabase.js';
import { RepositorioUsuariosPostgres } from './infraestrutura/repositorio-usuarios-postgres.js';
import { UsuariosController } from './apresentacao/usuarios.controller.js';
import { AutenticacaoGuard } from './apresentacao/autenticacao.guard.js';

@Module({
  controllers: [UsuariosController],
  providers: [
    AutenticacaoGuard,
    { provide: Identidades, useClass: IdentidadesSupabase },
    { provide: RepositorioUsuarios, useClass: RepositorioUsuariosPostgres },
    {
      provide: ServicoUsuarios,
      inject: [Identidades, RepositorioUsuarios],
      useFactory: (
        identidades: Identidades,
        repositorio: RepositorioUsuarios,
      ) => new ServicoUsuarios(identidades, repositorio),
    },
  ],
})
export class UsuariosModule {}
