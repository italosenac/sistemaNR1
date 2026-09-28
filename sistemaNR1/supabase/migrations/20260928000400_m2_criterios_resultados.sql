-- E3 local: critérios acadêmicos versionados e resultados com memória.
-- Aplicação remota somente após aprovação específica.
begin;

create schema avaliacao;
revoke all on schema avaliacao from public,anon,authenticated;
grant usage on schema avaliacao to sistemanr1_api;
alter default privileges in schema avaliacao revoke all on tables from public,anon,authenticated;
alter default privileges in schema avaliacao revoke execute on functions from public,anon,authenticated;

alter table coleta.fotografias_agregadas
  add constraint fotografias_agregadas_empresa_id_unicos unique(empresa_id,id);

create table avaliacao.criterios_versoes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references organizacao.empresas(id) on delete restrict,
  versao integer not null check(versao>0),
  matriz jsonb not null check(jsonb_typeof(matriz)='object'),
  hash_conteudo text not null check(hash_conteudo ~ '^[a-f0-9]{64}$'),
  pdf bytea not null check(octet_length(pdf)>100),
  hash_pdf text not null check(hash_pdf ~ '^[a-f0-9]{64}$'),
  finalidade text not null default 'demonstrativa' check(finalidade='demonstrativa'),
  assinatura_estado text not null default 'nao_assinado' check(assinatura_estado='nao_assinado'),
  aprovado_por uuid not null references organizacao.perfis(id) on delete restrict,
  aprovado_em timestamptz not null default clock_timestamp(),
  unique(empresa_id,versao),
  unique(empresa_id,id)
);

create table avaliacao.resultados (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null,
  estabelecimento_id uuid not null,
  fotografia_id uuid not null,
  criterio_id uuid not null,
  fator_id text not null check(fator_id in ('sobrecarga_percebida','ritmo_percebido')),
  escopo_tipo text not null check(escopo_tipo in ('grupo','estabelecimento')),
  escopo_id uuid not null,
  perigo text not null check(length(btrim(perigo)) between 3 and 500),
  dados_tecnicos jsonb not null check(jsonb_typeof(dados_tecnicos)='object'),
  severidade integer not null check(severidade between 1 and 3),
  probabilidade integer not null check(probabilidade between 1 and 3),
  valor integer not null check(valor=severidade*probabilidade),
  faixa text not null check(faixa in ('baixa','media','alta')),
  decisao_original text not null check(decisao_original in ('manter','aprimorar','introduzir')),
  decisao_efetiva text not null check(decisao_efetiva in ('manter','aprimorar','introduzir')),
  memoria jsonb not null check(jsonb_typeof(memoria)='object'),
  autor_id uuid not null references organizacao.perfis(id) on delete restrict,
  criado_em timestamptz not null default clock_timestamp(),
  unique(empresa_id,id),
  foreign key(empresa_id,estabelecimento_id) references organizacao.estabelecimentos(empresa_id,id) on delete restrict,
  foreign key(empresa_id,fotografia_id) references coleta.fotografias_agregadas(empresa_id,id) on delete restrict,
  foreign key(empresa_id,criterio_id) references avaliacao.criterios_versoes(empresa_id,id) on delete restrict
);
create index resultados_por_empresa on avaliacao.resultados(empresa_id,estabelecimento_id,criado_em);

create function avaliacao.pode_ler(empresa uuid) returns boolean
language sql stable security definer set search_path='' as $$
  select coleta.pode_ler(empresa);
$$;
create function avaliacao.pode_avaliar(empresa uuid) returns boolean
language sql stable security definer set search_path='' as $$
  select organizacao.tem_vinculo(empresa) and exists (
    select 1 from organizacao.vinculos_organizacionais v
    join organizacao.atribuicoes_papel a on a.empresa_id=v.empresa_id and a.vinculo_organizacional_id=v.id
    where v.empresa_id=empresa and v.usuario_id=organizacao.usuario_atual()
      and v.status='ativo' and a.status='ativo' and a.papel='responsavel_tecnico'
  );
