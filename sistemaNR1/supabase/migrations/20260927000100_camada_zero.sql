-- E1: somente Camada 0. Revisável; aplicação remota exige aprovação explícita.
begin;
create schema organizacao;
revoke all on schema organizacao from public, anon;
do $$ begin
  if not exists (select 1 from pg_roles where rolname='sistemanr1_api') then
    create role sistemanr1_api nologin nosuperuser nocreatedb nocreaterole noreplication nobypassrls;
  end if;
end $$;
grant usage on schema organizacao to sistemanr1_api, authenticated;
alter default privileges in schema organizacao revoke all on tables from public, anon, authenticated;
alter default privileges in schema organizacao revoke execute on functions from public, anon, authenticated;

create function organizacao.cnpj_valido(valor text) returns boolean
language plpgsql immutable set search_path='' as $$
declare base text; soma integer; resto integer; tamanho integer; etapa integer; indice integer;
begin
  if valor is null then return true; end if;
  if valor !~ '^[A-Z0-9]{12}[0-9]{2}$' or valor ~ '^([0-9])\1{13}$' then return false; end if;
  base := substring(valor,1,12);
  for etapa in 1..2 loop
    soma:=0; tamanho:=length(base);
    for indice in 1..tamanho loop soma:=soma+(ascii(substring(base,tamanho-indice+1,1))-48)*(2+(indice-1)%8); end loop;
    resto:=soma%11;
    base:=base||(case when resto<2 then 0 else 11-resto end)::text;
  end loop;
  return base=valor;
end $$;

