export type DecisaoRisco = 'manter' | 'aprimorar' | 'introduzir';
export type FaixaRisco = 'baixa' | 'media' | 'alta';

export interface CelulaRisco {
  readonly severidade: number;
  readonly probabilidade: number;
  readonly faixa: FaixaRisco;
  readonly decisao: DecisaoRisco;
}

export interface MatrizRisco {
  readonly severidades: readonly number[];
  readonly probabilidades: readonly number[];
  readonly celulas: readonly CelulaRisco[];
  readonly formula: 'produto-sp-v1';
}

export const matrizDemonstrativa: MatrizRisco = {
  severidades: [1, 2, 3],
  probabilidades: [1, 2, 3],
  formula: 'produto-sp-v1',
  celulas: [
    { severidade: 1, probabilidade: 1, faixa: 'baixa', decisao: 'manter' },
    { severidade: 1, probabilidade: 2, faixa: 'baixa', decisao: 'manter' },
    { severidade: 1, probabilidade: 3, faixa: 'media', decisao: 'aprimorar' },
    { severidade: 2, probabilidade: 1, faixa: 'baixa', decisao: 'manter' },
    { severidade: 2, probabilidade: 2, faixa: 'media', decisao: 'aprimorar' },
    { severidade: 2, probabilidade: 3, faixa: 'alta', decisao: 'introduzir' },
    { severidade: 3, probabilidade: 1, faixa: 'media', decisao: 'aprimorar' },
    { severidade: 3, probabilidade: 2, faixa: 'alta', decisao: 'introduzir' },
    { severidade: 3, probabilidade: 3, faixa: 'alta', decisao: 'introduzir' },
  ],
};

export function validarMatriz(matriz: MatrizRisco): void {
  if (matriz.formula !== 'produto-sp-v1')
    throw new Error('Fórmula não suportada.');
  const escalas = [matriz.severidades, matriz.probabilidades];
  for (const escala of escalas) {
    if (
      !escala.length ||
      escala.some((valor) => !Number.isSafeInteger(valor) || valor < 1) ||
      new Set(escala).size !== escala.length
    )
      throw new Error('Escala inválida ou duplicada.');
  }
  const esperadas = new Set(
    matriz.severidades.flatMap((s) =>
      matriz.probabilidades.map((p) => `${s}:${p}`),
    ),
  );
  const vistas = new Set<string>();
  const decisoes = new Map<FaixaRisco, DecisaoRisco>();
  for (const celula of matriz.celulas) {
    const chave = `${celula.severidade}:${celula.probabilidade}`;
    if (!esperadas.has(chave) || vistas.has(chave))
      throw new Error(`Célula duplicada ou fora da escala: ${chave}.`);
    if (
      !['baixa', 'media', 'alta'].includes(celula.faixa) ||
      !['manter', 'aprimorar', 'introduzir'].includes(celula.decisao)
    )
      throw new Error(`Faixa ou decisão inválida na célula ${chave}.`);
    const decisaoAnterior = decisoes.get(celula.faixa);
    if (decisaoAnterior && decisaoAnterior !== celula.decisao)
      throw new Error('Faixa com decisões divergentes.');
    decisoes.set(celula.faixa, celula.decisao);
    vistas.add(chave);
  }
  const faltantes = [...esperadas].filter((chave) => !vistas.has(chave));
  if (faltantes.length)
    throw new Error(`Célula sem faixa: ${faltantes.join(', ')}.`);
}

export interface ConsequenciaPossivel {
  readonly descricao: string;
  readonly magnitude: number;
}

export interface EntradaAvaliacao {
  readonly fatorId: string;
  readonly escopoId: string;
  readonly agregadoPublicavel: boolean;
  readonly severidade: number;
  readonly probabilidade: number;
  readonly justificativaProbabilidade: string;
  readonly consequencias: readonly ConsequenciaPossivel[];
  readonly indiceDeterminante: number;
  readonly justificativaEmpate?: string;
  readonly riscoEvidente: boolean;
  readonly medidaRegistrada?: string;
  readonly ergonomia: 'nenhuma' | 'aep' | 'aet' | null;
  readonly referenciaErgonomia?: string;
  readonly decisaoExcepcional?: DecisaoRisco;
  readonly justificativaExcecao?: string;
}

export function calcularAvaliacao(
  entrada: EntradaAvaliacao,
  matriz: MatrizRisco,
) {
  validarMatriz(matriz);
  if (!entrada.agregadoPublicavel)
    throw new Error('Insumo agregado suprimido.');
  if (
    !entrada.consequencias.length ||
    entrada.consequencias.some(
      (c) => !c.descricao.trim() || !matriz.severidades.includes(c.magnitude),
    )
  )
    throw new Error('Consequências incompletas.');
  const determinante = entrada.consequencias[entrada.indiceDeterminante];
  const maiorMagnitude = Math.max(
    ...entrada.consequencias.map((c) => c.magnitude),
  );
  if (
    !determinante ||
    determinante.magnitude !== maiorMagnitude ||
    entrada.severidade !== maiorMagnitude
  )
    throw new Error(
      'A consequência determinante deve ter a maior magnitude e fundamentar S.',
    );
  if (
    entrada.consequencias.filter((c) => c.magnitude === maiorMagnitude).length >
      1 &&
    !entrada.justificativaEmpate?.trim()
  )
    throw new Error('Empate de consequências exige justificativa.');
  if (
    !entrada.justificativaProbabilidade.trim() ||
    entrada.justificativaProbabilidade.trim().length < 10
  )
    throw new Error('Probabilidade exige fundamentação técnica.');
  if (
    entrada.ergonomia === null ||
    ((entrada.ergonomia === 'aep' || entrada.ergonomia === 'aet') &&
      !entrada.referenciaErgonomia?.trim())
  )
    throw new Error('Informe AEP/AET ou ausência explícita.');
  if (entrada.riscoEvidente && !entrada.medidaRegistrada?.trim())
    throw new Error('Risco evidente exige medida registrada.');
  const celula = matriz.celulas.find(
    (c) =>
      c.severidade === entrada.severidade &&
      c.probabilidade === entrada.probabilidade,
  );
  if (!celula) throw new Error('S ou P fora da escala aprovada.');
  if (
    entrada.decisaoExcepcional &&
    entrada.decisaoExcepcional !== celula.decisao &&
    !entrada.justificativaExcecao?.trim()
  )
    throw new Error('Alteração de decisão exige justificativa.');
  const valor = entrada.severidade * entrada.probabilidade;
  return {
    valor,
    faixa: celula.faixa,
    decisaoOriginal: celula.decisao,
    decisaoEfetiva: entrada.decisaoExcepcional ?? celula.decisao,
    memoria: {
      formula: matriz.formula,
      operacao: `${entrada.severidade} × ${entrada.probabilidade} = ${valor}`,
      severidade: entrada.severidade,
      probabilidade: entrada.probabilidade,
      consequenciaDeterminante: determinante,
      demaisConsequencias: entrada.consequencias.filter(
        (_, indice) => indice !== entrada.indiceDeterminante,
      ),
      justificativaProbabilidade: entrada.justificativaProbabilidade.trim(),
      justificativaEmpate: entrada.justificativaEmpate?.trim() || null,
      decisaoOriginal: celula.decisao,
      justificativaExcecao: entrada.justificativaExcecao?.trim() || null,
      fonteAgregada: { fatorId: entrada.fatorId, escopoId: entrada.escopoId },
      finalidade: 'demonstrativa',
    },
  };
}
