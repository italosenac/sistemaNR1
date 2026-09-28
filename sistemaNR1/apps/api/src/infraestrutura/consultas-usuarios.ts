import type { PoolClient } from 'pg';
import type { EntradaVinculo, VinculoUsuario } from '@sistemanr1/contratos';
import { ErroDeUsuario, validarLotacao } from '../dominio/usuario.js';
import { normalizarMatricula } from '../dominio/organizacao.js';

export const PROJECAO_VINCULO = `v.id,v.usuario_id AS "usuarioId",v.empresa_id AS "empresaId",p.nome_completo AS "nomeCompleto",
 v.matricula AS "matriculaFuncional",v.status,
 ARRAY(SELECT a.papel FROM organizacao.atribuicoes_papel a WHERE a.vinculo_organizacional_id=v.id AND a.status='ativo' ORDER BY a.papel) AS papeis,
 l.estabelecimento_id AS "estabelecimentoId",l.setor_id AS "setorId",l.funcao_id AS "funcaoId",l.turno_id AS "turnoId",l.status AS "lotacaoStatus"`;
export const ORIGEM_VINCULO = `organizacao.vinculos_organizacionais v JOIN organizacao.perfis p ON p.id=v.usuario_id
 LEFT JOIN organizacao.lotacoes_usuario l ON l.vinculo_organizacional_id=v.id AND l.empresa_id=v.empresa_id`;
export async function obterVinculo(
  cliente: PoolClient,
  empresaId: string,
  id: string,
): Promise<VinculoUsuario> {
  const resultado = await cliente.query<VinculoUsuario>(
    `SELECT ${PROJECAO_VINCULO} FROM ${ORIGEM_VINCULO} WHERE v.empresa_id=$1 AND v.id=$2`,
    [empresaId, id],
  );
  if (!resultado.rows[0])
    throw new ErroDeUsuario(
      'NAO_ENCONTRADO',
      'Vínculo não encontrado nesta empresa.',
    );
  return resultado.rows[0];
}
export async function validarEntradaVinculo(
  cliente: PoolClient,
  empresaId: string,
  entrada: EntradaVinculo,
) {
  validarLotacao(entrada);
  const referencias = await cliente.query<{ valida: boolean }>(
    `SELECT
 ($2::uuid IS NULL OR EXISTS(SELECT 1 FROM organizacao.estabelecimentos WHERE empresa_id=$1 AND id=$2 AND status='ativo'))
 AND ($3::uuid IS NULL OR EXISTS(SELECT 1 FROM organizacao.setores WHERE empresa_id=$1 AND estabelecimento_id=$2 AND id=$3 AND status='ativo'))
 AND ($4::uuid IS NULL OR EXISTS(SELECT 1 FROM organizacao.funcoes WHERE empresa_id=$1 AND id=$4 AND status='ativo'))
 AND ($5::uuid IS NULL OR EXISTS(SELECT 1 FROM organizacao.turnos WHERE empresa_id=$1 AND id=$5 AND status='ativo')) AS valida`,
    [
      empresaId,
      entrada.estabelecimentoId ?? null,
      entrada.setorId ?? null,
      entrada.funcaoId ?? null,
      entrada.turnoId ?? null,
    ],
  );
  if (!referencias.rows[0]?.valida)
    throw new ErroDeUsuario(
      'LOTACAO_INVALIDA',
      'A lotação selecionada não é válida nesta empresa.',
    );
  const matricula = normalizarMatricula(entrada.matriculaFuncional);
  if (matricula) {
    const repetida = await cliente.query(
      'SELECT 1 FROM organizacao.vinculos_organizacionais WHERE empresa_id=$1 AND lower(matricula)=lower($2)',
      [empresaId, matricula],
    );
    if (repetida.rowCount)
      throw new ErroDeUsuario(
        'MATRICULA_DUPLICADA',
        'Matrícula já cadastrada nesta empresa.',
      );
  }
}
