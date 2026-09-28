-- Hash canônico do JSONB sem expor o schema extensions ao runtime.
begin;
create function avaliacao.hash_matriz(m jsonb) returns text
language sql immutable security definer set search_path='' as $$
  select pg_catalog.encode(extensions.digest(pg_catalog.convert_to(m::text,'UTF8'),'sha256'),'hex');
$$;
revoke all on function avaliacao.hash_matriz(jsonb) from public,anon,authenticated;
grant execute on function avaliacao.hash_matriz(jsonb) to sistemanr1_api;
commit;
