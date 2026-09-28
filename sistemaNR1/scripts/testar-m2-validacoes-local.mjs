import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

const requireApi = createRequire(resolve('apps/api/package.json'));
const { Client } = requireApi('pg');
const ambiente = JSON.parse(readFileSync('.e1/ambiente.local.json', 'utf8'));
const url = new URL(ambiente.DATABASE_URL);
if (url.hostname !== '127.0.0.1' || url.port !== '55322')
  throw new Error('Somente o banco local de testes é permitido.');
const cliente = new Client({
  connectionString: ambiente.DATABASE_URL,
  ssl: false,
});
const celulas = [];
for (const severidade of [1, 2, 3])
  for (const probabilidade of [1, 2, 3]) {
    celulas.push({
      severidade,
      probabilidade,
      faixa: 'baixa',
      decisao: 'manter',
    });
  }
const matriz = {
  formula: 'produto-sp-v1',
  severidades: [1, 2, 3],
  probabilidades: [1, 2, 3],
  celulas,
};
try {
  await cliente.connect();
  const casos = [
    [matriz, true],
    [{ ...matriz, formula: null }, false],
    [{ ...matriz, celulas: celulas.slice(1) }, false],
    [
      {
        ...matriz,
        celulas: [...celulas.slice(0, 8), { ...celulas[8], faixa: null }],
      },
      false,
    ],
    [
      {
        ...matriz,
        celulas: [
          ...celulas.slice(0, 8),
          { ...celulas[8], decisao: 'introduzir' },
        ],
      },
      false,
    ],
    [{ ...matriz, celulas: [...celulas.slice(0, 8), celulas[0]] }, false],
  ];
  for (const [valor, esperado] of casos) {
    const resultado = await cliente.query(
      'SELECT avaliacao.matriz_completa($1::jsonb) valida',
      [JSON.stringify(valor)],
    );
    if (resultado.rows[0].valida !== esperado)
      throw new Error('Validação cartesiana incorreta.');
  }
  const permissoes = await cliente.query(`SELECT
    has_table_privilege(current_user,'avaliacao.criterios_versoes','INSERT') insere_criterio,
    has_table_privilege(current_user,'avaliacao.resultados','INSERT') insere_resultado,
    has_table_privilege(current_user,'avaliacao.criterios_versoes','DELETE') exclui_criterio,
    has_column_privilege(current_user,'avaliacao.criterios_versoes','pdf','SELECT') le_pdf,
    has_function_privilege(current_user,'avaliacao.publicar_criterio_base(uuid,jsonb,text,bytea,text)','EXECUTE') chama_base`);
  if (Object.values(permissoes.rows[0]).some(Boolean))
    throw new Error('Grant direto excessivo.');
  console.log(
    JSON.stringify({
      aprovado: true,
      matrizes: casos.length,
      grantsMinimos: true,
    }),
  );
} catch (erro) {
  console.error(
    JSON.stringify({
      aprovado: false,
      codigo: erro?.code ?? 'VALIDACAO',
      rotina: erro?.routine ?? '',
      detalhe: erro?.message?.slice(0, 160) ?? '',
    }),
  );
  process.exitCode = 1;
} finally {
  await cliente.end();
}
