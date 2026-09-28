export const PAPEIS_USUARIO = [
  'trabalhador',
  'gestor_sst_rh',
  'responsavel_tecnico',
  'consultoria',
] as const;
export type PapelUsuario = (typeof PAPEIS_USUARIO)[number];
export type StatusCadastro = 'ativo' | 'inativo';
export type Capacidade =
  | 'empresa:ler'
  | 'empresa:editar'
  | 'estrutura:ler'
  | 'estrutura:gerenciar'
  | 'usuarios:gerenciar'
  | 'carteira:ler';

export interface LotacaoUsuario {
  estabelecimentoId?: string | null;
  setorId?: string | null;
  funcaoId?: string | null;
  turnoId?: string | null;
}
export interface EntradaVinculo extends LotacaoUsuario {
  matriculaFuncional?: string | null;
  papeis: PapelUsuario[];
  motivo: string;
}
export interface CadastroUsuario extends EntradaVinculo {
  nomeCompleto: string;
  email: string;
  senha: string;
}
export interface VincularUsuario extends EntradaVinculo {
  usuarioId: string;
}
export interface VinculoUsuario extends LotacaoUsuario {
  id: string;
  usuarioId: string;
  empresaId: string;
  nomeCompleto: string;
  matriculaFuncional: string | null;
  status: StatusCadastro;
  papeis: PapelUsuario[];
  lotacaoStatus?: StatusCadastro | null;
}
export interface EmpresaPermitida {
  id: string;
  nome: string;
  papeis: PapelUsuario[];
  capacidades: Capacidade[];
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

export interface PerfilUsuario {
  id: string;
  nomeCompleto: string;
  status: StatusCadastro | 'pendente';
  criadoEm: string;
  atualizadoEm: string;
}
export interface DadosEmpresa {
  razaoSocial: string;
  nomeFantasia?: string | null;
  cnpj?: string | null;
  emailCorporativo?: string | null;
  telefone?: string | null;
}
export interface Empresa extends DadosEmpresa {
  id: string;
  status: StatusCadastro;
  criadoEm: string;
  atualizadoEm: string;
}
export const TIPOS_ESTRUTURA = [
  'estabelecimentos',
  'setores',
  'funcoes',
  'turnos',
  'grupos',
] as const;
export type TipoEstrutura = (typeof TIPOS_ESTRUTURA)[number];
export interface DadosEstrutura extends LotacaoUsuario {
  nome: string;
  descricao?: string;
  endereco?: string | null;
  caracterizacaoAmbiente?: string;
  horarioInicio?: string | null;
  horarioFim?: string | null;
  quantidadeEstimadaTrabalhadores?: number;
  status: StatusCadastro;
}
export interface RegistroEstrutura extends DadosEstrutura {
  id: string;
  empresaId: string;
  criadoEm: string;
  atualizadoEm: string;
}
export interface DadosProfissionais {
  conselho: string;
  numeroRegistro: string;
  uf?: string | null;
}
export interface IdentificacaoProfissional extends DadosProfissionais {
  id: string;
  verificado: false;
}
export interface AtribuicaoPapel {
  id: string;
  papel: PapelUsuario;
  status: StatusCadastro;
  criadoEm: string;
  revogadoEm: string | null;
}
export interface EstruturaCongelada {
  id: string;
  empresaId: string;
  estabelecimentoId: string;
  revisao: number;
  criadoEm: string;
  populacaoTotal: number;
  grupos: RegistroEstrutura[];
}
