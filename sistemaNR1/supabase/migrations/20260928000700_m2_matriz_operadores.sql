-- Corrige precedência de operadores no validador puro.
begin;

create or replace function avaliacao.matriz_completa(m jsonb) returns boolean
language plpgsql immutable set search_path='' as $$
declare celula jsonb; pares text[] := array[]::text[]; chave text; decisoes jsonb := '{}'::jsonb;
begin
  if m is null or m->>'formula' is distinct from 'produto-sp-v1'
    or m->'severidades' is distinct from '[1,2,3]'::jsonb
    or m->'probabilidades' is distinct from '[1,2,3]'::jsonb
    or pg_catalog.jsonb_typeof(m->'celulas') is distinct from 'array' then
    return false;
  end if;
  if pg_catalog.jsonb_array_length(m->'celulas') <> 9 then return false; end if;
  for celula in select value from pg_catalog.jsonb_array_elements(m->'celulas') loop
    if celula->>'severidade' not in ('1','2','3')
      or celula->>'probabilidade' not in ('1','2','3')
      or celula->>'faixa' not in ('baixa','media','alta')
      or celula->>'decisao' not in ('manter','aprimorar','introduzir')
      or celula->>'severidade' is null or celula->>'probabilidade' is null
      or celula->>'faixa' is null or celula->>'decisao' is null then
      return false;
    end if;
    chave := (celula->>'severidade')||':'||(celula->>'probabilidade');
    if chave=any(pares) then return false; end if;
    pares := pg_catalog.array_append(pares,chave);
    if decisoes ? (celula->>'faixa')
      and decisoes->>(celula->>'faixa') is distinct from celula->>'decisao' then
      return false;
    end if;
    decisoes := decisoes || pg_catalog.jsonb_build_object(celula->>'faixa',celula->>'decisao');
  end loop;
  return true;
end $$;


commit;

