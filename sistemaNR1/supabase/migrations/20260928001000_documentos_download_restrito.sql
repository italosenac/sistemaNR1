-- Downloads privados, sujeitos ao vínculo ativo em cada requisição.
begin;
create function avaliacao.pdf_criterio(empresa uuid,criterio uuid) returns bytea
language plpgsql stable security definer set search_path='' as $$
declare arquivo bytea;
begin
  if not avaliacao.pode_ler(empresa) then
    raise exception using errcode='42501',message='Documento indisponível';
  end if;
  select pdf into arquivo from avaliacao.criterios_versoes
    where empresa_id=empresa and id=criterio;
  if arquivo is null then raise exception using errcode='42501',message='Documento indisponível'; end if;
  return arquivo;
end $$;
create function inventario.pdf_versao(empresa uuid,versao_id uuid) returns bytea
language plpgsql stable security definer set search_path='' as $$
declare arquivo bytea;
begin
  if not avaliacao.pode_ler(empresa) then
    raise exception using errcode='42501',message='Documento indisponível';
  end if;
  select pdf into arquivo from inventario.versoes
    where empresa_id=empresa and id=versao_id;
  if arquivo is null then raise exception using errcode='42501',message='Documento indisponível'; end if;
  return arquivo;
end $$;
revoke all on function avaliacao.pdf_criterio(uuid,uuid),inventario.pdf_versao(uuid,uuid)
  from public,anon,authenticated;
grant execute on function avaliacao.pdf_criterio(uuid,uuid),inventario.pdf_versao(uuid,uuid)
  to sistemanr1_api;
commit;