create table organizacao.perfis (
  id uuid primary key references auth.users(id) on delete restrict,
  nome_completo text not null check(length(btrim(nome_completo)) between 3 and 150),
  status text not null default 'pendente' check(status in('pendente','ativo','inativo')),
  criado_em timestamptz not null default now(), atualizado_em timestamptz not null default now()
);
create table organizacao.empresas (
  id uuid primary key default gen_random_uuid(), razao_social text not null check(length(btrim(razao_social)) between 3 and 150),
  nome_fantasia text check(length(nome_fantasia)<=150), cnpj text unique check(organizacao.cnpj_valido(cnpj)),
  email_corporativo text check(length(email_corporativo)<=254), telefone text check(length(telefone)<=30),
  status text not null default 'ativo' check(status in('ativo','inativo')),
  criado_em timestamptz not null default now(), atualizado_em timestamptz not null default now()
);
create table organizacao.vinculos_organizacionais (
  id uuid primary key default gen_random_uuid(), usuario_id uuid not null references organizacao.perfis(id) on delete restrict,
  empresa_id uuid not null references organizacao.empresas(id) on delete restrict,
  matricula text check(matricula is null or (length(matricula) between 1 and 50 and matricula=btrim(matricula))),
  status text not null default 'ativo' check(status in('ativo','inativo')),
  criado_em timestamptz not null default now(), atualizado_em timestamptz not null default now(),
  unique(empresa_id,usuario_id), unique(empresa_id,id)
);
create unique index matricula_unica_empresa on organizacao.vinculos_organizacionais(empresa_id,lower(matricula)) where matricula is not null;
create index vinculos_por_usuario on organizacao.vinculos_organizacionais(usuario_id,empresa_id,status);
create table organizacao.atribuicoes_papel (
  id uuid primary key default gen_random_uuid(), empresa_id uuid not null, vinculo_organizacional_id uuid not null,
  papel text not null check(papel in('trabalhador','gestor_sst_rh','responsavel_tecnico','consultoria')),
  status text not null default 'ativo' check(status in('ativo','inativo')),
  concedido_por uuid not null references organizacao.perfis(id) on delete restrict,
  motivo text not null check(length(btrim(motivo)) between 3 and 500),
  criado_em timestamptz not null default now(), revogado_em timestamptz,
  foreign key(empresa_id,vinculo_organizacional_id) references organizacao.vinculos_organizacionais(empresa_id,id) on delete restrict,
  check((status='ativo' and revogado_em is null) or (status='inativo' and revogado_em is not null))
);
create unique index atribuicao_ativa_unica on organizacao.atribuicoes_papel(empresa_id,vinculo_organizacional_id,papel) where status='ativo';
create index atribuicoes_por_vinculo on organizacao.atribuicoes_papel(vinculo_organizacional_id,status);
create table organizacao.estabelecimentos (
  id uuid primary key default gen_random_uuid(), empresa_id uuid not null references organizacao.empresas(id) on delete restrict,
  nome text not null check(length(btrim(nome)) between 1 and 150), descricao text not null default '' check(length(descricao)<=2000),
  endereco text check(length(endereco)<=500), caracterizacao_ambiente text not null default '' check(length(caracterizacao_ambiente)<=4000),
  status text not null default 'ativo' check(status in('ativo','inativo')),
  criado_em timestamptz not null default now(), atualizado_em timestamptz not null default now(), unique(empresa_id,id)
);
create table organizacao.setores (
  id uuid primary key default gen_random_uuid(), empresa_id uuid not null, estabelecimento_id uuid not null,
  nome text not null check(length(btrim(nome)) between 1 and 150), descricao text not null default '' check(length(descricao)<=2000),
  status text not null default 'ativo' check(status in('ativo','inativo')),
  criado_em timestamptz not null default now(), atualizado_em timestamptz not null default now(),
  unique(empresa_id,id), unique(empresa_id,estabelecimento_id,id),
  foreign key(empresa_id,estabelecimento_id) references organizacao.estabelecimentos(empresa_id,id) on delete restrict
);
create table organizacao.funcoes (
  id uuid primary key default gen_random_uuid(), empresa_id uuid not null references organizacao.empresas(id) on delete restrict,
  nome text not null check(length(btrim(nome)) between 1 and 150), descricao text not null default '' check(length(descricao)<=2000),
  status text not null default 'ativo' check(status in('ativo','inativo')),
  criado_em timestamptz not null default now(), atualizado_em timestamptz not null default now(), unique(empresa_id,id)
);
create table organizacao.turnos (
  id uuid primary key default gen_random_uuid(), empresa_id uuid not null references organizacao.empresas(id) on delete restrict,
  nome text not null check(length(btrim(nome)) between 1 and 150), descricao text not null default '' check(length(descricao)<=2000),
  horario_inicio time, horario_fim time, check((horario_inicio is null)=(horario_fim is null)),
  status text not null default 'ativo' check(status in('ativo','inativo')),
  criado_em timestamptz not null default now(), atualizado_em timestamptz not null default now(), unique(empresa_id,id)
);
create table organizacao.grupos (
  id uuid primary key default gen_random_uuid(), empresa_id uuid not null, estabelecimento_id uuid not null, setor_id uuid not null,
  funcao_id uuid, turno_id uuid, nome text not null check(length(btrim(nome)) between 1 and 150),
  descricao text not null default '' check(length(descricao)<=2000),
  quantidade_estimada_trabalhadores integer not null check(quantidade_estimada_trabalhadores>0),
  status text not null default 'ativo' check(status in('ativo','inativo')),
  criado_em timestamptz not null default now(), atualizado_em timestamptz not null default now(), unique(empresa_id,id),
  foreign key(empresa_id,estabelecimento_id) references organizacao.estabelecimentos(empresa_id,id) on delete restrict,
  foreign key(empresa_id,estabelecimento_id,setor_id) references organizacao.setores(empresa_id,estabelecimento_id,id) on delete restrict,
  foreign key(empresa_id,funcao_id) references organizacao.funcoes(empresa_id,id) on delete restrict,
  foreign key(empresa_id,turno_id) references organizacao.turnos(empresa_id,id) on delete restrict
);
create index grupos_por_setor on organizacao.grupos(empresa_id,setor_id,status);
create table organizacao.lotacoes_usuario (
  id uuid primary key default gen_random_uuid(), empresa_id uuid not null, vinculo_organizacional_id uuid not null,
  estabelecimento_id uuid, setor_id uuid, funcao_id uuid, turno_id uuid,
  status text not null default 'ativo' check(status in('ativo','inativo')),
  criado_em timestamptz not null default now(), atualizado_em timestamptz not null default now(),
  unique(empresa_id,vinculo_organizacional_id), check(setor_id is null or estabelecimento_id is not null),
  foreign key(empresa_id,vinculo_organizacional_id) references organizacao.vinculos_organizacionais(empresa_id,id) on delete restrict,
  foreign key(empresa_id,estabelecimento_id) references organizacao.estabelecimentos(empresa_id,id) on delete restrict,
  foreign key(empresa_id,estabelecimento_id,setor_id) references organizacao.setores(empresa_id,estabelecimento_id,id) on delete restrict,
  foreign key(empresa_id,funcao_id) references organizacao.funcoes(empresa_id,id) on delete restrict,
  foreign key(empresa_id,turno_id) references organizacao.turnos(empresa_id,id) on delete restrict
);
create table organizacao.identificacoes_profissionais (
  id uuid primary key default gen_random_uuid(), usuario_id uuid not null references organizacao.perfis(id) on delete restrict,
  conselho text not null check(length(btrim(conselho)) between 1 and 100), numero_registro text not null check(length(btrim(numero_registro)) between 1 and 50),
  uf text check(uf is null or uf ~ '^[A-Z]{2}$'), verificado boolean not null default false check(not verificado),
  criado_em timestamptz not null default now(), atualizado_em timestamptz not null default now(),
  unique(usuario_id,conselho,numero_registro)
);
create table organizacao.estruturas_congeladas (
  id uuid primary key default gen_random_uuid(), empresa_id uuid not null, estabelecimento_id uuid not null,
  revisao integer not null check(revisao>0), populacao_total integer not null check(populacao_total>0),
  conteudo jsonb not null check(jsonb_typeof(conteudo)='object'),
  criado_em timestamptz not null default now(), criado_por uuid not null references organizacao.perfis(id) on delete restrict,
  unique(empresa_id,estabelecimento_id,revisao),
  foreign key(empresa_id,estabelecimento_id) references organizacao.estabelecimentos(empresa_id,id) on delete restrict
);
create table organizacao.eventos_auditoria (
  id uuid primary key default gen_random_uuid(), empresa_id uuid references organizacao.empresas(id) on delete restrict,
  ator_id uuid references organizacao.perfis(id) on delete restrict,
  entidade text not null, registro_id uuid not null, operacao text not null,
  motivo text, criado_em timestamptz not null default now()
);
create index auditoria_por_empresa on organizacao.eventos_auditoria(empresa_id,criado_em);

