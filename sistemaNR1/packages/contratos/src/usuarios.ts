export const PAPEIS_USUARIO = ['gestor', 'tecnico', 'leitor'] as const;
export type PapelUsuario = (typeof PAPEIS_USUARIO)[number];

export interface LotacaoUsuario {
  estabelecimentoId?: string | null;
  setorId?: string | null;
  funcaoId?: string | null;
  turnoId?: string | null;
}
export interface EntradaVinculo extends LotacaoUsuario {
  matriculaFuncional: string;
  papel: PapelUsuario;
}
export interface CadastroUsuario extends EntradaVinculo {
  nomeCompleto: string;
  email: string;
  senha: string;
}
export interface VincularUsuario extends EntradaVinculo {
  usuarioId: string;
}
export interface VinculoUsuario extends EntradaVinculo {
  usuarioId: string;
  empresaId: string;
  nomeCompleto: string;
}
export interface EmpresaPermitida {
  id: string;
  nome: string;
  papel: PapelUsuario;
}
export interface ReferenciaOrganizacional {
  id: string;
  nome: string;
}
export interface OpcoesLotacao {
  estabelecimentos: ReferenciaOrganizacional[];
  setores: (ReferenciaOrganizacional & { estabelecimentoId: string })[];
  funcoes: ReferenciaOrganizacional[];
  turnos: ReferenciaOrganizacional[];
}
