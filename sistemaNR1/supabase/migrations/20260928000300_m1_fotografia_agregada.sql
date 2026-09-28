-- E2 local: fechamento atômico, registro documental e fotografia sem respostas individuais.
-- Não aplicar no projeto remoto sem autorização específica.
begin;

alter table coleta.registros_consulta
  add constraint registros_consulta_empresa_campanha_id_unicos unique(empresa_id,campanha_id,id);

create table coleta.fotografias_agregadas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null,
  campanha_id uuid not null,
  registro_consulta_id uuid not null,
  estabelecimento_id uuid not null,
  estrutura_congelada_id uuid not null,
  politica_versao text not null default 'particao-fixa-v1' check(politica_versao='particao-fixa-v1'),
  minimo_divulgacao integer not null check(minimo_divulgacao>=7),
  resultado jsonb not null check(jsonb_typeof(resultado)='object'),
  criado_em timestamptz not null default now(),
  unique(empresa_id,campanha_id),
  foreign key(empresa_id,campanha_id) references coleta.campanhas(empresa_id,id) on delete restrict,
  foreign key(empresa_id,campanha_id,registro_consulta_id)
    references coleta.registros_consulta(empresa_id,campanha_id,id) on delete restrict,
  foreign key(empresa_id,estabelecimento_id,estrutura_congelada_id)
    references organizacao.estruturas_congeladas(empresa_id,estabelecimento_id,id) on delete restrict
);

alter table coleta.fotografias_agregadas enable row level security;
alter table coleta.fotografias_agregadas force row level security;
revoke all on coleta.fotografias_agregadas from public,anon,authenticated,sistemanr1_api;

create function coleta.impedir_alteracao_fotografia() returns trigger
language plpgsql set search_path='' as $$
begin
  raise exception using errcode='42501', message='Fotografia agregada imutável';
end $$;
create trigger fotografia_agregada_imutavel before update or delete
  on coleta.fotografias_agregadas for each row execute function coleta.impedir_alteracao_fotografia();

create function coleta.encerrar_com_agregado(campanha uuid) returns uuid
language plpgsql security definer set search_path='' as $$
declare
  c coleta.campanhas%rowtype;
  registro uuid;
  total integer;
  todos_seguro boolean;
  partes jsonb := '[]'::jsonb;
  grupo record;
  media_sobrecarga numeric;
  media_ritmo numeric;
  nivel text;
begin
  -- A função anterior valida ator, vínculo, papel, janela e insere o registro
  -- na mesma transação. Qualquer falha posterior desfaz esse encerramento.
  registro := coleta.encerrar_campanha(campanha);
  select * into c from coleta.campanhas where id=campanha;
  if c.estado <> 'encerrada' or c.estrutura_congelada_id is null then
    raise exception using errcode='23514', message='Encerramento incompleto';
  end if;
  select count(*) into total from coleta.respostas_protegidas
    where empresa_id=c.empresa_id and campanha_id=c.id;
  select coalesce(bool_and(contagem >= c.minimo_divulgacao),false)
    into todos_seguro from (
      select count(r.id) as contagem from coleta.grupos_campanha g
      left join coleta.respostas_protegidas r
        on r.empresa_id=g.empresa_id and r.campanha_id=g.campanha_id and r.grupo_id=g.grupo_id
      where g.empresa_id=c.empresa_id and g.campanha_id=c.id
      group by g.grupo_id
    ) por_grupo;

  if total >= c.minimo_divulgacao and todos_seguro then
    nivel := 'grupo';
    for grupo in
      select g.grupo_id as id,
        pg_catalog.round(avg(r.sobrecarga_percebida)::numeric,2) as sobrecarga,
        pg_catalog.round(avg(r.ritmo_percebido)::numeric,2) as ritmo
      from coleta.grupos_campanha g join coleta.respostas_protegidas r
        on r.empresa_id=g.empresa_id and r.campanha_id=g.campanha_id and r.grupo_id=g.grupo_id
      where g.empresa_id=c.empresa_id and g.campanha_id=c.id
      group by g.grupo_id order by g.grupo_id
    loop
      partes := partes || pg_catalog.jsonb_build_array(
        pg_catalog.jsonb_build_object('escopoTipo','grupo','escopoId',grupo.id,
          'fatorId','sobrecarga_percebida','media',grupo.sobrecarga),
        pg_catalog.jsonb_build_object('escopoTipo','grupo','escopoId',grupo.id,
          'fatorId','ritmo_percebido','media',grupo.ritmo));
    end loop;
  elsif total >= c.minimo_divulgacao then
    nivel := 'estabelecimento';
    select pg_catalog.round(avg(sobrecarga_percebida)::numeric,2),
      pg_catalog.round(avg(ritmo_percebido)::numeric,2)
      into media_sobrecarga,media_ritmo
      from coleta.respostas_protegidas where empresa_id=c.empresa_id and campanha_id=c.id;
    partes := pg_catalog.jsonb_build_array(
      pg_catalog.jsonb_build_object('escopoTipo','estabelecimento','escopoId',c.estabelecimento_id,
        'fatorId','sobrecarga_percebida','media',media_sobrecarga),
      pg_catalog.jsonb_build_object('escopoTipo','estabelecimento','escopoId',c.estabelecimento_id,
        'fatorId','ritmo_percebido','media',media_ritmo));
  else
    nivel := 'suprimido';
  end if;

  insert into coleta.fotografias_agregadas(
    empresa_id,campanha_id,registro_consulta_id,estabelecimento_id,
    estrutura_congelada_id,minimo_divulgacao,resultado
  ) values (
    c.empresa_id,c.id,registro,c.estabelecimento_id,c.estrutura_congelada_id,c.minimo_divulgacao,
    pg_catalog.jsonb_build_object('estado',nivel,'particoes',partes,'instrumento','questionario-demo-v1')
  );
  return registro;
end $$;

create function coleta.pacote_agregado(campanha uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare foto coleta.fotografias_agregadas%rowtype;
begin
  select * into foto from coleta.fotografias_agregadas where campanha_id=campanha;
  if not found or not coleta.pode_ler(foto.empresa_id) then
    raise exception using errcode='42501', message='Pacote indisponível';
  end if;
  return pg_catalog.jsonb_build_object(
    'empresaId',foto.empresa_id,'campanhaId',foto.campanha_id,
    'estabelecimentoId',foto.estabelecimento_id,'estruturaCongeladaId',foto.estrutura_congelada_id,
    'registroConsultaId',foto.registro_consulta_id,'fotografiaId',foto.id,
    'politicaVersao',foto.politica_versao,'minimoDivulgacao',foto.minimo_divulgacao,
    'demonstrativo',true,'resultado',foto.resultado
  );
end $$;

revoke all on function coleta.encerrar_campanha(uuid) from sistemanr1_api;
revoke all on function coleta.encerrar_com_agregado(uuid), coleta.pacote_agregado(uuid)
  from public,anon,authenticated;
grant execute on function coleta.encerrar_com_agregado(uuid), coleta.pacote_agregado(uuid)
  to sistemanr1_api;

commit;