-- Funções estreitas, sem parâmetros de ator; identidade vem da sessão verificada.
create function organizacao.usuario_atual() returns uuid language sql stable security definer set search_path='' as $$ select auth.uid(); $$;
create function organizacao.perfil_ativo() returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from organizacao.perfis p join auth.users u on u.id=p.id where p.id=organizacao.usuario_atual() and p.status='ativo' and u.email_confirmed_at is not null and (u.banned_until is null or u.banned_until<now()));
$$;
create function organizacao.tem_vinculo(empresa uuid) returns boolean language sql stable security definer set search_path='' as $$
  select organizacao.perfil_ativo() and exists(select 1 from organizacao.vinculos_organizacionais v join organizacao.empresas e on e.id=v.empresa_id where v.usuario_id=organizacao.usuario_atual() and v.empresa_id=empresa and v.status='ativo' and e.status='ativo');
$$;
create function organizacao.tem_capacidade(empresa uuid, capacidade text) returns boolean language sql stable security definer set search_path='' as $$
  select organizacao.tem_vinculo(empresa) and exists(select 1 from organizacao.vinculos_organizacionais v join organizacao.atribuicoes_papel a on a.vinculo_organizacional_id=v.id and a.empresa_id=v.empresa_id
  where v.usuario_id=organizacao.usuario_atual() and v.empresa_id=empresa and v.status='ativo' and a.status='ativo' and
    case capacidade
      when 'empresa:ler' then a.papel in('gestor_sst_rh','responsavel_tecnico','consultoria')
      when 'estrutura:ler' then a.papel in('gestor_sst_rh','responsavel_tecnico')
      when 'carteira:ler' then a.papel='consultoria'
      when 'empresa:editar' then a.papel='gestor_sst_rh'
      when 'estrutura:gerenciar' then a.papel='gestor_sst_rh'
      when 'usuarios:gerenciar' then a.papel='gestor_sst_rh'
      else false end);
