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
import { BancoOrganizacao } from './infraestrutura/banco-organizacao.js';
import { RepositorioOrganizacao } from './aplicacao/portas-organizacao.js';
import { RepositorioOrganizacaoPostgres } from './infraestrutura/repositorio-organizacao-postgres.js';
import { ServicoOrganizacao } from './aplicacao/servico-organizacao.js';
import { OrganizacaoController } from './apresentacao/organizacao.controller.js';

@Module({
  controllers: [UsuariosController, OrganizacaoController],
  providers: [
    AutenticacaoGuard,
    BancoOrganizacao,
    {
      provide: RepositorioOrganizacao,
      useClass: RepositorioOrganizacaoPostgres,
    },
    {
      provide: ServicoOrganizacao,
      inject: [RepositorioOrganizacao],
      useFactory: (repositorio: RepositorioOrganizacao) =>
        new ServicoOrganizacao(repositorio),
    },
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
