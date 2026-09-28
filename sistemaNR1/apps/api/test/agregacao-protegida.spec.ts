import { publicarParticao } from '../src/dominio/agregacao-protegida.js';

const folha = (id: string, respostasDiretas: number) => ({
  id,
  respostasDiretas,
  filhos: [],
});

describe('RF-01.3 — partição protegida por fator', () => {
  it('suprime 6 respostas e publica 7 quando não há complemento', () => {
    expect(publicarParticao(folha('grupo', 6), 7)).toEqual([]);
    expect(publicarParticao(folha('grupo', 7), 7)).toEqual([
      { escopoId: 'grupo', respostasValidas: 7 },
    ]);
  });

  it('une irmãos pequenos no ancestral sem duplicar respostas', () => {
    const arvore = {
      id: 'setor',
      respostasDiretas: 0,
      filhos: [folha('grupo-a', 3), folha('grupo-b', 5)],
    };
    expect(publicarParticao(arvore, 7)).toEqual([
      { escopoId: 'setor', respostasValidas: 8 },
    ]);
  });

  it('não publica pai 10 e filho 7 quando o complemento teria 3', () => {
    const arvore = {
      id: 'setor',
      respostasDiretas: 0,
      filhos: [folha('grupo-a', 7), folha('grupo-b', 3)],
    };
    expect(publicarParticao(arvore, 7)).toEqual([
      { escopoId: 'setor', respostasValidas: 10 },
    ]);
  });

  it('publica somente partições disjuntas quando todas são seguras', () => {
    const arvore = {
      id: 'setor',
      respostasDiretas: 0,
      filhos: [folha('grupo-a', 7), folha('grupo-b', 9)],
    };
    expect(publicarParticao(arvore, 7)).toEqual([
      { escopoId: 'grupo-a', respostasValidas: 7 },
      { escopoId: 'grupo-b', respostasValidas: 9 },
    ]);
  });

  it('aplica k maior e rejeita configuração ou contagem inválida', () => {
    expect(publicarParticao(folha('grupo', 9), 10)).toEqual([]);
    expect(() => publicarParticao(folha('grupo', 7), 6)).toThrow();
    expect(() => publicarParticao(folha('grupo', -1), 7)).toThrow();
  });
});