$$;
create function organizacao.vinculo_proprio(vinculo uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from organizacao.vinculos_organizacionais v where v.id=vinculo and v.usuario_id=organizacao.usuario_atual() and v.status='ativo' and organizacao.tem_vinculo(v.empresa_id));
$$;
create function organizacao.pode_ver_perfil(usuario uuid) returns boolean language sql stable security definer set search_path='' as $$
 select (usuario=organizacao.usuario_atual()) or (organizacao.perfil_ativo() and exists(select 1 from organizacao.vinculos_organizacionais v where v.usuario_id=usuario and organizacao.tem_capacidade(v.empresa_id,'usuarios:gerenciar')));
$$;
create function organizacao.minhas_empresas() returns table(id uuid,nome text,papeis text[]) language sql stable security definer set search_path='' as $$
 select e.id,e.razao_social,coalesce(array_agg(a.papel order by a.papel) filter(where a.papel is not null),'{}'::text[])
 from organizacao.empresas e join organizacao.vinculos_organizacionais v on v.empresa_id=e.id
 left join organizacao.atribuicoes_papel a on a.vinculo_organizacional_id=v.id and a.status='ativo'
 where v.usuario_id=organizacao.usuario_atual() and organizacao.tem_vinculo(e.id) and v.status='ativo' group by e.id order by e.razao_social;
$$;

create function organizacao.criar_perfil_auth() returns trigger language plpgsql security definer set search_path='' as $$
declare nome text;
begin
 nome:=btrim(new.raw_user_meta_data->>'nome_completo');
 insert into organizacao.perfis(id,nome_completo,status) values(new.id,case when length(nome) between 3 and 150 then nome else 'Cadastro pendente' end,
 case when new.email_confirmed_at is not null and length(nome) between 3 and 150 then 'ativo' else 'pendente' end);
 return new;
end $$;
create trigger sistemanr1_criar_perfil after insert on auth.users for each row execute function organizacao.criar_perfil_auth();
create function organizacao.confirmar_perfil_auth() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.email_confirmed_at is not null then
  update organizacao.perfis set status='ativo',atualizado_em=now() where id=new.id and status='pendente' and nome_completo<>'Cadastro pendente';
 end if;
 return new;
end $$;
create trigger sistemanr1_confirmar_perfil after update of email_confirmed_at on auth.users for each row execute function organizacao.confirmar_perfil_auth();
create function organizacao.reconciliar_perfil(nome text) returns organizacao.perfis language plpgsql security definer set search_path='' as $$
declare resultado organizacao.perfis;
begin
 if organizacao.usuario_atual() is null or not exists(select 1 from auth.users where id=organizacao.usuario_atual() and email_confirmed_at is not null and (banned_until is null or banned_until<now())) then raise exception using errcode='42501',message='Identidade não confirmada'; end if;
 if length(btrim(nome)) not between 3 and 150 or nome is null then raise exception using errcode='23514',message='Nome inválido'; end if;
 insert into organizacao.perfis(id,nome_completo,status) values(organizacao.usuario_atual(),btrim(nome),'ativo') on conflict(id) do nothing;
 update organizacao.perfis set nome_completo=btrim(nome),status='ativo',atualizado_em=now() where id=organizacao.usuario_atual() and status='pendente';
 select * into resultado from organizacao.perfis where id=organizacao.usuario_atual();
 if resultado.status='inativo' then raise exception using errcode='42501',message='Conta inativa'; end if;
 return resultado;
end $$;
-- Reconciliação de contas legadas sem conceder privilégios por metadados.
insert into organizacao.perfis(id,nome_completo,status)
select id,case when length(btrim(raw_user_meta_data->>'nome_completo')) between 3 and 150 then btrim(raw_user_meta_data->>'nome_completo') else 'Cadastro pendente' end,
case when email_confirmed_at is not null and length(btrim(raw_user_meta_data->>'nome_completo')) between 3 and 150 then 'ativo' else 'pendente' end from auth.users on conflict(id) do nothing;

