-- HISTÓRICO do modelo anterior, não executar. Suíte vigente: supabase/tests/camada-zero.sql.
-- Rodar como administrador SOMENTE em ambiente sintético. Todas as linhas abaixo sofrem rollback.
begin;

insert into auth.users(id,email,raw_user_meta_data) values
('10000000-0000-4000-8000-000000000001','gestor-a@example.invalid','{"nome_completo":"Gestor Fictício A"}'),
('10000000-0000-4000-8000-000000000002','gestor-b@example.invalid','{"nome_completo":"Gestor Fictício B"}'),
('10000000-0000-4000-8000-000000000003','leitor@example.invalid','{"nome_completo":"Leitor Fictício","papel":"gestor"}'),
('10000000-0000-4000-8000-000000000004','comum@example.invalid','{"nome_completo":"Pessoa Fictícia"}'),
('10000000-0000-4000-8000-000000000005','novo@example.invalid','{"nome_completo":"Novo Perfil Fictício"}');
insert into organizacao.empresas(id,nome) values
('20000000-0000-4000-8000-000000000001','Empresa Fictícia A'),
('20000000-0000-4000-8000-000000000002','Empresa Fictícia B');
insert into organizacao.estabelecimentos(id,empresa_id,nome) values
('40000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','Unidade A'),
('40000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000002','Unidade B'),
('40000000-0000-4000-8000-000000000003','20000000-0000-4000-8000-000000000001','Unidade A2');
insert into organizacao.setores(id,empresa_id,estabelecimento_id,nome) values
('50000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001','Setor A');
insert into organizacao.funcoes(id,empresa_id,nome) values
('60000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','Função A'),
('60000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000002','Função B');
insert into organizacao.turnos(id,empresa_id,nome) values
('70000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','Turno A'),
('70000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000002','Turno B');
insert into organizacao.vinculos(empresa_id,usuario_id,matricula_funcional,papel) values
('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','001','gestor'),
('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002','001','gestor'),
('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000003','LEITOR','leitor'),
('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000004','002','leitor'),
('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000004','072','tecnico');

do $$
begin
  if (select count(*) from organizacao.vinculos where usuario_id='10000000-0000-4000-8000-000000000004')<>2 then raise exception 'Matrículas por empresa não coexistiram'; end if;
  if (select nome_completo from organizacao.perfis_usuarios where usuario_id='10000000-0000-4000-8000-000000000005') is distinct from 'Novo Perfil Fictício' then raise exception 'Trigger não copiou nome para perfil'; end if;
  if has_schema_privilege('anon','organizacao','USAGE') or has_schema_privilege('authenticated','organizacao','USAGE') then raise exception 'Navegador recebeu acesso ao schema'; end if;
  if exists(select 1 from information_schema.columns where table_schema='organizacao' and column_name in ('senha','password','encrypted_password','email')) then raise exception 'Credencial duplicada em schema próprio'; end if;
end $$;

set local role sistemanr1_api;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
do $$
begin
  if exists(select 1 from organizacao.vinculos where empresa_id='20000000-0000-4000-8000-000000000002') then raise exception 'Vazamento de matrículas da empresa B'; end if;
  if exists(select 1 from organizacao.perfis_usuarios where usuario_id='10000000-0000-4000-8000-000000000002') then raise exception 'Vazamento de perfil sem empresa compartilhada'; end if;
  begin
    insert into organizacao.vinculos(empresa_id,usuario_id,matricula_funcional,papel)
      values('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002','001','leitor');
    raise exception 'Matrícula duplicada foi aceita';
  exception when unique_violation then null;
  end;
  begin
    insert into organizacao.vinculos(empresa_id,usuario_id,matricula_funcional,papel,estabelecimento_id)
      values('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002','003','leitor','40000000-0000-4000-8000-000000000002');
    raise exception 'Lotação de outra empresa foi aceita';
  exception when foreign_key_violation then null;
  end;
  begin
    insert into organizacao.vinculos(empresa_id,usuario_id,matricula_funcional,papel,funcao_id)
      values('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002','003','leitor','60000000-0000-4000-8000-000000000002');
    raise exception 'Função de outra empresa foi aceita';
  exception when foreign_key_violation then null;
  end;
  begin
    insert into organizacao.vinculos(empresa_id,usuario_id,matricula_funcional,papel,turno_id)
      values('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002','003','leitor','70000000-0000-4000-8000-000000000002');
    raise exception 'Turno de outra empresa foi aceito';
  exception when foreign_key_violation then null;
  end;
  begin
    insert into organizacao.vinculos(empresa_id,usuario_id,matricula_funcional,papel,estabelecimento_id,setor_id)
      values('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002','003','leitor','40000000-0000-4000-8000-000000000003','50000000-0000-4000-8000-000000000001');
    raise exception 'Setor de outro estabelecimento foi aceito';
  exception when foreign_key_violation then null;
  end;
  begin
    insert into organizacao.vinculos(empresa_id,usuario_id,matricula_funcional,papel)
      values('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002','leitor','leitor');
    raise exception 'Matrícula duplicada com caixa diferente foi aceita';
  exception when unique_violation then null;
  end;
  insert into organizacao.vinculos(empresa_id,usuario_id,matricula_funcional,papel,estabelecimento_id,setor_id,funcao_id,turno_id)
    values('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000005','0005','leitor',
      '40000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000001',
      '60000000-0000-4000-8000-000000000001','70000000-0000-4000-8000-000000000001');
  if not exists(select 1 from organizacao.vinculos v join organizacao.perfis_usuarios p on p.usuario_id=v.usuario_id
    where v.usuario_id='10000000-0000-4000-8000-000000000005' and v.matricula_funcional='0005') then raise exception 'Gestor não conseguiu gravar/consultar vínculo válido'; end if;
  begin
    insert into organizacao.vinculos(empresa_id,usuario_id,matricula_funcional,papel)
      values('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000005','0005','gestor');
    raise exception 'Gestor de A conseguiu cadastrar em B';
  exception when insufficient_privilege then null;
  end;
end $$;

select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000003',true);
do $$
begin
  if organizacao.tem_vinculo('20000000-0000-4000-8000-000000000001',true) then raise exception 'Metadado editável elevou leitor a gestor'; end if;
  begin
    insert into organizacao.vinculos(empresa_id,usuario_id,matricula_funcional,papel)
      values('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002','003','gestor');
    raise exception 'Leitor conseguiu conceder gestão';
  exception when insufficient_privilege then null;
  end;
end $$;

reset role;
update organizacao.vinculos set ativo=false where usuario_id='10000000-0000-4000-8000-000000000001';
set local role sistemanr1_api;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
do $$
begin
  if exists(select 1 from organizacao.empresas) then raise exception 'Vínculo inativo preservou acesso'; end if;
end $$;
reset role;
rollback;
