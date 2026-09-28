import type {
  Reporter,
  TestCase,
  TestResult,
  FullResult,
  TestError,
} from '@playwright/test/reporter';
import { readdirSync, rmSync } from 'node:fs';
import { resolve, sep } from 'node:path';

function sanitizar(texto: string): string {
  return texto
    .replace(/https?:\/\/[^\s"'<>]+/g, '[URL omitida]')
    .replace(
      /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)?/g,
      '[JWT omitido]',
    )
    .replace(/(?:sb_secret_|sb_publishable_)[A-Za-z0-9_-]+/g, '[chave omitida]')
    .replace(/fill\([^)]*\)/g, 'fill([valor omitido])');
}
export default class RelatorioSeguro implements Reporter {
  onTestEnd(teste: TestCase, resultado: TestResult) {
    console.log(resultado.status.toUpperCase() + ': ' + teste.title);
    for (const erro of resultado.errors)
      console.log(sanitizar(erro.message || 'Erro sem detalhes públicos.'));
  }
  onError(erro: TestError) {
    console.error(sanitizar(erro.message || 'Falha de execução.'));
  }
  onEnd(resultado: FullResult) {
    // Artefatos de falha podem conter URLs de autenticação. Esta pasta pertence
    // exclusivamente à suíte; nunca remover ambientes, bancos ou outros resultados.
    const raiz = resolve('.e1/resultados-integracao');
    if (!raiz.startsWith(resolve('.e1') + sep))
      throw new Error('Pasta de teste inesperada.');
    try {
      for (const item of readdirSync(raiz)) {
        const alvo = resolve(raiz, item);
        if (!alvo.startsWith(raiz + sep))
          throw new Error('Artefato fora da pasta de testes.');
        rmSync(alvo, { recursive: true, force: true });
      }
    } catch (erro) {
      if (!(erro instanceof Error && 'code' in erro && erro.code === 'ENOENT'))
        throw erro;
    }
    console.log(
      'Integração local: ' +
        resultado.status +
        '. Artefatos transitórios removidos.',
    );
  }
}