create function organizacao.criar_empresa(razao text,fantasia text,documento text,email_contato text,telefone_contato text) returns uuid language plpgsql security definer set search_path='' as $$
declare empresa uuid; vinculo uuid;
begin
 perform 1 from organizacao.perfis where id=organizacao.usuario_atual() for share;
 if not organizacao.perfil_ativo() then raise exception using errcode='42501',message='Conta não ativa'; end if;
 insert into organizacao.empresas(razao_social,nome_fantasia,cnpj,email_corporativo,telefone) values(btrim(razao),nullif(btrim(fantasia),''),nullif(documento,''),nullif(btrim(email_contato),''),nullif(btrim(telefone_contato),'')) returning id into empresa;
 insert into organizacao.vinculos_organizacionais(empresa_id,usuario_id) values(empresa,organizacao.usuario_atual()) returning id into vinculo;
 insert into organizacao.atribuicoes_papel(empresa_id,vinculo_organizacional_id,papel,concedido_por,motivo) values(empresa,vinculo,'gestor_sst_rh',organizacao.usuario_atual(),'Bootstrap de empresa nova');
 return empresa;
end $$;

-- Bloqueio compartilhado da conta e exclusivo da empresa ordena escritas/revogações.
create function organizacao.bloquear_empresa(empresa uuid) returns void language plpgsql security definer set search_path='' as $$
begin
 perform 1 from organizacao.perfis where id=organizacao.usuario_atual() for share;
 perform 1 from organizacao.empresas where id=empresa for update;
 if not organizacao.tem_vinculo(empresa) then raise exception using errcode='42501',message='Acesso não autorizado'; end if;
end $$;
create function organizacao.proteger_escrita() returns trigger language plpgsql set search_path='' as $$
declare empresa uuid; alvo uuid; gestores integer; capacidade text;
begin
 if tg_op='DELETE' then raise exception using errcode='42501',message='Exclusão física não permitida'; end if;
 empresa:=case when tg_table_name='empresas' then new.id else (to_jsonb(new)->>'empresa_id')::uuid end;
 if tg_op='UPDATE' and (new.id<>old.id or (tg_table_name<>'empresas' and to_jsonb(new)->>'empresa_id'<>to_jsonb(old)->>'empresa_id')) then raise exception using errcode='23514',message='Identidade imutável'; end if;
 -- Apenas o proprietário, por funções de bootstrap estreitas, insere a empresa inicial.
 if current_user not in ('postgres','supabase_admin') then
  perform organizacao.bloquear_empresa(empresa);
  capacidade:=case when tg_table_name='empresas' then 'empresa:editar' when tg_table_name in('vinculos_organizacionais','atribuicoes_papel','lotacoes_usuario') then 'usuarios:gerenciar' else 'estrutura:gerenciar' end;
  if not organizacao.tem_capacidade(empresa,capacidade) then raise exception using errcode='42501',message='Capacidade ausente'; end if;
 end if;
 if tg_table_name='vinculos_organizacionais' then
  new.matricula:=nullif(btrim(new.matricula),'');
  if tg_op='UPDATE' and new.usuario_id<>old.usuario_id then raise exception using errcode='23514',message='Titular imutável'; end if;
 end if;
 if tg_table_name='atribuicoes_papel' then
  select usuario_id into alvo from organizacao.vinculos_organizacionais where id=new.vinculo_organizacional_id and empresa_id=empresa;
  if alvo=organizacao.usuario_atual() and current_user not in('postgres','supabase_admin') then raise exception using errcode='42501',message='Autoatribuição não permitida'; end if;
  if tg_op='INSERT' then new.concedido_por:=organizacao.usuario_atual(); new.criado_em:=now();
  else
   if new.vinculo_organizacional_id<>old.vinculo_organizacional_id or new.papel<>old.papel or old.status<>'ativo' or new.status<>'inativo' then raise exception using errcode='23514',message='Somente revogação de atribuição ativa'; end if;
   new.revogado_em:=now();
  end if;
 end if;
 if tg_op='UPDATE' and tg_table_name in('vinculos_organizacionais','atribuicoes_papel') and old.status='ativo' and new.status='inativo' then
  select count(distinct v.id) into gestores from organizacao.vinculos_organizacionais v join organizacao.atribuicoes_papel a on a.vinculo_organizacional_id=v.id join organizacao.perfis p on p.id=v.usuario_id
  where v.empresa_id=empresa and v.status='ativo' and p.status='ativo' and a.status='ativo' and a.papel='gestor_sst_rh'
  and (case when tg_table_name='vinculos_organizacionais' then v.id<>new.id else a.id<>new.id end);
  if gestores=0 then raise exception using errcode='23514',message='Preserve ao menos um gestor ativo'; end if;
 end if;
 if tg_table_name='lotacoes_usuario' then
  if tg_op='UPDATE' and new.vinculo_organizacional_id<>old.vinculo_organizacional_id then raise exception using errcode='23514',message='Vínculo imutável'; end if;
 end if;
 if tg_table_name<>'atribuicoes_papel' then new.atualizado_em:=now(); end if;
 return new;
