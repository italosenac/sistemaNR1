import {
  calcularAvaliacao,
  matrizDemonstrativa,
  validarMatriz,
} from '../src/dominio/matriz-risco.js';

const entrada = {
  fatorId: 'sobrecarga_percebida',
  escopoId: 'grupo-ficticio',
  agregadoPublicavel: true,
  severidade: 3,
  probabilidade: 2,
  justificativaProbabilidade:
    'Condições de trabalho fictícias e medida existente analisadas.',
  consequencias: [
    { descricao: 'Efeito menor fictício', magnitude: 1 },
    { descricao: 'Efeito maior fictício', magnitude: 3 },
  ],
  indiceDeterminante: 1,
  riscoEvidente: false,
  ergonomia: 'nenhuma' as const,
};

describe('M2 — matriz e memória demonstrativas', () => {
  it('exige cobertura de todas as nove células antes da aprovação', () => {
    const incompleta = {
      ...matrizDemonstrativa,
      celulas: matrizDemonstrativa.celulas.slice(0, 8),
    };
    expect(() => validarMatriz(incompleta)).toThrow('3:3');
    expect(() => validarMatriz(matrizDemonstrativa)).not.toThrow();
  });
  it('calcula 3 × 2 = 6 e preserva a consequência máxima na memória', () => {
    expect(calcularAvaliacao(entrada, matrizDemonstrativa)).toMatchObject({
      valor: 6,
      faixa: 'alta',
      decisaoOriginal: 'introduzir',
      memoria: {
        operacao: '3 × 2 = 6',
        consequenciaDeterminante: { magnitude: 3 },
      },
    });
  });
  it('bloqueia agregado suprimido, consequência menor e risco evidente sem medida', () => {
    expect(() =>
      calcularAvaliacao(
        { ...entrada, agregadoPublicavel: false },
        matrizDemonstrativa,
      ),
    ).toThrow('suprimido');
    expect(() =>
      calcularAvaliacao(
        { ...entrada, indiceDeterminante: 0 },
        matrizDemonstrativa,
      ),
    ).toThrow('maior magnitude');
    expect(() =>
      calcularAvaliacao(
        { ...entrada, riscoEvidente: true },
        matrizDemonstrativa,
      ),
    ).toThrow('medida');
  });
  it('exige AEP/AET explícita e justificativas para empate e decisão alterada', () => {
    expect(() =>
      calcularAvaliacao({ ...entrada, ergonomia: null }, matrizDemonstrativa),
    ).toThrow('AEP/AET');
    expect(() =>
      calcularAvaliacao(
        { ...entrada, decisaoExcepcional: 'manter' },
        matrizDemonstrativa,
      ),
    ).toThrow('justificativa');
    expect(() =>
      calcularAvaliacao(
        {
          ...entrada,
          consequencias: [
            { descricao: 'A', magnitude: 3 },
            { descricao: 'B', magnitude: 3 },
          ],
        },
        matrizDemonstrativa,
      ),
    ).toThrow('Empate');
  });
});
