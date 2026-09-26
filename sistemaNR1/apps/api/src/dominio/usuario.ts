import type { LotacaoUsuario } from '@sistemanr1/contratos';

export type CodigoErroUsuario =
  | 'NAO_AUTENTICADO'
  | 'SEM_PERMISSAO'
  | 'LOTACAO_INVALIDA'
  | 'MATRICULA_DUPLICADA'
  | 'VINCULO_DUPLICADO'
  | 'IDENTIDADE_RECUSADA'
  | 'SERVICO_INDISPONIVEL'
  | 'CADASTRO_PARCIAL';
export class ErroDeUsuario extends Error {
  constructor(
    readonly codigo: CodigoErroUsuario,
    mensagem: string,
    readonly usuarioIdCriado?: string,
  ) {
    super(mensagem);
  }
}
export function validarLotacao(lotacao: LotacaoUsuario): void {
  if (lotacao.setorId && !lotacao.estabelecimentoId) {
    throw new ErroDeUsuario(
      'LOTACAO_INVALIDA',
      'Selecione o estabelecimento do setor.',
    );
  }
}
