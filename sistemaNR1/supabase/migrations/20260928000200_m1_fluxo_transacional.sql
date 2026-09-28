-- E2 local: operações estreitas; não aplicar remotamente sem autorização específica.
begin;

create function coleta.adicionar_grupo(campanha uuid, grupo uuid, populacao integer)
returns void language plpgsql security definer set search_path = '' as $$
declare c coleta.campanhas%rowtype;
begin
  select * into c from coleta.campanhas where id=campanha for update;
  if not found or not coleta.pode_gerir(c.empresa_id) then
    raise exception using errcode='42501', message='Campanha indisponível';
  end if;
  if c.estado <> 'rascunho' then
    raise exception using errcode='23514', message='Estrutura publicada não pode ser editada';
  end if;
  insert into coleta.grupos_campanha(empresa_id,campanha_id,grupo_id,estabelecimento_id,populacao_esperada)
  values(c.empresa_id,c.id,grupo,c.estabelecimento_id,populacao);
end $$;

create function coleta.publicar_campanha(campanha uuid, fotografia uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare c coleta.campanhas%rowtype; total integer; limite integer;
begin
  select * into c from coleta.campanhas where id=campanha for update;
  if not found or not coleta.pode_gerir(c.empresa_id) then
    raise exception using errcode='42501', message='Campanha indisponível';
  end if;
  if c.estado <> 'rascunho' or c.inicio is null or c.fim is null or c.inicio >= c.fim
    or c.fuso is null or length(btrim(c.fuso))=0 or c.meta_percentual is null
    or length(btrim(coalesce(c.canal_divulgacao,'')))=0
    or length(btrim(coalesce(c.canal_alternativo,'')))<10 then
    raise exception using errcode='23514', message='Campanha incompleta para publicação';
  end if;
  select sum(populacao_esperada) into total from coleta.grupos_campanha where empresa_id=c.empresa_id and campanha_id=c.id;
  select populacao_total into limite from organizacao.estruturas_congeladas
    where id=fotografia and empresa_id=c.empresa_id and estabelecimento_id=c.estabelecimento_id;
  if total is null or limite is null or total > limite then
    raise exception using errcode='23514', message='População ou fotografia incompatível';
  end if;
  update coleta.campanhas set estado='publicada', estrutura_congelada_id=fotografia, atualizado_em=now() where id=c.id;
end $$;

create function coleta.emitir_codigo(campanha uuid, grupo uuid, hash text)
returns void language plpgsql security definer set search_path = '' as $$
declare c coleta.campanhas%rowtype; limite integer; emitidos integer;
begin
  select * into c from coleta.campanhas where id=campanha for update;
  if not found or not coleta.pode_gerir(c.empresa_id) then
    raise exception using errcode='42501', message='Campanha indisponível';
  end if;
  if c.estado <> 'publicada' or now() >= c.fim then
    raise exception using errcode='23514', message='Campanha fora da janela de emissão';
  end if;
  select populacao_esperada into limite from coleta.grupos_campanha
    where empresa_id=c.empresa_id and campanha_id=c.id and grupo_id=grupo;
  select count(*) into emitidos from coleta.codigos
    where empresa_id=c.empresa_id and campanha_id=c.id and grupo_id=grupo;
  if limite is null or emitidos >= limite then
    raise exception using errcode='23514', message='Limite de códigos do grupo atingido';
  end if;
  insert into coleta.codigos(empresa_id,campanha_id,grupo_id,hash_codigo)
    values(c.empresa_id,c.id,grupo,hash);
end $$;

create function coleta.registrar_resposta(hash text, sobrecarga smallint, ritmo smallint)
returns void language plpgsql security definer set search_path = '' as $$
declare codigo coleta.codigos%rowtype; c coleta.campanhas%rowtype;
begin
  if hash is null or hash !~ '^[a-f0-9]{64}$' or sobrecarga not between 1 and 3 or ritmo not between 1 and 3 then
    raise exception using errcode='23514', message='Resposta inválida';
  end if;
  select * into codigo from coleta.codigos where hash_codigo=hash for update;
  if not found or codigo.utilizado then
    raise exception using errcode='23514', message='Código indisponível';
  end if;
  select * into c from coleta.campanhas where id=codigo.campanha_id;
  if not found or c.estado <> 'publicada' or now() < c.inicio or now() >= c.fim then
    raise exception using errcode='23514', message='Coleta indisponível';
  end if;
  update coleta.codigos set utilizado=true where id=codigo.id;
  insert into coleta.respostas_protegidas(empresa_id,campanha_id,grupo_id,sobrecarga_percebida,ritmo_percebido)
    values(codigo.empresa_id,codigo.campanha_id,codigo.grupo_id,sobrecarga,ritmo);
end $$;

create function coleta.encerrar_campanha(campanha uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare c coleta.campanhas%rowtype; respostas integer; populacao integer; registro uuid;
begin
  select * into c from coleta.campanhas where id=campanha for update;
  if not found or not coleta.pode_gerir(c.empresa_id) then
    raise exception using errcode='42501', message='Campanha indisponível';
  end if;
  if c.estado <> 'publicada' or now() < c.fim or c.meta_percentual is null or c.estrutura_congelada_id is null then
    raise exception using errcode='23514', message='Campanha não encerrável';
  end if;
  select count(*) into respostas from coleta.respostas_protegidas
    where empresa_id=c.empresa_id and campanha_id=c.id;
  select sum(populacao_esperada) into populacao from coleta.grupos_campanha
    where empresa_id=c.empresa_id and campanha_id=c.id;
  if populacao is null or populacao < 1 or respostas > populacao then
    raise exception using errcode='23514', message='Taxa de adesão inválida';
  end if;
  insert into coleta.registros_consulta(
    empresa_id,campanha_id,revisao,escopo,meta_percentual,respostas_validas,
    populacao_esperada,taxa_interna,forma_divulgacao,criado_por
  ) values (
    c.empresa_id,c.id,1,
    pg_catalog.jsonb_build_object('estabelecimentoId',c.estabelecimento_id,'estruturaCongeladaId',c.estrutura_congelada_id),
    c.meta_percentual,respostas,populacao,pg_catalog.round((respostas::numeric/populacao)*100,3),
    c.canal_divulgacao,organizacao.usuario_atual()
  ) returning id into registro;
  update coleta.campanhas set estado='encerrada',atualizado_em=now() where id=c.id;
  return registro;
end $$;

revoke all on function coleta.adicionar_grupo(uuid,uuid,integer),
  coleta.publicar_campanha(uuid,uuid),coleta.emitir_codigo(uuid,uuid,text),
  coleta.registrar_resposta(text,smallint,smallint),coleta.encerrar_campanha(uuid)
  from public,anon,authenticated;
grant execute on function coleta.adicionar_grupo(uuid,uuid,integer),
  coleta.publicar_campanha(uuid,uuid),coleta.emitir_codigo(uuid,uuid,text),
  coleta.registrar_resposta(text,smallint,smallint),coleta.encerrar_campanha(uuid)
  to sistemanr1_api;

commit;
