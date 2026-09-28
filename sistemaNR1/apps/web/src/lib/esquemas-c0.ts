import { z } from 'zod';
import { PAPEIS_USUARIO } from '@sistemanr1/contratos';
export const statusCadastro = z.enum(['ativo', 'inativo']);
export const esquemaPerfil = z.object({
  id: z.uuid(),
  nomeCompleto: z.string(),
  status: z.enum(['ativo', 'inativo', 'pendente']),
  criadoEm: z.string(),
  atualizadoEm: z.string(),
});
export const esquemaEmpresa = z.object({
  id: z.uuid(),
  razaoSocial: z.string(),
  nomeFantasia: z.string().nullable().optional(),
  cnpj: z.string().nullable().optional(),
  emailCorporativo: z.string().nullable().optional(),
  telefone: z.string().nullable().optional(),
  status: statusCadastro,
  criadoEm: z.string(),
  atualizadoEm: z.string(),
});
export const esquemaEstrutura = z.object({
  id: z.uuid(),
  empresaId: z.uuid(),
  nome: z.string(),
  status: statusCadastro,
  criadoEm: z.string(),
  atualizadoEm: z.string(),
  descricao: z.string().optional(),
  endereco: z.string().nullable().optional(),
  caracterizacaoAmbiente: z.string().optional(),
  estabelecimentoId: z.uuid().nullable().optional(),
  setorId: z.uuid().nullable().optional(),
  funcaoId: z.uuid().nullable().optional(),
  turnoId: z.uuid().nullable().optional(),
  horarioInicio: z.string().nullable().optional(),
  horarioFim: z.string().nullable().optional(),
  quantidadeEstimadaTrabalhadores: z.number().int().positive().optional(),
});
export const esquemaProfissional = z.object({
  id: z.uuid(),
  conselho: z.string(),
  numeroRegistro: z.string(),
  uf: z.string().nullable().optional(),
  verificado: z.literal(false),
});
export const esquemaAtribuicao = z.object({
  id: z.uuid(),
  papel: z.enum(PAPEIS_USUARIO),
  status: statusCadastro,
  criadoEm: z.string(),
  revogadoEm: z.string().nullable(),
});
export const esquemaSnapshot = z.object({
  id: z.uuid(),
  empresaId: z.uuid(),
  estabelecimentoId: z.uuid(),
  revisao: z.number(),
  criadoEm: z.string(),
  populacaoTotal: z.number(),
  grupos: z.array(esquemaEstrutura),
});
