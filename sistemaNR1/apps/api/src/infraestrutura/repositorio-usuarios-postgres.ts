import { Inject, Injectable } from '@nestjs/common';
import type {
  EmpresaPermitida,
  EntradaVinculo,
  OpcoesLotacao,
  VinculoUsuario,
} from '@sistemanr1/contratos';
import { RepositorioUsuarios } from '../aplicacao/portas-usuarios.js';
import { BancoOrganizacao } from './banco-organizacao.js';
import {
  ORIGEM_VINCULO,
  PROJECAO_VINCULO,
  obterVinculo,
  validarEntradaVinculo,
} from './consultas-usuarios.js';
import { normalizarMatricula } from '../dominio/organizacao.js';
import { ErroDeUsuario } from '../dominio/usuario.js';

@Injectable()
export class RepositorioUsuariosPostgres extends RepositorioUsuarios {
  constructor(
    @Inject(BancoOrganizacao) private readonly banco: BancoOrganizacao,
  ) {
    super();
  }
  listarEmpresas(atorId: string): Promise<EmpresaPermitida[]> {
    return this.banco.transacao(atorId, async (c) => {
      await this.banco.exigirPerfilAtivo(c);
      return this.banco.empresas(c);
    });
  }
  validarCadastro(atorId: string, empresaId: string, entrada: EntradaVinculo) {
    return this.banco.comEmpresa(
      atorId,
      empresaId,
      'usuarios:gerenciar',
      false,
      (c) => validarEntradaVinculo(c, empresaId, entrada),
    );
  }
  vincular(
    atorId: string,
    empresaId: string,
    usuarioId: string,
    entrada: EntradaVinculo,
  ): Promise<VinculoUsuario> {
    return this.banco.comEmpresa(
      atorId,
      empresaId,
      'usuarios:gerenciar',
      true,
      async (c) => {
        if (atorId === usuarioId)
          throw new ErroDeUsuario(
            'SEM_PERMISSAO',
            'Você não pode atribuir vínculos ou papéis a si mesmo.',
          );
        await validarEntradaVinculo(c, empresaId, entrada);
        await c.query("SELECT set_config('sistemanr1.motivo',$1,true)", [
          entrada.motivo,
        ]);
        const { rows } = await c.query<{ id: string }>(
          `INSERT INTO organizacao.vinculos_organizacionais(empresa_id,usuario_id,matricula) VALUES($1,$2,$3) RETURNING id`,
          [
            empresaId,
            usuarioId,
            normalizarMatricula(entrada.matriculaFuncional),
          ],
        );
        const id = rows[0].id;
        for (const papel of entrada.papeis)
          await c.query(
            `INSERT INTO organizacao.atribuicoes_papel(empresa_id,vinculo_organizacional_id,papel,concedido_por,motivo) VALUES($1,$2,$3,$4,$5)`,
            [empresaId, id, papel, atorId, entrada.motivo],
          );
        if (
          entrada.estabelecimentoId ||
          entrada.setorId ||
          entrada.funcaoId ||
          entrada.turnoId
        )
          await c.query(
            `INSERT INTO organizacao.lotacoes_usuario(empresa_id,vinculo_organizacional_id,estabelecimento_id,setor_id,funcao_id,turno_id) VALUES($1,$2,$3,$4,$5,$6)`,
            [
              empresaId,
              id,
              entrada.estabelecimentoId ?? null,
              entrada.setorId ?? null,
              entrada.funcaoId ?? null,
              entrada.turnoId ?? null,
            ],
          );
        return obterVinculo(c, empresaId, id);
      },
    );
  }
  listarUsuarios(atorId: string, empresaId: string): Promise<VinculoUsuario[]> {
    return this.banco.comEmpresa(
      atorId,
      empresaId,
      'usuarios:gerenciar',
      false,
      async (c) =>
        (
          await c.query<VinculoUsuario>(
            `SELECT ${PROJECAO_VINCULO} FROM ${ORIGEM_VINCULO} WHERE v.empresa_id=$1 ORDER BY p.nome_completo`,
            [empresaId],
          )
        ).rows,
    );
  }
  obterOpcoes(atorId: string, empresaId: string): Promise<OpcoesLotacao> {
    return this.banco.comEmpresa(
      atorId,
      empresaId,
      'estrutura:ler',
      false,
      async (c) => {
        const estabelecimentos = await c.query<
          OpcoesLotacao['estabelecimentos'][number]
        >(
          "SELECT id,nome FROM organizacao.estabelecimentos WHERE empresa_id=$1 AND status='ativo' ORDER BY nome",
          [empresaId],
        );
        const setores = await c.query<OpcoesLotacao['setores'][number]>(
          `SELECT id,nome,estabelecimento_id AS "estabelecimentoId" FROM organizacao.setores WHERE empresa_id=$1 AND status='ativo' ORDER BY nome`,
          [empresaId],
        );
        const funcoes = await c.query<OpcoesLotacao['funcoes'][number]>(
          "SELECT id,nome FROM organizacao.funcoes WHERE empresa_id=$1 AND status='ativo' ORDER BY nome",
          [empresaId],
        );
        const turnos = await c.query<OpcoesLotacao['turnos'][number]>(
          "SELECT id,nome FROM organizacao.turnos WHERE empresa_id=$1 AND status='ativo' ORDER BY nome",
          [empresaId],
        );
        return {
          estabelecimentos: estabelecimentos.rows,
          setores: setores.rows,
          funcoes: funcoes.rows,
          turnos: turnos.rows,
        };
      },
    );
  }
}
