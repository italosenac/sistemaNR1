-- Remove EXECUTE excedente da funcao interna de imutabilidade.
-- Preserva o corpo da funcao, o gatilho e todos os dados existentes.
begin;

revoke execute on function coleta.impedir_alteracao_fotografia()
  from public, anon, authenticated, sistemanr1_api;

commit;