end $$;

create function organizacao.validar_referencias() returns trigger language plpgsql set search_path='' as $$
declare dados jsonb:=to_jsonb(new); estabelecimento uuid:=(dados->>'estabelecimento_id')::uuid; setor uuid:=(dados->>'setor_id')::uuid;
begin
 if new.status='inativo' then return new; end if;
 if estabelecimento is not null and not exists(select 1 from organizacao.estabelecimentos where id=estabelecimento and empresa_id=new.empresa_id and status='ativo') then raise exception using errcode='23514',message='Estabelecimento inválido'; end if;
 if setor is not null and not exists(select 1 from organizacao.setores where id=setor and empresa_id=new.empresa_id and estabelecimento_id=estabelecimento and status='ativo') then raise exception using errcode='23514',message='Setor incompatível'; end if;
 if dados->>'funcao_id' is not null and not exists(select 1 from organizacao.funcoes where id=(dados->>'funcao_id')::uuid and empresa_id=new.empresa_id and status='ativo') then raise exception using errcode='23514',message='Função inválida'; end if;
 if dados->>'turno_id' is not null and not exists(select 1 from organizacao.turnos where id=(dados->>'turno_id')::uuid and empresa_id=new.empresa_id and status='ativo') then raise exception using errcode='23514',message='Turno inválido'; end if;
 if tg_table_name='grupos' then
  if exists(select 1 from organizacao.grupos g where g.empresa_id=new.empresa_id and g.setor_id=new.setor_id and g.id<>new.id and g.status='ativo'
   and (g.funcao_id is null or new.funcao_id is null or g.funcao_id=new.funcao_id) and (g.turno_id is null or new.turno_id is null or g.turno_id=new.turno_id)) then raise exception using errcode='23514',message='Grupos sobrepostos'; end if;
 end if;
 return new;
end $$;
create function organizacao.registrar_auditoria() returns trigger language plpgsql security definer set search_path='' as $$
declare dados jsonb:=to_jsonb(new);
begin
 insert into organizacao.eventos_auditoria(empresa_id,ator_id,entidade,registro_id,operacao,motivo)
 values(case when tg_table_name='empresas' then new.id else (dados->>'empresa_id')::uuid end,organizacao.usuario_atual(),tg_table_name,new.id,tg_op,left(coalesce(dados->>'motivo',current_setting('sistemanr1.motivo',true)),500));
 return new;
end $$;
create function organizacao.impedir_mutacao_historica() returns trigger language plpgsql set search_path='' as $$ begin raise exception using errcode='42501',message='Registro histórico imutável'; end $$;

