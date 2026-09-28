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
import { ColetaController } from './apresentacao/coleta.controller.js';
import { CampanhasController } from './apresentacao/campanhas.controller.js';
import { ServicoColeta } from './aplicacao/servico-coleta.js';
import { ServicoAvaliacao } from './aplicacao/servico-avaliacao.js';
import { AvaliacaoController } from './apresentacao/avaliacao.controller.js';
import { ServicoInventario } from './aplicacao/servico-inventario.js';
import { InventarioController } from './apresentacao/inventario.controller.js';

@Module({
  controllers: [
    UsuariosController,
    OrganizacaoController,
    ColetaController,
    CampanhasController,
    AvaliacaoController,
    InventarioController,
  ],
  providers: [
    AutenticacaoGuard,
    BancoOrganizacao,
    ServicoColeta,
    ServicoAvaliacao,
    ServicoInventario,
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
