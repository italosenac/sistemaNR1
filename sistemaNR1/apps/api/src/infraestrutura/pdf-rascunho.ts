import { createHash } from 'node:crypto';

/** PDF textual mínimo para artefatos demonstrativos sem assinatura. */
export function gerarPdfRascunho(titulo: string, linhas: string[]): Buffer {
  const paginas: string[][] = [];
  const todas = [
    titulo.toUpperCase(),
    'RASCUNHO NAO ASSINADO - USO ACADEMICO',
    '',
    ...linhas,
  ];
  for (let indice = 0; indice < todas.length; indice += 42)
    paginas.push(todas.slice(indice, indice + 42));
  const objetos: Buffer[] = [];
  const adicionar = (conteudo: string | Buffer) => {
    objetos.push(
      Buffer.isBuffer(conteudo) ? conteudo : Buffer.from(conteudo, 'ascii'),
    );
    return objetos.length;
  };
  const catalogo = adicionar('');
  const arvore = adicionar('');
  const fonte = adicionar(
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  );
  const referencias: number[] = [];
  for (const pagina of paginas) {
    const comandos = ['BT', '/F1 10 Tf', '48 790 Td', '15 TL'];
    for (const linha of pagina) {
      const texto = linha
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\x20-\x7e]/g, '?')
        .slice(0, 105)
        .replaceAll('\\', '\\\\')
        .replaceAll('(', '\\(')
        .replaceAll(')', '\\)');
      comandos.push(`(${texto}) Tj`, 'T*');
    }
    comandos.push('ET');
    const fluxo = Buffer.from(comandos.join('\n') + '\n', 'ascii');
    const conteudo = adicionar(
      Buffer.concat([
        Buffer.from(`<< /Length ${fluxo.length} >>\nstream\n`, 'ascii'),
        fluxo,
        Buffer.from('endstream', 'ascii'),
      ]),
    );
    referencias.push(
      adicionar(
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fonte} 0 R >> >> /Contents ${conteudo} 0 R >>`,
      ),
    );
  }
  objetos[catalogo - 1] = Buffer.from(
    '<< /Type /Catalog /Pages 2 0 R >>',
    'ascii',
  );
  objetos[arvore - 1] = Buffer.from(
    `<< /Type /Pages /Kids [${referencias.map((id) => `${id} 0 R`).join(' ')}] /Count ${referencias.length} >>`,
    'ascii',
  );
  const partes = [Buffer.from('%PDF-1.4\n', 'ascii')];
  const posicoes = [0];
  let posicao = partes[0].length;
  for (let indice = 0; indice < objetos.length; indice++) {
    posicoes.push(posicao);
    const objeto = Buffer.concat([
      Buffer.from(`${indice + 1} 0 obj\n`, 'ascii'),
      objetos[indice],
      Buffer.from('\nendobj\n', 'ascii'),
    ]);
    partes.push(objeto);
    posicao += objeto.length;
  }
  const xref = [`xref\n0 ${objetos.length + 1}`, '0000000000 65535 f '];
  for (const deslocamento of posicoes.slice(1))
    xref.push(`${String(deslocamento).padStart(10, '0')} 00000 n `);
  partes.push(
    Buffer.from(
      `${xref.join('\n')}\ntrailer\n<< /Size ${objetos.length + 1} /Root 1 0 R >>\nstartxref\n${posicao}\n%%EOF\n`,
      'ascii',
    ),
  );
  return Buffer.concat(partes);
}

export function hashSha256(bytes: Buffer | string): string {
  return createHash('sha256').update(bytes).digest('hex');
}
