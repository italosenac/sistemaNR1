export interface PublicacaoDeCampanha {
  readonly titulo: string;
  readonly inicio: string;
  readonly fim: string;
  readonly fuso: string;
  readonly metaPercentual: number;
  readonly populacaoEsperada: number;
  readonly minimoDivulgacao: number;
  readonly canalAlternativo: string;
}

function instanteValido(valor: string): number {
  if (
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(
      valor,
    )
  )
    throw new Error('Informe um instante com fuso explícito.');
  const instante = Date.parse(valor);
  if (!Number.isFinite(instante)) throw new Error('Período inválido.');
  return instante;
}

/** Regras de passagem do rascunho à publicação, sem dados nominais. */
export function validarPublicacao(dados: PublicacaoDeCampanha): void {
  if (dados.titulo.trim().length < 3)
    throw new Error('Informe o título da campanha.');
  const inicio = instanteValido(dados.inicio);
  const fim = instanteValido(dados.fim);
  if (inicio >= fim) throw new Error('O fim precisa ser posterior ao início.');
  try {
    new Intl.DateTimeFormat('pt-BR', { timeZone: dados.fuso });
  } catch {
    throw new Error('Fuso horário inválido.');
  }
  if (
    !Number.isFinite(dados.metaPercentual) ||
    dados.metaPercentual < 0 ||
    dados.metaPercentual > 100
  )
    throw new Error('A meta deve estar entre 0% e 100%.');
  if (
    !Number.isSafeInteger(dados.populacaoEsperada) ||
    dados.populacaoEsperada < 1
  )
    throw new Error('A população esperada deve ser positiva.');
  if (
    !Number.isSafeInteger(dados.minimoDivulgacao) ||
    dados.minimoDivulgacao < 7
  )
    throw new Error('O mínimo de divulgação deve ser pelo menos 7.');
  if (dados.canalAlternativo.trim().length < 10)
    throw new Error('Descreva o canal alternativo de participação.');
}

/** Taxa restrita ao processamento interno; divulgação exige RF-01.3. */
export function calcularTaxaInterna(
  respostasValidas: number,
  populacaoEsperada: number,
): number {
  if (
    !Number.isSafeInteger(populacaoEsperada) ||
    populacaoEsperada < 1 ||
    !Number.isSafeInteger(respostasValidas) ||
    respostasValidas < 0 ||
    respostasValidas > populacaoEsperada
  )
    throw new Error('Numerador ou denominador de adesão inválido.');
  return (respostasValidas / populacaoEsperada) * 100;
}