$$;
revoke all on function avaliacao.pode_ler(uuid),avaliacao.pode_avaliar(uuid) from public,anon,authenticated;
grant execute on function avaliacao.pode_ler(uuid),avaliacao.pode_avaliar(uuid) to sistemanr1_api;

alter table avaliacao.criterios_versoes enable row level security;
alter table avaliacao.criterios_versoes force row level security;
alter table avaliacao.resultados enable row level security;
alter table avaliacao.resultados force row level security;
create policy criterios_leitura on avaliacao.criterios_versoes for select to sistemanr1_api
  using(avaliacao.pode_ler(empresa_id));
create policy resultados_leitura on avaliacao.resultados for select to sistemanr1_api
  using(avaliacao.pode_ler(empresa_id));
grant select(id,empresa_id,versao,matriz,hash_conteudo,hash_pdf,finalidade,assinatura_estado,aprovado_por,aprovado_em)
  on avaliacao.criterios_versoes to sistemanr1_api;
grant select on avaliacao.resultados to sistemanr1_api;
-- Bytes do PDF saem exclusivamente por função autorizada; nenhum INSERT/UPDATE/DELETE direto.

create function avaliacao.impedir_alteracao() returns trigger
language plpgsql set search_path='' as $$
begin
  raise exception using errcode='42501',message='Versão de avaliação imutável';
end $$;
create trigger criterios_imutaveis before update or delete on avaliacao.criterios_versoes
  for each row execute function avaliacao.impedir_alteracao();
create trigger resultados_imutaveis before update or delete on avaliacao.resultados
  for each row execute function avaliacao.impedir_alteracao();

create function avaliacao.matriz_completa(m jsonb) returns boolean
language sql immutable set search_path='' as $$
  select m->>'formula'='produto-sp-v1'
    and m->'severidades'='[1,2,3]'::jsonb and m->'probabilidades'='[1,2,3]'::jsonb
    and pg_catalog.jsonb_typeof(m->'celulas')='array'
    and pg_catalog.jsonb_array_length(m->'celulas')=9
    and (select count(*)=9 and count(distinct (c->>'severidade',c->>'probabilidade'))=9
         and bool_and((c->>'severidade') in ('1','2','3')
           and (c->>'probabilidade') in ('1','2','3')
           and (c->>'faixa') in ('baixa','media','alta')
           and (c->>'decisao') in ('manter','aprimorar','introduzir'))
         from pg_catalog.jsonb_array_elements(m->'celulas') c);
$$;

create function avaliacao.publicar_criterio(empresa uuid,m jsonb,hash_m text,pdf_bytes bytea,hash_bytes text)
returns uuid language plpgsql security definer set search_path='' as $$
declare nova_versao integer; registro uuid;
begin
  perform organizacao.bloquear_empresa(empresa);
  if not avaliacao.pode_avaliar(empresa) then
    raise exception using errcode='42501',message='Aprovação técnica indisponível';
  end if;
  if not avaliacao.matriz_completa(m) or hash_m !~ '^[a-f0-9]{64}$'
    or pdf_bytes is null or pg_catalog.octet_length(pdf_bytes)<=100
    or hash_bytes is null or hash_bytes<>pg_catalog.encode(extensions.digest(pdf_bytes,'sha256'),'hex') then
    raise exception using errcode='23514',message='Matriz ou documento incompleto';
  end if;
  select coalesce(max(versao),0)+1 into nova_versao from avaliacao.criterios_versoes where empresa_id=empresa;
  insert into avaliacao.criterios_versoes(empresa_id,versao,matriz,hash_conteudo,pdf,hash_pdf,aprovado_por)
    values(empresa,nova_versao,m,hash_m,pdf_bytes,hash_bytes,organizacao.usuario_atual())
    returning id into registro;
  return registro;
end $$;