do $$ declare tabela text; begin
 foreach tabela in array array['perfis','empresas','vinculos_organizacionais','atribuicoes_papel','lotacoes_usuario','identificacoes_profissionais','estabelecimentos','setores','funcoes','turnos','grupos','estruturas_congeladas','eventos_auditoria'] loop
  execute format('alter table organizacao.%I enable row level security',tabela);
  execute format('alter table organizacao.%I force row level security',tabela);
 end loop;
 foreach tabela in array array['empresas','vinculos_organizacionais','atribuicoes_papel','lotacoes_usuario','estabelecimentos','setores','funcoes','turnos','grupos'] loop
  execute format('create trigger a_proteger before insert or update or delete on organizacao.%I for each row execute function organizacao.proteger_escrita()',tabela);
  execute format('create trigger z_auditar after insert or update on organizacao.%I for each row execute function organizacao.registrar_auditoria()',tabela);
 end loop;
 foreach tabela in array array['setores','lotacoes_usuario','grupos'] loop
  execute format('create trigger b_referencias before insert or update on organizacao.%I for each row execute function organizacao.validar_referencias()',tabela);
 end loop;
 foreach tabela in array array['estruturas_congeladas','eventos_auditoria'] loop
  execute format('create trigger impedir_mutacao before update or delete on organizacao.%I for each row execute function organizacao.impedir_mutacao_historica()',tabela);
 end loop;
end $$;

create policy perfis_leitura on organizacao.perfis for select to sistemanr1_api,authenticated using(organizacao.pode_ver_perfil(id));
create policy perfis_edicao on organizacao.perfis for update to sistemanr1_api using(id=organizacao.usuario_atual() and organizacao.perfil_ativo()) with check(id=organizacao.usuario_atual() and status='ativo');
create policy empresas_leitura on organizacao.empresas for select to sistemanr1_api,authenticated using(organizacao.tem_capacidade(id,'empresa:ler'));
create policy empresas_edicao on organizacao.empresas for update to sistemanr1_api using(organizacao.tem_capacidade(id,'empresa:editar')) with check(organizacao.tem_capacidade(id,'empresa:editar'));
create policy vinculos_leitura on organizacao.vinculos_organizacionais for select to sistemanr1_api,authenticated using((usuario_id=organizacao.usuario_atual() and organizacao.tem_vinculo(empresa_id)) or organizacao.tem_capacidade(empresa_id,'usuarios:gerenciar'));
create policy atribuicoes_leitura on organizacao.atribuicoes_papel for select to sistemanr1_api,authenticated using(organizacao.vinculo_proprio(vinculo_organizacional_id) or organizacao.tem_capacidade(empresa_id,'usuarios:gerenciar'));
create policy lotacoes_leitura on organizacao.lotacoes_usuario for select to sistemanr1_api,authenticated using(organizacao.vinculo_proprio(vinculo_organizacional_id) or organizacao.tem_capacidade(empresa_id,'usuarios:gerenciar'));
do $$ declare tabela text; begin
 foreach tabela in array array['vinculos_organizacionais','atribuicoes_papel','lotacoes_usuario'] loop
  execute format('create policy cadastro on organizacao.%I for insert to sistemanr1_api with check(organizacao.tem_capacidade(empresa_id,''usuarios:gerenciar''))',tabela);
  execute format('create policy edicao on organizacao.%I for update to sistemanr1_api using(organizacao.tem_capacidade(empresa_id,''usuarios:gerenciar'')) with check(organizacao.tem_capacidade(empresa_id,''usuarios:gerenciar''))',tabela);
 end loop;
 foreach tabela in array array['estabelecimentos','setores','funcoes','turnos','grupos'] loop
  execute format('create policy leitura on organizacao.%I for select to sistemanr1_api,authenticated using(organizacao.tem_capacidade(empresa_id,''estrutura:ler''))',tabela);
  execute format('create policy cadastro on organizacao.%I for insert to sistemanr1_api with check(organizacao.tem_capacidade(empresa_id,''estrutura:gerenciar''))',tabela);
  execute format('create policy edicao on organizacao.%I for update to sistemanr1_api using(organizacao.tem_capacidade(empresa_id,''estrutura:gerenciar'')) with check(organizacao.tem_capacidade(empresa_id,''estrutura:gerenciar''))',tabela);
 end loop;
