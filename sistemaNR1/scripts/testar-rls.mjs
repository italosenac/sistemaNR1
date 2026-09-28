import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
const resultado = spawnSync('docker', ['exec', '-i', 'supabase_db_sistemaNR1', 'psql', '-U', 'supabase_admin', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-q'], {
  encoding: 'utf8', windowsHide: true, input: readFileSync('supabase/tests/camada-zero.sql', 'utf8')
});
if (resultado.status !== 0) {
  console.error('Suíte SQL local falhou. Detalhes de conexão e dados omitidos.');
  console.error((resultado.stderr || '').split('\n').filter(l => /ERROR:|CONTEXT:|LINE [0-9]+:/.test(l)).join('\n'));
  process.exitCode = 1;
} else console.log('RLS local aprovada: identidades comuns, quatro papéis, isolamento, revogação, matrícula e referências. Transação de testes revertida.');