create function avaliacao.registrar_resultado(
  empresa uuid,fotografia uuid,criterio uuid,fator text,tipo text,escopo uuid,
  perigo_descricao text,tecnicos jsonb,s integer,p integer,valor_calculado integer,
  faixa_calculada text,decisao_base text,decisao_final text,memoria_calculo jsonb
) returns uuid language plpgsql security definer set search_path='' as $$
declare f coleta.fotografias_agregadas%rowtype; c avaliacao.criterios_versoes%rowtype; celula jsonb; registro uuid;
begin
  perform organizacao.bloquear_empresa(empresa);
  if not avaliacao.pode_avaliar(empresa) then
    raise exception using errcode='42501',message='Avaliação técnica indisponível';
  end if;
  select * into f from coleta.fotografias_agregadas where empresa_id=empresa and id=fotografia;
  select * into c from avaliacao.criterios_versoes where empresa_id=empresa and id=criterio;
  if f.id is null or c.id is null or c.aprovado_em >= clock_timestamp()
    or not exists (select 1 from pg_catalog.jsonb_array_elements(f.resultado->'particoes') a
      where a->>'fatorId'=fator and a->>'escopoTipo'=tipo and a->>'escopoId'=escopo::text) then
    raise exception using errcode='23514',message='Origem agregada ou critério indisponível';
  end if;
  select item into celula from pg_catalog.jsonb_array_elements(c.matriz->'celulas') item
    where item->>'severidade'=s::text and item->>'probabilidade'=p::text;
  if celula is null or valor_calculado<>s*p or faixa_calculada<>celula->>'faixa'
    or decisao_base<>celula->>'decisao' or memoria_calculo->>'formula'<>'produto-sp-v1'
    or memoria_calculo->>'operacao'<>s::text||' × '||p::text||' = '||valor_calculado::text
    or memoria_calculo->'fonteAgregada'->>'fatorId'<>fator
    or memoria_calculo->'fonteAgregada'->>'escopoId'<>escopo::text
    or pg_catalog.jsonb_typeof(tecnicos->'consequencias')<>'array'
    or pg_catalog.jsonb_array_length(tecnicos->'consequencias')=0
    or tecnicos->>'ergonomia' not in ('nenhuma','aep','aet')
    or (tecnicos->>'riscoEvidente'='true' and length(btrim(coalesce(tecnicos->>'medidaRegistrada','')))=0)
    or (decisao_final<>decisao_base and length(btrim(coalesce(tecnicos->>'justificativaExcecao','')))=0) then
    raise exception using errcode='23514',message='Resultado sem memória ou fundamentação';
  end if;
  insert into avaliacao.resultados(
    empresa_id,estabelecimento_id,fotografia_id,criterio_id,fator_id,escopo_tipo,escopo_id,
    perigo,dados_tecnicos,severidade,probabilidade,valor,faixa,decisao_original,decisao_efetiva,memoria,autor_id
  ) values (
    empresa,f.estabelecimento_id,fotografia,criterio,fator,tipo,escopo,
    btrim(perigo_descricao),tecnicos,s,p,valor_calculado,faixa_calculada,decisao_base,decisao_final,memoria_calculo,
    organizacao.usuario_atual()
  ) returning id into registro;
  return registro;
end $$;

revoke all on function avaliacao.impedir_alteracao(),avaliacao.matriz_completa(jsonb),
  avaliacao.publicar_criterio(uuid,jsonb,text,bytea,text),
  avaliacao.registrar_resultado(uuid,uuid,uuid,text,text,uuid,text,jsonb,integer,integer,integer,text,text,text,jsonb)
  from public,anon,authenticated;
grant execute on function avaliacao.publicar_criterio(uuid,jsonb,text,bytea,text),
  avaliacao.registrar_resultado(uuid,uuid,uuid,text,text,uuid,text,jsonb,integer,integer,integer,text,text,text,jsonb)
  to sistemanr1_api;

commit;
