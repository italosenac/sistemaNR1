-- Endurece entradas de M2 sem reescrever a migração local já aplicada.
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
    chave := celula->>'severidade'||':'||celula->>'probabilidade';
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

alter function avaliacao.publicar_criterio(uuid,jsonb,text,bytea,text)
  rename to publicar_criterio_base;
revoke all on function avaliacao.publicar_criterio_base(uuid,jsonb,text,bytea,text)
  from public,anon,authenticated,sistemanr1_api;

create function avaliacao.publicar_criterio(empresa uuid,m jsonb,hash_m text,pdf_bytes bytea,hash_bytes text)
returns uuid language plpgsql security definer set search_path='' as $$
begin
  if not avaliacao.matriz_completa(m)
    or hash_m is distinct from pg_catalog.encode(
      extensions.digest(pg_catalog.convert_to(m::text,'UTF8'),'sha256'),'hex') then
    raise exception using errcode='23514',message='Matriz ou hash de conteúdo inválido';
  end if;
  return avaliacao.publicar_criterio_base(empresa,m,hash_m,pdf_bytes,hash_bytes);
end $$;
revoke all on function avaliacao.publicar_criterio(uuid,jsonb,text,bytea,text)
  from public,anon,authenticated;
grant execute on function avaliacao.publicar_criterio(uuid,jsonb,text,bytea,text) to sistemanr1_api;

alter function avaliacao.registrar_resultado(uuid,uuid,uuid,text,text,uuid,text,jsonb,integer,integer,integer,text,text,text,jsonb)
  rename to registrar_resultado_base;
revoke all on function avaliacao.registrar_resultado_base(uuid,uuid,uuid,text,text,uuid,text,jsonb,integer,integer,integer,text,text,text,jsonb)
  from public,anon,authenticated,sistemanr1_api;

create function avaliacao.registrar_resultado(
  empresa uuid,fotografia uuid,criterio uuid,fator text,tipo text,escopo uuid,
  perigo_descricao text,tecnicos jsonb,s integer,p integer,valor_calculado integer,
  faixa_calculada text,decisao_base text,decisao_final text,memoria_calculo jsonb
) returns uuid language plpgsql security definer set search_path='' as $$
declare c avaliacao.criterios_versoes%rowtype; celula jsonb; consequencia jsonb; maior integer := 0;
begin
  select * into c from avaliacao.criterios_versoes where empresa_id=empresa and id=criterio;
  if c.id is null or s not between 1 and 3 or p not between 1 and 3
    or valor_calculado is distinct from s*p
    or pg_catalog.jsonb_typeof(tecnicos) is distinct from 'object'
    or pg_catalog.jsonb_typeof(memoria_calculo) is distinct from 'object'
    or pg_catalog.jsonb_typeof(tecnicos->'consequencias') is distinct from 'array'
    or pg_catalog.jsonb_array_length(tecnicos->'consequencias')=0
    or length(pg_catalog.btrim(coalesce(perigo_descricao,'')))<3
    or length(pg_catalog.btrim(coalesce(tecnicos->>'justificativaProbabilidade','')))<10
    or tecnicos->>'ergonomia' not in ('nenhuma','aep','aet')
    or tecnicos->>'ergonomia' is null
    or (tecnicos->>'ergonomia' in ('aep','aet') and length(pg_catalog.btrim(coalesce(tecnicos->>'referenciaErgonomia','')))=0)
    or tecnicos->>'riscoEvidente' not in ('true','false')
    or tecnicos->>'riscoEvidente' is null
    or (tecnicos->>'riscoEvidente'='true' and length(pg_catalog.btrim(coalesce(tecnicos->>'medidaRegistrada','')))=0)
    or memoria_calculo->>'formula' is distinct from 'produto-sp-v1'
    or memoria_calculo->>'operacao' is distinct from s::text||' × '||p::text||' = '||valor_calculado::text
    or memoria_calculo->>'severidade' is distinct from s::text
    or memoria_calculo->>'probabilidade' is distinct from p::text
    or memoria_calculo->'fonteAgregada'->>'fatorId' is distinct from fator
    or memoria_calculo->'fonteAgregada'->>'escopoId' is distinct from escopo::text
    or memoria_calculo->>'finalidade' is distinct from 'demonstrativa' then
    raise exception using errcode='23514',message='Resultado técnico incompleto';
  end if;
  for consequencia in select value from pg_catalog.jsonb_array_elements(tecnicos->'consequencias') loop
    if length(pg_catalog.btrim(coalesce(consequencia->>'descricao','')))=0
      or consequencia->>'magnitude' not in ('1','2','3')
      or consequencia->>'magnitude' is null then
      raise exception using errcode='23514',message='Consequência inválida';
    end if;
    maior := greatest(maior,(consequencia->>'magnitude')::integer);
  end loop;
  if maior<>s or memoria_calculo->'consequenciaDeterminante'->>'magnitude' is distinct from s::text
    or not (tecnicos->'consequencias' @> pg_catalog.jsonb_build_array(memoria_calculo->'consequenciaDeterminante')) then
    raise exception using errcode='23514',message='Consequência determinante inválida';
  end if;
  select value into celula from pg_catalog.jsonb_array_elements(c.matriz->'celulas')
    where value->>'severidade'=s::text and value->>'probabilidade'=p::text;
  if celula is null or faixa_calculada is distinct from celula->>'faixa'
    or decisao_base is distinct from celula->>'decisao'
    or decisao_final not in ('manter','aprimorar','introduzir')
    or decisao_final is null
    or (decisao_final is distinct from decisao_base
      and length(pg_catalog.btrim(coalesce(tecnicos->>'justificativaExcecao','')))=0) then
    raise exception using errcode='23514',message='Classificação ou decisão inválida';
  end if;
  return avaliacao.registrar_resultado_base(empresa,fotografia,criterio,fator,tipo,escopo,
    perigo_descricao,tecnicos,s,p,valor_calculado,faixa_calculada,decisao_base,decisao_final,memoria_calculo);
end $$;
revoke all on function avaliacao.registrar_resultado(uuid,uuid,uuid,text,text,uuid,text,jsonb,integer,integer,integer,text,text,text,jsonb)
  from public,anon,authenticated;
grant execute on function avaliacao.registrar_resultado(uuid,uuid,uuid,text,text,uuid,text,jsonb,integer,integer,integer,text,text,text,jsonb)
  to sistemanr1_api;

commit;
