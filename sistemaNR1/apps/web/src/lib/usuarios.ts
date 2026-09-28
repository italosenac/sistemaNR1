import { z } from 'zod';
import { PAPEIS_USUARIO } from '@sistemanr1/contratos';

const referencia = z.object({ id: z.uuid(), nome: z.string() });
export const esquemaEmpresas = z.array(
  referencia.extend({
    papeis: z.array(z.enum(PAPEIS_USUARIO)),
    capacidades: z.array(
      z.enum([
        'empresa:ler',
        'empresa:editar',
        'estrutura:ler',
        'estrutura:gerenciar',
        'usuarios:gerenciar',
        'carteira:ler',
      ]),
    ),
  }),
);
export const esquemaOpcoes = z.object({
  estabelecimentos: z.array(referencia),
  setores: z.array(referencia.extend({ estabelecimentoId: z.uuid() })),
  funcoes: z.array(referencia),
  turnos: z.array(referencia),
});
export const esquemaVinculo = z.object({
  id: z.uuid(),
  usuarioId: z.uuid(),
  empresaId: z.uuid(),
  nomeCompleto: z.string(),
  matriculaFuncional: z.string().nullable(),
  status: z.enum(['ativo', 'inativo']),
  papeis: z.array(z.enum(PAPEIS_USUARIO)),
  estabelecimentoId: z.uuid().nullable().optional(),
  setorId: z.uuid().nullable().optional(),
  funcaoId: z.uuid().nullable().optional(),
  turnoId: z.uuid().nullable().optional(),
  lotacaoStatus: z.enum(['ativo', 'inativo']).nullable().optional(),
});
const mensagensPorCodigo: Record<string, string> = {
  DADOS_INVALIDOS:
    'Confira os dados, as referências da empresa e os gestores ativos.',
  CONFLITO: 'Já existe um cadastro com esses dados ou há grupos sobrepostos.',
  NAO_ENCONTRADO: 'Registro não encontrado no contexto autorizado.',
  NAO_AUTENTICADO: 'Sua sessão expirou. Entre novamente.',
  SEM_PERMISSAO:
    'Você não tem permissão para gerenciar usuários nesta empresa.',
  LOTACAO_INVALIDA:
    'Confira a lotação: todas as referências devem pertencer à empresa selecionada.',
  MATRICULA_DUPLICADA: 'Esta matrícula já está cadastrada na empresa.',
  VINCULO_DUPLICADO:
    'Já existe uma matrícula ou vínculo com esses dados nesta empresa.',
  IDENTIDADE_RECUSADA:
    'Não foi possível criar a conta. Confira os dados ou vincule uma conta existente.',
  CADASTRO_PARCIAL:
    'A identidade foi criada, mas o vínculo não foi confirmado. Verifique antes de repetir.',
  SERVICO_INDISPONIVEL:
    'O cadastro está indisponível no momento. Tente novamente mais tarde.',
};

export async function consultarApi<T>(
  caminho: string,
  token: string,
  esquema: z.ZodType<T>,
  opcoes?: { corpo?: unknown; sinal?: AbortSignal; metodo?: 'POST' | 'PATCH' },
): Promise<T> {
  const url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  try {
    const resposta = await fetch(`${url.replace(/\/$/, '')}/api/v1${caminho}`, {
      method: opcoes?.metodo ?? (opcoes?.corpo ? 'POST' : 'GET'),
      headers: {
        Authorization: `Bearer ${token}`,
        ...(opcoes?.corpo ? { 'Content-Type': 'application/json' } : {}),
      },
      body: opcoes?.corpo ? JSON.stringify(opcoes.corpo) : undefined,
      credentials: 'omit',
      cache: 'no-store',
      signal: opcoes?.sinal
        ? AbortSignal.any([opcoes.sinal, AbortSignal.timeout(20_000)])
        : AbortSignal.timeout(20_000),
    });
    const corpo: unknown = await resposta.json();
    if (!resposta.ok) {
      const erro = z
        .object({ codigo: z.string(), usuarioIdCriado: z.uuid().optional() })
        .safeParse(corpo);
      const codigo = erro.success ? erro.data.codigo : '';
      const mensagem =
        mensagensPorCodigo[codigo] ||
        'Não foi possível concluir a solicitação.';
      const identificador =
        codigo === 'CADASTRO_PARCIAL' &&
        erro.success &&
        erro.data.usuarioIdCriado
          ? ` Identificador da conta: ${erro.data.usuarioIdCriado}.`
          : '';
      throw new Error(mensagem + identificador);
    }
    return esquema.parse(corpo);
  } catch (erro) {
    if (
      erro instanceof Error &&
      Object.values(mensagensPorCodigo).some((mensagem) =>
        erro.message.startsWith(mensagem),
      )
    )
      throw erro;
    throw new Error(
      'Não foi possível acessar o cadastro. Confira sua conexão e tente novamente.',
    );
  }
}
