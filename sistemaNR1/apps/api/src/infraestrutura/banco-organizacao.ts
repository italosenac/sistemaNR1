import { Inject, Injectable, Logger } from '@nestjs/common';
import type { OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFileSync } from 'node:fs';
import { Pool } from 'pg';
import type { PoolClient } from 'pg';
import type { Capacidade, EmpresaPermitida } from '@sistemanr1/contratos';
import { ErroDeUsuario } from '../dominio/usuario.js';
import { capacidadesDosPapeis } from '../dominio/organizacao.js';

@Injectable()
export class BancoOrganizacao implements OnModuleDestroy {
  private pool?: Pool;
  constructor(
    @Inject(ConfigService) private readonly configuracao: ConfigService,
  ) {}
  private obterPool(): Pool {
    if (this.pool) return this.pool;
    const conexao = this.configuracao.get<string>('DATABASE_URL');
    if (!conexao)
      throw new ErroDeUsuario(
        'SERVICO_INDISPONIVEL',
        'Persistência organizacional ainda não configurada.',
      );
    const url = new URL(conexao);
    const local = ['localhost', '127.0.0.1', '::1', '[::1]'].includes(
      url.hostname,
    );
    if (
      !local &&
      url.searchParams.has('sslmode') &&
      url.searchParams.get('sslmode') !== 'verify-full'
    )
      throw new ErroDeUsuario(
        'SERVICO_INDISPONIVEL',
        'A conexão remota exige TLS com verificação de certificado.',
      );
    let parametros: ConstructorParameters<typeof Pool>[0];
    if (local) {
      parametros = { connectionString: conexao, ssl: false };
    } else {
      const caminhoCa = this.configuracao.get<string>('DATABASE_CA_CERT_PATH');
      if (!caminhoCa)
        throw new ErroDeUsuario(
          'SERVICO_INDISPONIVEL',
          'O certificado CA da conexão remota não foi configurado.',
        );
      let ca: string;
      try {
        ca = readFileSync(caminhoCa, 'utf8');
      } catch {
        throw new ErroDeUsuario(
          'SERVICO_INDISPONIVEL',
          'O certificado CA da conexão remota está indisponível.',
        );
      }
      parametros = {
        host: url.hostname,
        port: Number(url.port || 5432),
        database: decodeURIComponent(url.pathname.slice(1)),
        user: decodeURIComponent(url.username),
        password: decodeURIComponent(url.password),
        ssl: { ca, rejectUnauthorized: true, servername: url.hostname },
      };
    }
    this.pool = new Pool({
      ...parametros,
      max: 5,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
    });
    this.pool.on('error', () =>
      Logger.error('Conexão ociosa interrompida.', 'Persistencia'),
    );
    return this.pool;
  }
  async onModuleDestroy() {
    await this.pool?.end();
  }
  async transacao<T>(
    atorId: string,
    executar: (cliente: PoolClient) => Promise<T>,
  ): Promise<T> {
    let cliente: PoolClient | undefined;
    let descartar = false;
    try {
      cliente = await this.obterPool().connect();
      await cliente.query('BEGIN');
      const papel = await cliente.query<{
        seguro: boolean;
      }>(`SELECT NOT r.rolsuper AND NOT r.rolbypassrls AND NOT r.rolcreaterole
        AND pg_has_role(current_user,'sistemanr1_api','member')
        AND NOT EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='organizacao' AND pg_has_role(current_user,c.relowner,'member')) AS seguro
        FROM pg_roles r WHERE r.rolname=current_user`);
      if (!papel.rows[0]?.seguro)
        throw new ErroDeUsuario(
          'SERVICO_INDISPONIVEL',
          'A persistência exige um login restrito de aplicação.',
        );
      await cliente.query(
        "SELECT set_config('request.jwt.claim.sub',$1,true), set_config('request.jwt.claims',$2,true), set_config('statement_timeout','15000',true)",
        [atorId, JSON.stringify({ sub: atorId, role: 'authenticated' })],
      );
      const resultado = await executar(cliente);
      await cliente.query('COMMIT');
      return resultado;
    } catch (erro) {
      if (cliente) {
        try {
          await cliente.query('ROLLBACK');
        } catch {
          descartar = true;
        }
      }
      if (erro instanceof ErroDeUsuario) throw erro;
      const codigo =
        typeof erro === 'object' && erro !== null && 'code' in erro
          ? erro.code
          : '';
      const restricao =
        typeof erro === 'object' && erro !== null && 'constraint' in erro
          ? erro.constraint
          : '';
      if (codigo === '42501')
        throw new ErroDeUsuario(
          'SEM_PERMISSAO',
          'Você não tem permissão para esta operação.',
        );
      if (codigo === '23505')
        throw new ErroDeUsuario(
          restricao === 'matricula_unica_empresa'
            ? 'MATRICULA_DUPLICADA'
            : 'CONFLITO',
          'Já existe um cadastro ou atribuição com esses dados.',
        );
      if (codigo === '23503' || codigo === '23514')
        throw new ErroDeUsuario(
          'DADOS_INVALIDOS',
          'Confira as referências, a população e os gestores ativos. A operação viola uma restrição do cadastro.',
        );
      throw new ErroDeUsuario(
        'SERVICO_INDISPONIVEL',
        'Não foi possível acessar o cadastro organizacional.',
      );
    } finally {
      cliente?.release(descartar);
    }
  }
  async empresas(cliente: PoolClient): Promise<EmpresaPermitida[]> {
    const resultado = await cliente.query<
      Omit<EmpresaPermitida, 'capacidades'>
    >('SELECT * FROM organizacao.minhas_empresas()');
    return resultado.rows.map((empresa) => ({
      ...empresa,
      capacidades: capacidadesDosPapeis(empresa.papeis),
    }));
  }
  async exigirPerfilAtivo(cliente: PoolClient): Promise<void> {
    const resultado = await cliente.query<{ ativo: boolean }>(
      'SELECT organizacao.perfil_ativo() AS ativo',
    );
    if (!resultado.rows[0]?.ativo)
      throw new ErroDeUsuario(
        'SEM_PERMISSAO',
        'Sua conta precisa estar ativa para continuar.',
      );
  }
  async autorizar(
    cliente: PoolClient,
    empresaId: string,
    capacidade: Capacidade | null,
    escrita = false,
  ): Promise<void> {
    if (escrita)
      await cliente.query('SELECT organizacao.bloquear_empresa($1)', [
        empresaId,
      ]);
    const empresa = (await this.empresas(cliente)).find(
      (item) => item.id === empresaId,
    );
    if (!empresa || (capacidade && !empresa.capacidades.includes(capacidade)))
      throw new ErroDeUsuario(
        'SEM_PERMISSAO',
        'Você não tem permissão para esta operação na empresa selecionada.',
      );
  }
  comEmpresa<T>(
    atorId: string,
    empresaId: string,
    capacidade: Capacidade | null,
    escrita: boolean,
    executar: (cliente: PoolClient) => Promise<T>,
  ) {
    return this.transacao(atorId, async (cliente) => {
      await this.autorizar(cliente, empresaId, capacidade, escrita);
      return executar(cliente);
    });
  }
}
