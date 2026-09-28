-- A validação pura da matriz não acessa tabelas ou dados empresariais.
begin;
grant execute on function avaliacao.matriz_completa(jsonb) to sistemanr1_api;
commit;
