import {
  calcularTaxaInterna,
  validarPublicacao,
} from '../src/dominio/campanha.js';

const rascunho = {
  titulo: 'Consulta fictícia — unidade modelo',
  inicio: '2026-10-01T12:00:00.000Z',
  fim: '2026-10-10T12:00:00.000Z',
  fuso: 'America/Sao_Paulo',
  metaPercentual: 70,
  populacaoEsperada: 20,
  minimoDivulgacao: 7,
  canalAlternativo: 'Formulário impresso com código individual no ponto neutro',
};

describe('RF-01.2/01.6 — publicação de campanha', () => {
  it('aceita rascunho completo e calcula taxa interna de 8/20', () => {
    expect(() => validarPublicacao(rascunho)).not.toThrow();
    expect(calcularTaxaInterna(8, 20)).toBe(40);
  });

  it('bloqueia publicação sem alternativa ou com período inválido', () => {
    expect(() =>
      validarPublicacao({ ...rascunho, canalAlternativo: '' }),
    ).toThrow();
    expect(() =>
      validarPublicacao({ ...rascunho, fim: rascunho.inicio }),
    ).toThrow();
  });

  it('bloqueia população, meta e k inválidos', () => {
    expect(() =>
      validarPublicacao({ ...rascunho, populacaoEsperada: 0 }),
    ).toThrow();
    expect(() =>
      validarPublicacao({ ...rascunho, metaPercentual: 101 }),
    ).toThrow();
    expect(() =>
      validarPublicacao({ ...rascunho, minimoDivulgacao: 6 }),
    ).toThrow();
    expect(() => calcularTaxaInterna(8, 0)).toThrow();
    expect(() => calcularTaxaInterna(21, 20)).toThrow();
  });
});