end $$;
create policy profissional_leitura on organizacao.identificacoes_profissionais for select to sistemanr1_api,authenticated using(usuario_id=organizacao.usuario_atual() and organizacao.perfil_ativo());
create policy profissional_cadastro on organizacao.identificacoes_profissionais for insert to sistemanr1_api with check(usuario_id=organizacao.usuario_atual() and organizacao.perfil_ativo() and not verificado);
create policy profissional_edicao on organizacao.identificacoes_profissionais for update to sistemanr1_api using(usuario_id=organizacao.usuario_atual() and organizacao.perfil_ativo()) with check(usuario_id=organizacao.usuario_atual() and not verificado);
create policy snapshots_leitura on organizacao.estruturas_congeladas for select to sistemanr1_api,authenticated using(organizacao.tem_capacidade(empresa_id,'estrutura:ler'));
create policy snapshots_cadastro on organizacao.estruturas_congeladas for insert to sistemanr1_api with check(organizacao.tem_capacidade(empresa_id,'estrutura:gerenciar') and criado_por=organizacao.usuario_atual());
create policy auditoria_leitura on organizacao.eventos_auditoria for select to sistemanr1_api using(organizacao.tem_capacidade(empresa_id,'usuarios:gerenciar'));

revoke all on all tables in schema organizacao from public,anon,authenticated,sistemanr1_api;
grant select on all tables in schema organizacao to sistemanr1_api;
grant select on organizacao.perfis,organizacao.empresas,organizacao.vinculos_organizacionais,organizacao.atribuicoes_papel,organizacao.lotacoes_usuario,organizacao.identificacoes_profissionais,organizacao.estabelecimentos,organizacao.setores,organizacao.funcoes,organizacao.turnos,organizacao.grupos,organizacao.estruturas_congeladas to authenticated;
grant update(nome_completo,atualizado_em) on organizacao.perfis to sistemanr1_api;
grant update(razao_social,nome_fantasia,cnpj,email_corporativo,telefone,status) on organizacao.empresas to sistemanr1_api;
grant insert on organizacao.vinculos_organizacionais,organizacao.atribuicoes_papel,organizacao.lotacoes_usuario,organizacao.identificacoes_profissionais,organizacao.estabelecimentos,organizacao.setores,organizacao.funcoes,organizacao.turnos,organizacao.grupos,organizacao.estruturas_congeladas to sistemanr1_api;
grant update(matricula,status) on organizacao.vinculos_organizacionais to sistemanr1_api;
grant update(status,motivo) on organizacao.atribuicoes_papel to sistemanr1_api;
grant update(estabelecimento_id,setor_id,funcao_id,turno_id,status) on organizacao.lotacoes_usuario to sistemanr1_api;
grant update(conselho,numero_registro,uf,atualizado_em) on organizacao.identificacoes_profissionais to sistemanr1_api;
grant update(nome,descricao,endereco,caracterizacao_ambiente,status) on organizacao.estabelecimentos to sistemanr1_api;
grant update(nome,descricao,estabelecimento_id,status) on organizacao.setores to sistemanr1_api;
grant update(nome,descricao,status) on organizacao.funcoes to sistemanr1_api;
grant update(nome,descricao,horario_inicio,horario_fim,status) on organizacao.turnos to sistemanr1_api;
grant update(nome,descricao,estabelecimento_id,setor_id,funcao_id,turno_id,quantidade_estimada_trabalhadores,status) on organizacao.grupos to sistemanr1_api;
revoke all on all functions in schema organizacao from public,anon,authenticated,sistemanr1_api;
grant execute on function organizacao.usuario_atual(),organizacao.cnpj_valido(text),organizacao.perfil_ativo(),organizacao.tem_vinculo(uuid),organizacao.tem_capacidade(uuid,text),organizacao.vinculo_proprio(uuid),organizacao.pode_ver_perfil(uuid) to sistemanr1_api,authenticated;
grant execute on function organizacao.minhas_empresas(),organizacao.reconciliar_perfil(text),organizacao.criar_empresa(text,text,text,text,text),organizacao.bloquear_empresa(uuid) to sistemanr1_api;
comment on schema organizacao is 'Camada 0 privada; Data API sem escrita. Identidade nominal nunca relacionada a respostas M1.';
commit;
