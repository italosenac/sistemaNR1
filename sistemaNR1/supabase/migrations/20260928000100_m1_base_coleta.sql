-- E2 / M1: base privada e incremental. Aplicação remota exige autorização específica.
begin;

create schema coleta;
revoke all on schema coleta from public, anon, authenticated;
grant usage on schema coleta to sistemanr1_api;
alter default privileges in schema coleta revoke all on tables from public, anon, authenticated;
alter default privileges in schema coleta revoke execute on functions from public, anon, authenticated;

-- Chaves compostas impedem referenciar unidade ou fotografia de outra empresa.
alter table organizacao.grupos add constraint grupos_empresa_estabelecimento_id_unicos unique(empresa_id,estabelecimento_id,id);
alter table organizacao.estruturas_congeladas add constraint estruturas_empresa_estabelecimento_id_unicas unique(empresa_id,estabelecimento_id,id);

create table coleta.campanhas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references organizacao.empresas(id) on delete restrict,
  estabelecimento_id uuid not null,
  titulo text not null check(length(btrim(titulo)) between 3 and 150),
  estado text not null default 'rascunho' check(estado in ('rascunho','publicada','encerrada','cancelada')),
  inicio timestamptz,
  fim timestamptz,
  fuso text,
  meta_percentual numeric(5,2) check(meta_percentual between 0 and 100),
  minimo_divulgacao integer not null default 7 check(minimo_divulgacao >= 7),
  canal_divulgacao text,
  canal_alternativo text,
  estrutura_congelada_id uuid,
  criado_por uuid not null references organizacao.perfis(id) on delete restrict,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique(empresa_id,id),
  unique(empresa_id,estabelecimento_id,id),
  foreign key(empresa_id,estabelecimento_id) references organizacao.estabelecimentos(empresa_id,id) on delete restrict,
  foreign key(empresa_id,estabelecimento_id,estrutura_congelada_id) references organizacao.estruturas_congeladas(empresa_id,estabelecimento_id,id) on delete restrict,
  check(inicio is null or fim is null or inicio < fim),
  check(estado = 'rascunho' or (
    inicio is not null and fim is not null and fuso is not null and
    meta_percentual is not null and canal_divulgacao is not null and
    canal_alternativo is not null and estrutura_congelada_id is not null
  ))
);

create table coleta.grupos_campanha (
  empresa_id uuid not null,
  campanha_id uuid not null,
  grupo_id uuid not null,
  estabelecimento_id uuid not null,
  populacao_esperada integer not null check(populacao_esperada > 0),
  primary key(empresa_id,campanha_id,grupo_id),
  foreign key(empresa_id,estabelecimento_id,campanha_id) references coleta.campanhas(empresa_id,estabelecimento_id,id) on delete restrict,
  foreign key(empresa_id,estabelecimento_id,grupo_id) references organizacao.grupos(empresa_id,estabelecimento_id,id) on delete restrict
);

-- O código armazenado é somente hash; não há destinatário ou identidade nominal.
create table coleta.codigos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null,
  campanha_id uuid not null,
  grupo_id uuid not null,
  hash_codigo text not null unique check(hash_codigo ~ '^[a-f0-9]{64}$'),
  utilizado boolean not null default false,
  foreign key(empresa_id,campanha_id,grupo_id) references coleta.grupos_campanha(empresa_id,campanha_id,grupo_id) on delete restrict
);
create index codigos_por_campanha on coleta.codigos(empresa_id,campanha_id,grupo_id);

-- Sem hash do código, Auth ID, nome, matrícula, IP ou instante preciso.
create table coleta.respostas_protegidas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null,
  campanha_id uuid not null,
  grupo_id uuid not null,
  sobrecarga_percebida smallint not null check(sobrecarga_percebida between 1 and 3),
  ritmo_percebido smallint not null check(ritmo_percebido between 1 and 3),
  instrumento text not null default 'questionario-demo-v1' check(instrumento = 'questionario-demo-v1'),
  foreign key(empresa_id,campanha_id,grupo_id) references coleta.grupos_campanha(empresa_id,campanha_id,grupo_id) on delete restrict
);
create index respostas_por_grupo on coleta.respostas_protegidas(empresa_id,campanha_id,grupo_id);

create table coleta.registros_consulta (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null,
  campanha_id uuid not null,
  revisao integer not null check(revisao > 0),
  data_registro timestamptz not null default now(),
  escopo jsonb not null check(jsonb_typeof(escopo) = 'object'),
  meta_percentual numeric(5,2) not null check(meta_percentual between 0 and 100),
  respostas_validas integer not null check(respostas_validas >= 0),
  populacao_esperada integer not null check(populacao_esperada > 0),
  taxa_interna numeric(7,3) not null check(taxa_interna between 0 and 100),
  forma_divulgacao text not null check(length(btrim(forma_divulgacao)) > 0),
  criado_por uuid not null references organizacao.perfis(id) on delete restrict,
  motivo_correcao text,
  unique(empresa_id,campanha_id,revisao),
  foreign key(empresa_id,campanha_id) references coleta.campanhas(empresa_id,id) on delete restrict
);

create function coleta.pode_gerir(empresa uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select organizacao.tem_vinculo(empresa) and exists (
    select 1 from organizacao.vinculos_organizacionais v
    join organizacao.atribuicoes_papel a on a.empresa_id=v.empresa_id and a.vinculo_organizacional_id=v.id
    where v.empresa_id=empresa and v.usuario_id=organizacao.usuario_atual()
      and v.status='ativo' and a.status='ativo' and a.papel='gestor_sst_rh'
  );
$$;
create function coleta.pode_ler(empresa uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select organizacao.tem_vinculo(empresa) and exists (
    select 1 from organizacao.vinculos_organizacionais v
    join organizacao.atribuicoes_papel a on a.empresa_id=v.empresa_id and a.vinculo_organizacional_id=v.id
    where v.empresa_id=empresa and v.usuario_id=organizacao.usuario_atual()
      and v.status='ativo' and a.status='ativo' and a.papel in ('gestor_sst_rh','responsavel_tecnico')
  );
$$;
revoke all on function coleta.pode_gerir(uuid), coleta.pode_ler(uuid) from public, anon, authenticated;
grant execute on function coleta.pode_gerir(uuid), coleta.pode_ler(uuid) to sistemanr1_api;

alter table coleta.campanhas enable row level security;
alter table coleta.campanhas force row level security;
alter table coleta.grupos_campanha enable row level security;
alter table coleta.grupos_campanha force row level security;
alter table coleta.codigos enable row level security;
alter table coleta.codigos force row level security;
alter table coleta.respostas_protegidas enable row level security;
alter table coleta.respostas_protegidas force row level security;
alter table coleta.registros_consulta enable row level security;
alter table coleta.registros_consulta force row level security;

create policy campanhas_leitura on coleta.campanhas for select to sistemanr1_api
  using(coleta.pode_ler(empresa_id));
create policy campanhas_rascunho on coleta.campanhas for insert to sistemanr1_api
  with check(estado='rascunho' and criado_por=organizacao.usuario_atual() and coleta.pode_gerir(empresa_id));
create policy grupos_leitura on coleta.grupos_campanha for select to sistemanr1_api
  using(coleta.pode_ler(empresa_id));

grant select,insert on coleta.campanhas to sistemanr1_api;
grant select on coleta.grupos_campanha to sistemanr1_api;
-- Códigos, respostas e taxas internas não têm SELECT/INSERT/UPDATE direto para o runtime.
-- Casos de uso futuros receberão funções estreitas, transacionais e testadas.

commit;
