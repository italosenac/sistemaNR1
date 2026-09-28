import { describe, expect, it } from '@jest/globals';
import {
  gerarPdfRascunho,
  hashSha256,
} from '../src/infraestrutura/pdf-rascunho.js';

describe('PDF demonstrativo', () => {
  it('gera páginas com xref válido, aviso e hash sensível a alterações', () => {
    const pdf = gerarPdfRascunho(
      'Inventário fictício',
      Array.from(
        { length: 55 },
        (_, indice) => `Linha ${indice + 1}: conteúdo sintético`,
      ),
    );
    const texto = pdf.toString('ascii');
    expect(texto.startsWith('%PDF-1.4')).toBe(true);
    expect(texto).toContain('RASCUNHO NAO ASSINADO');
    expect((texto.match(/\/Type \/Page\b/g) ?? []).length).toBe(2);
    const inicioXref = Number(texto.match(/startxref\n(\d+)/)?.[1]);
    expect(texto.slice(inicioXref)).toMatch(/^xref\n/);
    expect(texto).toContain('%%EOF');
    expect(hashSha256(pdf)).not.toBe(
      hashSha256(Buffer.concat([pdf, Buffer.from('x')])),
    );
  });
});
