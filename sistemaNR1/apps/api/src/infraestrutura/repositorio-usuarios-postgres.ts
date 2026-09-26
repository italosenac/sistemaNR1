import { Inject, Injectable, Logger } from '@nestjs/common';
import type { OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import type { PoolClient } from 'pg';
import type {
  EmpresaPermitida,
  EntradaVinculo,
  OpcoesLotacao,
  VinculoUsuario,
} from '@sistemanr1/contratos';
import { RepositorioUsuarios } from '../aplicacao/portas-usuarios.js';
import { ErroDeUsuario, validarLotacao } from '../dominio/usuario.js';

const PROJECAO_VINCULO = `v.usuario_id AS "usuarioId", v.empresa_id AS "empresaId", p.nome_completo AS "nomeCompleto",
  v.matricula_funcional AS "matriculaFuncional", v.papel,
  v.estabelecimento_id AS "estabelecimentoId", v.setor_id AS "setorId",
  v.funcao_id AS "funcaoId", v.turno_id AS "turnoId"`;

@Injectable()
export class RepositorioUsuariosPostgres
  extends RepositorioUsuarios
  implements OnModuleDestroy
{
  private pool?: Pool;
  constructor(
    @Inject(ConfigService) private readonly configuracao: ConfigService,
  ) {
    super();
  }

  private obterPool(): Pool {
    if (!this.pool) {
      const url = this.configuracao.get<string>('DATABASE_URL');
      if (!url)
        throw new ErroDeUsuario(
          'SERVICO_INDISPONIVEL',
          'Cadastro organizacional ainda não configurado.',
        );
      this.pool = new Pool({
        connectionString: url,
        max: 5,
        connectionTimeoutMillis: 5_000,
        idleTimeoutMillis: 30_000,
      });
      this.pool.on('error', () =>
        Logger.error(
          'Uma conexão ociosa de banco foi interrompida.',
          'Persistencia',
        ),
      );
    }
    return this.pool;
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool?.end();
  }

  private async transacao<T>(
    atorId: string,
    executar: (cliente: PoolClient) => Promise<T>,
  ): Promise<T> {
    let cliente: PoolClient | undefined;
    let descartar = false;
    try {
      cliente = await this.obterPool().connect();
      await cliente.query('BEGIN');
      const papel = await cliente.query<{ seguro: boolean }>(`
        SELECT NOT r.rolsuper AND NOT r.rolbypassrls
          AND pg_has_role(current_user, 'sistemanr1_api', 'member')
          AND NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
            WHERE n.nspname='organizacao' AND c.relowner=r.oid) AS seguro
        FROM pg_roles r WHERE r.rolname=current_user`);
      if (!papel.rows[0]?.seguro)
        throw new ErroDeUsuario(
          'SERVICO_INDISPONIVEL',
          'A conexão exige um papel restrito de aplicação.',
        );
      await cliente.query(
        "SELECT set_config('request.jwt.claim.sub', $1, true)",
        [atorId],
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
          : undefined;
      if (codigo === '23505')
        throw new ErroDeUsuario(
          'VINCULO_DUPLICADO',
          'Matrícula ou vínculo já cadastrado nesta empresa.',
        );
      if (codigo === '23503' || codigo === '23514')
        throw new ErroDeUsuario(
          'LOTACAO_INVALIDA',
          'Identidade ou lotação inválida para esta empresa.',
        );
      throw new ErroDeUsuario(
        'SERVICO_INDISPONIVEL',
        'Não foi possível acessar o cadastro organizacional.',
      );
    } finally {
      cliente?.release(descartar);
    }
  }

  private async exigirGestor(
    cliente: PoolClient,
    atorId: string,
    empresaId: string,
  ): Promise<void> {
    const resultado = await cliente.query(
      `SELECT v.usuario_id FROM organizacao.vinculos v
      JOIN organizacao.empresas e ON e.id=v.empresa_id
      WHERE v.empresa_id=$1 AND v.usuario_id=$2 AND v.ativo AND v.papel='gestor' AND NOT e.arquivado`,
      [empresaId, atorId],
    );
    if (resultado.rowCount !== 1)
      throw new ErroDeUsuario(
        'SEM_PERMISSAO',
        'Você não tem permissão para gerenciar usuários nesta empresa.',
      );
  }

  private async validarEntrada(
    cliente: PoolClient,
    empresaId: string,
    entrada: EntradaVinculo,
  ): Promise<void> {
    validarLotacao(entrada);
    const resultado = await cliente.query<{ valida: boolean }>(
      `SELECT
      ($2::uuid IS NULL OR EXISTS(SELECT 1 FROM organizacao.estabelecimentos WHERE empresa_id=$1 AND id=$2 AND NOT arquivado))
      AND ($3::uuid IS NULL OR EXISTS(SELECT 1 FROM organizacao.setores WHERE empresa_id=$1 AND estabelecimento_id=$2 AND id=$3 AND NOT arquivado))
      AND ($4::uuid IS NULL OR EXISTS(SELECT 1 FROM organizacao.funcoes WHERE empresa_id=$1 AND id=$4 AND NOT arquivado))
      AND ($5::uuid IS NULL OR EXISTS(SELECT 1 FROM organizacao.turnos WHERE empresa_id=$1 AND id=$5 AND NOT arquivado)) AS valida`,
      [
        empresaId,
        entrada.estabelecimentoId ?? null,
        entrada.setorId ?? null,
        entrada.funcaoId ?? null,
        entrada.turnoId ?? null,
      ],
    );
    if (!resultado.rows[0]?.valida)
      throw new ErroDeUsuario(
        'LOTACAO_INVALIDA',
        'A lotação selecionada não é válida nesta empresa.',
      );
    const matricula = await cliente.query(
      `SELECT 1 FROM organizacao.vinculos
      WHERE empresa_id=$1 AND lower(matricula_funcional)=lower($2)`,
      [empresaId, entrada.matriculaFuncional],
    );
    if (matricula.rowCount)
      throw new ErroDeUsuario(
        'MATRICULA_DUPLICADA',
        'Matrícula já cadastrada nesta empresa.',
      );
  }

  listarEmpresas(atorId: string): Promise<EmpresaPermitida[]> {
    return this.transacao(
      atorId,
      async (cliente) =>
        (
          await cliente.query<EmpresaPermitida>(
            `
      SELECT e.id,e.nome,v.papel FROM organizacao.empresas e JOIN organizacao.vinculos v ON v.empresa_id=e.id
      WHERE v.usuario_id=$1 AND v.ativo AND NOT e.arquivado ORDER BY e.nome`,
            [atorId],
          )
        ).rows,
    );
  }

  validarCadastro(
    atorId: string,
    empresaId: string,
    entrada: EntradaVinculo,
  ): Promise<void> {
    return this.transacao(atorId, async (cliente) => {
      await this.exigirGestor(cliente, atorId, empresaId);
      await this.validarEntrada(cliente, empresaId, entrada);
    });
  }

  vincular(
    atorId: string,
    empresaId: string,
    usuarioId: string,
    entrada: EntradaVinculo,
  ): Promise<VinculoUsuario> {
    return this.transacao(atorId, async (cliente) => {
      await this.exigirGestor(cliente, atorId, empresaId);
      await this.validarEntrada(cliente, empresaId, entrada);
      await cliente.query(
        `INSERT INTO organizacao.vinculos
        (empresa_id,usuario_id,matricula_funcional,papel,estabelecimento_id,setor_id,funcao_id,turno_id)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          empresaId,
          usuarioId,
          entrada.matriculaFuncional,
          entrada.papel,
          entrada.estabelecimentoId ?? null,
          entrada.setorId ?? null,
          entrada.funcaoId ?? null,
          entrada.turnoId ?? null,
        ],
      );
      const resultado = await cliente.query<VinculoUsuario>(
        `SELECT ${PROJECAO_VINCULO}
        FROM organizacao.vinculos v JOIN organizacao.perfis_usuarios p ON p.usuario_id=v.usuario_id
        WHERE v.empresa_id=$1 AND v.usuario_id=$2`,
        [empresaId, usuarioId],
      );
      if (!resultado.rows[0])
        throw new ErroDeUsuario(
          'SERVICO_INDISPONIVEL',
          'Não foi possível confirmar o vínculo.',
        );
      return resultado.rows[0];
    });
  }

  listarUsuarios(atorId: string, empresaId: string): Promise<VinculoUsuario[]> {
    return this.transacao(atorId, async (cliente) => {
      await this.exigirGestor(cliente, atorId, empresaId);
      return (
        await cliente.query<VinculoUsuario>(
          `SELECT ${PROJECAO_VINCULO}
        FROM organizacao.vinculos v JOIN organizacao.perfis_usuarios p ON p.usuario_id=v.usuario_id
        WHERE v.empresa_id=$1 AND v.ativo ORDER BY p.nome_completo`,
          [empresaId],
        )
      ).rows;
    });
  }

  obterOpcoes(atorId: string, empresaId: string): Promise<OpcoesLotacao> {
    return this.transacao(atorId, async (cliente) => {
      await this.exigirGestor(cliente, atorId, empresaId);
      const estabelecimentos = await cliente.query<
        OpcoesLotacao['estabelecimentos'][number]
      >(
        'SELECT id,nome FROM organizacao.estabelecimentos WHERE empresa_id=$1 AND NOT arquivado ORDER BY nome',
        [empresaId],
      );
      const setores = await cliente.query<OpcoesLotacao['setores'][number]>(
        'SELECT id,nome,estabelecimento_id AS "estabelecimentoId" FROM organizacao.setores WHERE empresa_id=$1 AND NOT arquivado ORDER BY nome',
        [empresaId],
      );
      const funcoes = await cliente.query<OpcoesLotacao['funcoes'][number]>(
        'SELECT id,nome FROM organizacao.funcoes WHERE empresa_id=$1 AND NOT arquivado ORDER BY nome',
        [empresaId],
      );
      const turnos = await cliente.query<OpcoesLotacao['turnos'][number]>(
        'SELECT id,nome FROM organizacao.turnos WHERE empresa_id=$1 AND NOT arquivado ORDER BY nome',
        [empresaId],
      );
      return {
        estabelecimentos: estabelecimentos.rows,
        setores: setores.rows,
        funcoes: funcoes.rows,
        turnos: turnos.rows,
      };
    });
  }
}
