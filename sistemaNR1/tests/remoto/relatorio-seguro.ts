import type {
  Reporter,
  TestCase,
  TestResult,
  FullResult,
} from '@playwright/test/reporter';
import { basename } from 'node:path';

export default class RelatorioSeguroRemoto implements Reporter {
  onTestEnd(teste: TestCase, resultado: TestResult) {
    console.log(`${resultado.status.toUpperCase()}: ${teste.title}`);
    for (const erro of resultado.errors) {
      const mensagem = erro.message || '';
      const esperado = mensagem.match(/Expected:\s*(\d{3})/);
      const recebido = mensagem.match(/Received:\s*(\d{3})/);
      const local = erro.location
        ? `${basename(erro.location.file)}:${erro.location.line}`
        : 'local_indisponivel';
      console.log(
        `Falha sanitizada: ${local}; HTTP esperado=${esperado?.[1] || 'N/A'}, recebido=${recebido?.[1] || 'N/A'}.`,
      );
    }
  }
  onEnd(resultado: FullResult) {
    console.log(`E1 remoto: ${resultado.status}.`);
  }
}
