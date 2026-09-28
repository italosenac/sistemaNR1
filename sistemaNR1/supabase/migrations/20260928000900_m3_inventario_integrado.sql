-- E4 local: inventário acadêmico integrado, imutável, sem assinatura formal.
begin;
create schema inventario;
revoke all on schema inventario from public,anon,authenticated;
grant usage on schema inventario to sistemanr1_api;
alter default privileges in schema inventario revoke all on tables from public,anon,authenticated;
alter default privileges in schema inventario revoke execute on functions from public,anon,authenticated;

create table inventario.versoes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references organizacao.empresas(id) on delete restrict,
  estabelecimento_id uuid not null,
  versao integer not null check(versao>0),
  conteudo jsonb not null check(pg_catalog.jsonb_typeof(conteudo)='object'),
  diferencas jsonb not null check(pg_catalog.jsonb_typeof(diferencas)='object'),
  hash_conteudo text not null check(hash_conteudo ~ '^[a-f0-9]{64}$'),
  pdf bytea not null check(pg_catalog.octet_length(pdf)>100),
  hash_pdf text not null check(hash_pdf ~ '^[a-f0-9]{64}$'),
  assinatura_estado text not null default 'nao_assinado' check(assinatura_estado='nao_assinado'),
  autor_id uuid not null references organizacao.perfis(id) on delete restrict,
  criado_em timestamptz not null default clock_timestamp(),
  unique(empresa_id,estabelecimento_id,versao),
  unique(empresa_id,id),
  foreign key(empresa_id,estabelecimento_id)
    references organizacao.estabelecimentos(empresa_id,id) on delete restrict
);
create index versoes_por_estabelecimento on inventario.versoes(empresa_id,estabelecimento_id,versao desc);
alter table inventario.versoes enable row level security;
alter table inventario.versoes force row level security;
create policy versoes_leitura on inventario.versoes for select to sistemanr1_api
  using(avaliacao.pode_ler(empresa_id));
grant select(id,empresa_id,estabelecimento_id,versao,conteudo,diferencas,hash_conteudo,hash_pdf,assinatura_estado,autor_id,criado_em)
  on inventario.versoes to sistemanr1_api;

create function inventario.impedir_alteracao() returns trigger language plpgsql set search_path='' as $$
begin
  raise exception using errcode='42501',message='Inventário consolidado imutável';
end $$;
create trigger versoes_imutaveis before update or delete on inventario.versoes
  for each row execute function inventario.impedir_alteracao();

create function inventario.alineas_completas(a jsonb) returns boolean
language plpgsql immutable set search_path='' as $$
declare letra text;
begin
  if pg_catalog.jsonb_typeof(a) is distinct from 'object' then return false; end if;
  foreach letra in array array['a','b','c','d','e','f','g','h','i'] loop
    if pg_catalog.jsonb_typeof(a->letra) is distinct from 'string'
      or length(pg_catalog.btrim(a->>letra))<10 then return false; end if;
  end loop;
  return true;
end $$;

create function inventario.consolidar(
  empresa uuid,estabelecimento uuid,itens_psicossociais jsonb,itens_gerais jsonb,
  pdf_bytes bytea,hash_bytes text,hash_esperado text
) returns uuid language plpgsql security definer set search_path='' as $$
declare item jsonb; r avaliacao.resultados%rowtype; selecionados jsonb := '[]'::jsonb;
  anterior inventario.versoes%rowtype; conteudo_final jsonb; resumo jsonb;
  nova_versao integer; registro uuid; vistas uuid[] := array[]::uuid[];
