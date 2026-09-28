/** Uma única árvore de grupos disjuntos, de uma empresa, campanha e fator. */
export interface NoDeAgregacao {
  readonly id: string;
  readonly respostasDiretas: number;
  readonly filhos: readonly NoDeAgregacao[];
}

export interface AgregadoPublicavel {
  readonly escopoId: string;
  readonly respostasValidas: number;
}

interface NoContado {
  readonly id: string;
  readonly total: number;
  readonly respostasDiretas: number;
  readonly filhos: readonly NoContado[];
}

function contar(no: NoDeAgregacao, ids: Set<string>): NoContado {
  if (!no.id || ids.has(no.id))
    throw new Error('A partição precisa ter grupos distintos e identificados.');
  ids.add(no.id);
  if (!Number.isSafeInteger(no.respostasDiretas) || no.respostasDiretas < 0)
    throw new Error(
      'A contagem de respostas deve ser um inteiro não negativo.',
    );
  const filhos = no.filhos.map((filho) => contar(filho, ids));
  const total =
    no.respostasDiretas + filhos.reduce((soma, filho) => soma + filho.total, 0);
  if (!Number.isSafeInteger(total))
    throw new Error('A contagem de respostas excede o limite seguro.');
  return { id: no.id, total, respostasDiretas: no.respostasDiretas, filhos };
}

function selecionar(no: NoContado, k: number): AgregadoPublicavel[] {
  if (no.total < k) return [];
  // Publicar o pai junto de apenas alguns filhos revelaria o complemento.
  // Respostas diretas não formam partição nomeada e impedem a abertura.
  if (
    no.respostasDiretas > 0 ||
    no.filhos.length === 0 ||
    no.filhos.some((filho) => filho.total < k)
  )
    return [{ escopoId: no.id, respostasValidas: no.total }];
  return no.filhos.flatMap((filho) => selecionar(filho, k));
}

/** Publica uma partição disjunta; não expõe contagens de escopos suprimidos. */
export function publicarParticao(
  raiz: NoDeAgregacao,
  k: number,
): AgregadoPublicavel[] {
  if (!Number.isSafeInteger(k) || k < 7)
    throw new Error(
      'O mínimo de respostas deve ser um inteiro de pelo menos 7.',
    );
  return selecionar(contar(raiz, new Set()), k);
}
