-- HISTÓRICO: migração anterior nunca aplicada; retirada do diretório executável na E1.
-- Catálogo remoto conferido em 2026-09-27. Preservada para comparação, não executar.
-- Senhas/e-mail pertencem a auth.users; nenhum cadastro nominal integra M1.
begin;

create schema organizacao;
revoke all on schema organizacao from public, anon, authenticated;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'sistemanr1_api') then
    create role sistemanr1_api nologin nosuperuser nocreatedb nocreaterole noreplication nobypassrls;
  end if;
end $$;

create table organizacao.empresas (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (char_length(btrim(nome)) between 1 and 150),
  arquivado boolean not null default false
);
create table organizacao.estabelecimentos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references organizacao.empresas(id) on delete restrict,
  nome text not null check (char_length(btrim(nome)) between 1 and 150),
  localizacao text not null default '',
  arquivado boolean not null default false,
  unique (empresa_id,id)
);
create table organizacao.setores (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null,
  estabelecimento_id uuid not null,
  nome text not null check (char_length(btrim(nome)) between 1 and 150),
  arquivado boolean not null default false,
  foreign key (empresa_id,estabelecimento_id) references organizacao.estabelecimentos(empresa_id,id) on delete restrict,
  unique (empresa_id,estabelecimento_id,id)
);
create table organizacao.funcoes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references organizacao.empresas(id) on delete restrict,
  nome text not null check (char_length(btrim(nome)) between 1 and 150),
  arquivado boolean not null default false,
  unique (empresa_id,id)
);
create table organizacao.turnos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references organizacao.empresas(id) on delete restrict,
  nome text not null check (char_length(btrim(nome)) between 1 and 150),
  arquivado boolean not null default false,
  unique (empresa_id,id)
);
create table organizacao.perfis_usuarios (
  usuario_id uuid primary key references auth.users(id) on delete restrict,
  nome_completo text not null check (char_length(btrim(nome_completo)) between 3 and 150)
);
create table organizacao.vinculos (
  empresa_id uuid not null references organizacao.empresas(id) on delete restrict,
  usuario_id uuid not null references organizacao.perfis_usuarios(usuario_id) on delete restrict,
  matricula_funcional text not null check (char_length(matricula_funcional) between 1 and 50 and matricula_funcional=btrim(matricula_funcional)),
  papel text not null check (papel in ('gestor','tecnico','leitor')),
  ativo boolean not null default true,
  estabelecimento_id uuid,
  setor_id uuid,
  funcao_id uuid,
  turno_id uuid,
  primary key (empresa_id,usuario_id),
  check (setor_id is null or estabelecimento_id is not null),
  foreign key (empresa_id,estabelecimento_id) references organizacao.estabelecimentos(empresa_id,id) on delete restrict,
  foreign key (empresa_id,estabelecimento_id,setor_id) references organizacao.setores(empresa_id,estabelecimento_id,id) on delete restrict,
  foreign key (empresa_id,funcao_id) references organizacao.funcoes(empresa_id,id) on delete restrict,
  foreign key (empresa_id,turno_id) references organizacao.turnos(empresa_id,id) on delete restrict
);
create unique index vinculos_matricula_empresa on organizacao.vinculos(empresa_id,lower(matricula_funcional));
create index vinculos_usuario_ativo on organizacao.vinculos(usuario_id,empresa_id) where ativo;

create function organizacao.criar_perfil_auth()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into organizacao.perfis_usuarios(usuario_id,nome_completo)
    values(new.id,btrim(new.raw_user_meta_data->>'nome_completo'));
  return new;
end $$;
revoke all on function organizacao.criar_perfil_auth() from public,anon,authenticated;
create trigger sistemanr1_criar_perfil after insert on auth.users
  for each row execute function organizacao.criar_perfil_auth();

-- Funções estreitas evitam recursão das políticas de vínculos. Nunca confiam em user_metadata.
create function organizacao.tem_vinculo(empresa uuid, somente_gestor boolean default false)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from organizacao.vinculos v join organizacao.empresas e on e.id=v.empresa_id
    where v.usuario_id=auth.uid() and v.empresa_id=empresa and v.ativo and not e.arquivado
      and (not somente_gestor or v.papel='gestor')
  );
$$;
create function organizacao.pode_ver_perfil(usuario uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select usuario=auth.uid() or exists (
    select 1 from organizacao.vinculos alvo join organizacao.vinculos gestor on gestor.empresa_id=alvo.empresa_id
    join organizacao.empresas e on e.id=alvo.empresa_id
    where alvo.usuario_id=usuario and alvo.ativo and gestor.usuario_id=auth.uid()
      and gestor.ativo and gestor.papel='gestor' and not e.arquivado
  );
$$;
revoke all on function organizacao.tem_vinculo(uuid,boolean) from public,anon,authenticated;
revoke all on function organizacao.pode_ver_perfil(uuid) from public,anon,authenticated;
grant usage on schema organizacao,auth to sistemanr1_api;
grant execute on function auth.uid() to sistemanr1_api;
grant execute on function organizacao.tem_vinculo(uuid,boolean),organizacao.pode_ver_perfil(uuid) to sistemanr1_api;

alter table organizacao.empresas enable row level security;
alter table organizacao.empresas force row level security;
alter table organizacao.estabelecimentos enable row level security;
alter table organizacao.estabelecimentos force row level security;
alter table organizacao.setores enable row level security;
alter table organizacao.setores force row level security;
alter table organizacao.funcoes enable row level security;
alter table organizacao.funcoes force row level security;
alter table organizacao.turnos enable row level security;
alter table organizacao.turnos force row level security;
alter table organizacao.perfis_usuarios enable row level security;
alter table organizacao.perfis_usuarios force row level security;
alter table organizacao.vinculos enable row level security;
alter table organizacao.vinculos force row level security;

create policy empresas_leitura on organizacao.empresas for select to sistemanr1_api using (organizacao.tem_vinculo(id));
create policy estabelecimentos_leitura on organizacao.estabelecimentos for select to sistemanr1_api using (organizacao.tem_vinculo(empresa_id));
create policy setores_leitura on organizacao.setores for select to sistemanr1_api using (organizacao.tem_vinculo(empresa_id));
create policy funcoes_leitura on organizacao.funcoes for select to sistemanr1_api using (organizacao.tem_vinculo(empresa_id));
create policy turnos_leitura on organizacao.turnos for select to sistemanr1_api using (organizacao.tem_vinculo(empresa_id));
create policy perfis_leitura on organizacao.perfis_usuarios for select to sistemanr1_api using (organizacao.pode_ver_perfil(usuario_id));
create policy vinculos_leitura on organizacao.vinculos for select to sistemanr1_api
  using ((usuario_id=auth.uid() and ativo) or organizacao.tem_vinculo(empresa_id,true));
create policy vinculos_cadastro on organizacao.vinculos for insert to sistemanr1_api
  with check (organizacao.tem_vinculo(empresa_id,true));

revoke all on all tables in schema organizacao from public,anon,authenticated;
grant select on all tables in schema organizacao to sistemanr1_api;
grant insert on organizacao.vinculos to sistemanr1_api;
comment on table organizacao.perfis_usuarios is 'Perfil administrativo. Sem e-mail/senha/matrícula e sem relação com respostas M1.';
comment on table organizacao.vinculos is 'Matrícula e lotação por empresa. Não identifica destinatários de códigos nem respostas M1.';

commit;