begin
  perform organizacao.bloquear_empresa(empresa);
  if not avaliacao.pode_avaliar(empresa) then
    raise exception using errcode='42501',message='Consolidação técnica indisponível';
  end if;
  if not exists(select 1 from organizacao.estabelecimentos e
    where e.empresa_id=empresa and e.id=estabelecimento and e.status='ativo')
    or pg_catalog.jsonb_typeof(itens_psicossociais) is distinct from 'array'
    or pg_catalog.jsonb_typeof(itens_gerais) is distinct from 'array'
    or pg_catalog.jsonb_array_length(itens_psicossociais)<1
    or pg_catalog.jsonb_array_length(itens_gerais)<1 then
    raise exception using errcode='23514',message='Inventário geral ou psicossocial ausente';
  end if;
  for item in select value from pg_catalog.jsonb_array_elements(itens_psicossociais) loop
    if not inventario.alineas_completas(item->'alineas')
      or item->>'avaliacaoId' is null
      or item->>'avaliacaoId' !~ '^[a-f0-9-]{36}$' then
      raise exception using errcode='23514',message='Alíneas ou avaliação ausentes';
    end if;
    if (item->>'avaliacaoId')::uuid=any(vistas) then
      raise exception using errcode='23514',message='Avaliação duplicada';
    end if;
    vistas := pg_catalog.array_append(vistas,(item->>'avaliacaoId')::uuid);
    select * into r from avaliacao.resultados where empresa_id=empresa
      and estabelecimento_id=estabelecimento and id=(item->>'avaliacaoId')::uuid;
    if r.id is null or r.memoria is null or r.criterio_id is null then
      raise exception using errcode='23514',message='Avaliação M2 indisponível';
    end if;
    selecionados := selecionados || pg_catalog.jsonb_build_array(
      pg_catalog.jsonb_build_object('alineas',item->'alineas',
        'avaliacao',pg_catalog.to_jsonb(r)));
  end loop;
  for item in select value from pg_catalog.jsonb_array_elements(itens_gerais) loop
    if not inventario.alineas_completas(item->'alineas')
      or item->>'categoria' not in ('fisico','quimico','biologico','ergonomico','acidentes','outro')
      or item->>'categoria' is null
      or length(pg_catalog.btrim(coalesce(item->>'proveniencia','')))<10 then
      raise exception using errcode='23514',message='Item geral incompleto';
    end if;
  end loop;
  select * into anterior from inventario.versoes
    where empresa_id=empresa and estabelecimento_id=estabelecimento
    order by versao desc limit 1;
  nova_versao := coalesce(anterior.versao,0)+1;
  conteudo_final := pg_catalog.jsonb_build_object(
    'tipo','inventario-geral-demonstrativo-v1',
    'empresaId',empresa,'estabelecimentoId',estabelecimento,
    'itensPsicossociais',selecionados,'itensGerais',itens_gerais);
  if hash_esperado is distinct from pg_catalog.encode(
      extensions.digest(pg_catalog.convert_to(conteudo_final::text,'UTF8'),'sha256'),'hex')
    or pdf_bytes is null or pg_catalog.octet_length(pdf_bytes)<=100
    or hash_bytes is distinct from pg_catalog.encode(extensions.digest(pdf_bytes,'sha256'),'hex') then
    raise exception using errcode='23514',message='Documento ou conteúdo divergente';
  end if;
  resumo := pg_catalog.jsonb_build_object('versaoAnterior',anterior.versao,
    'hashAnterior',anterior.hash_conteudo,'hashAtual',hash_esperado,
    'conteudoAlterado',anterior.id is null or anterior.hash_conteudo<>hash_esperado);
  insert into inventario.versoes(empresa_id,estabelecimento_id,versao,conteudo,
    diferencas,hash_conteudo,pdf,hash_pdf,autor_id)
    values(empresa,estabelecimento,nova_versao,conteudo_final,resumo,
      hash_esperado,pdf_bytes,hash_bytes,organizacao.usuario_atual()) returning id into registro;
  return registro;
end $$;

revoke all on function inventario.impedir_alteracao(),inventario.alineas_completas(jsonb),
  inventario.consolidar(uuid,uuid,jsonb,jsonb,bytea,text,text)
  from public,anon,authenticated;
grant execute on function inventario.alineas_completas(jsonb),
  inventario.consolidar(uuid,uuid,jsonb,jsonb,bytea,text,text)
  to sistemanr1_api;
commit;
