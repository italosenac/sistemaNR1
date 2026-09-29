-- Integração SQL local/autorizada. Dados fictícios; tudo sofre rollback.
begin;
create function pg_temp.afirmar(condicao boolean, mensagem text) returns void language plpgsql as $$ begin if condicao is distinct from true then raise exception '%',mensagem; end if; end $$;
create function pg_temp.negar(comando text, estado text) returns void language plpgsql as $$
begin
 begin execute comando; exception when others then if sqlstate=estado then return; else raise; end if; end;
 raise exception 'Operação indevida foi aceita: %',estado;
end $$;
insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values
 ('10000000-0000-4000-8000-000000000001','gestor-a@e1.example.invalid',now(),'{"nome_completo":"Gestor Fictício A"}'),
 ('10000000-0000-4000-8000-000000000002','gestor-b@e1.example.invalid',now(),'{"nome_completo":"Gestor Fictício B"}'),
 ('10000000-0000-4000-8000-000000000003','trabalhador@e1.example.invalid',now(),'{"nome_completo":"Trabalhador Fictício","papel":"gestor_sst_rh"}'),
 ('10000000-0000-4000-8000-000000000004','consultoria@e1.example.invalid',now(),'{"nome_completo":"Consultoria Fictícia"}'),
 ('10000000-0000-4000-8000-000000000005','tecnico@e1.example.invalid',now(),'{"nome_completo":"Técnico Fictício"}'),
 ('10000000-0000-4000-8000-000000000006','sem-perfil@e1.example.invalid',now(),'{}');

set local role sistemanr1_api;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
select set_config('e1.empresa_a',organizacao.criar_empresa('Empresa Fictícia A',null,null,null,null)::text,true);
select pg_temp.afirmar(organizacao.tem_capacidade(current_setting('e1.empresa_a')::uuid,'usuarios:gerenciar'),'Bootstrap não concedeu gestão');
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',true);
select set_config('e1.empresa_b',organizacao.criar_empresa('Empresa Fictícia B',null,null,null,null)::text,true);
select pg_temp.afirmar((select count(*)=1 from organizacao.empresas),'Gestor B leu A');
select pg_temp.afirmar(not organizacao.tem_vinculo(current_setting('e1.empresa_a')::uuid),'Vínculo cruzado');

select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
insert into organizacao.vinculos_organizacionais(id,empresa_id,usuario_id,matricula) values
 ('20000000-0000-4000-8000-000000000003',current_setting('e1.empresa_a')::uuid,'10000000-0000-4000-8000-000000000003',null),
 ('20000000-0000-4000-8000-000000000004',current_setting('e1.empresa_a')::uuid,'10000000-0000-4000-8000-000000000004',null),
 ('20000000-0000-4000-8000-000000000005',current_setting('e1.empresa_a')::uuid,'10000000-0000-4000-8000-000000000005','001');
insert into organizacao.atribuicoes_papel(empresa_id,vinculo_organizacional_id,papel,concedido_por,motivo) values
 (current_setting('e1.empresa_a')::uuid,'20000000-0000-4000-8000-000000000003','trabalhador',organizacao.usuario_atual(),'Teste fictício'),
 (current_setting('e1.empresa_a')::uuid,'20000000-0000-4000-8000-000000000004','consultoria',organizacao.usuario_atual(),'Teste fictício'),
 (current_setting('e1.empresa_a')::uuid,'20000000-0000-4000-8000-000000000005','responsavel_tecnico',organizacao.usuario_atual(),'Teste fictício');
select pg_temp.negar($q$update organizacao.vinculos_organizacionais set matricula='001' where id='20000000-0000-4000-8000-000000000003'$q$,'23505');
select pg_temp.negar($q$insert into organizacao.atribuicoes_papel(empresa_id,vinculo_organizacional_id,papel,concedido_por,motivo) select empresa_id,id,'gestor_sst_rh',organizacao.usuario_atual(),'Autopromoção fictícia' from organizacao.vinculos_organizacionais where usuario_id=organizacao.usuario_atual()$q$,'42501');
select pg_temp.negar($q$update organizacao.vinculos_organizacionais set status='inativo' where usuario_id=organizacao.usuario_atual()$q$,'23514');
select pg_temp.negar($q$update organizacao.perfis set status='ativo' where id=organizacao.usuario_atual()$q$,'42501');

insert into organizacao.estabelecimentos(id,empresa_id,nome) values('40000000-0000-4000-8000-000000000001',current_setting('e1.empresa_a')::uuid,'Unidade A');
insert into organizacao.estabelecimentos(id,empresa_id,nome) values('40000000-0000-4000-8000-000000000002',current_setting('e1.empresa_a')::uuid,'Unidade A2');
insert into organizacao.setores(id,empresa_id,estabelecimento_id,nome) values('50000000-0000-4000-8000-000000000001',current_setting('e1.empresa_a')::uuid,'40000000-0000-4000-8000-000000000001','Setor A');
insert into organizacao.funcoes(id,empresa_id,nome) values('60000000-0000-4000-8000-000000000001',current_setting('e1.empresa_a')::uuid,'Função A'),('60000000-0000-4000-8000-000000000002',current_setting('e1.empresa_a')::uuid,'Função B');
insert into organizacao.turnos(empresa_id,nome,horario_inicio,horario_fim) values(current_setting('e1.empresa_a')::uuid,'Noturno','22:00','06:00');
insert into organizacao.grupos(empresa_id,estabelecimento_id,setor_id,funcao_id,nome,quantidade_estimada_trabalhadores) values
 (current_setting('e1.empresa_a')::uuid,'40000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000001','60000000-0000-4000-8000-000000000001','Grupo 8',8),
 (current_setting('e1.empresa_a')::uuid,'40000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000001','60000000-0000-4000-8000-000000000002','Grupo 12',12);
select pg_temp.afirmar((select sum(quantidade_estimada_trabalhadores)=20 from organizacao.grupos),'População não totalizou 20');
select pg_temp.negar($q$insert into organizacao.grupos(empresa_id,estabelecimento_id,setor_id,nome,quantidade_estimada_trabalhadores) values(current_setting('e1.empresa_a')::uuid,'40000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000001','Sobreposição',20)$q$,'23514');
select pg_temp.negar($q$insert into organizacao.lotacoes_usuario(empresa_id,vinculo_organizacional_id,estabelecimento_id,setor_id) values(current_setting('e1.empresa_a')::uuid,'20000000-0000-4000-8000-000000000003','40000000-0000-4000-8000-000000000002','50000000-0000-4000-8000-000000000001')$q$,'23514');
insert into organizacao.lotacoes_usuario(empresa_id,vinculo_organizacional_id,estabelecimento_id,setor_id) values(current_setting('e1.empresa_a')::uuid,'20000000-0000-4000-8000-000000000003','40000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000001');
update organizacao.perfis set nome_completo='Gestor Fictício A Atualizado' where id=organizacao.usuario_atual();
insert into organizacao.identificacoes_profissionais(usuario_id,conselho,numero_registro,uf) values(organizacao.usuario_atual(),'Conselho Fictício','FICT-001','SP');
insert into organizacao.estruturas_congeladas(empresa_id,estabelecimento_id,revisao,populacao_total,conteudo,criado_por) values(current_setting('e1.empresa_a')::uuid,'40000000-0000-4000-8000-000000000001',1,20,'{}'::jsonb,organizacao.usuario_atual());

set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000003',true);
select pg_temp.afirmar((select count(*)=1 from organizacao.perfis),'Trabalhador leu outros perfis');
select pg_temp.afirmar((select count(*)=1 from organizacao.vinculos_organizacionais),'Trabalhador leu outros vínculos');
select pg_temp.afirmar((select count(*)=1 from organizacao.lotacoes_usuario),'Trabalhador não leu lotação própria');
select pg_temp.afirmar((select count(*)=0 from organizacao.estabelecimentos),'Trabalhador acessou diretório estrutural');
select pg_temp.negar($q$insert into organizacao.atribuicoes_papel(empresa_id,vinculo_organizacional_id,papel,concedido_por,motivo) values(current_setting('e1.empresa_a')::uuid,'20000000-0000-4000-8000-000000000003','gestor_sst_rh',organizacao.usuario_atual(),'Autoatribuição')$q$,'42501');
select pg_temp.negar($q$update organizacao.empresas set razao_social='Invasão' where id=current_setting('e1.empresa_b')::uuid$q$,'42501');
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000005',true);
select pg_temp.afirmar((select count(*)=2 from organizacao.estabelecimentos),'Técnico não leu estrutura permitida');
select pg_temp.afirmar(not organizacao.tem_capacidade(current_setting('e1.empresa_a')::uuid,'usuarios:gerenciar'),'Técnico recebeu gestão');
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000004',true);
select pg_temp.afirmar((select count(*)=1 from organizacao.empresas),'Consultoria leu empresa não autorizada');
select pg_temp.afirmar((select count(*)=0 from organizacao.estabelecimentos),'Consultoria ganhou capacidade técnica implícita');

set local role sistemanr1_api;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',true);
insert into organizacao.vinculos_organizacionais(empresa_id,usuario_id,matricula) values(current_setting('e1.empresa_b')::uuid,'10000000-0000-4000-8000-000000000005','072');
select pg_temp.negar($q$insert into organizacao.setores(empresa_id,estabelecimento_id,nome) values(current_setting('e1.empresa_b')::uuid,'40000000-0000-4000-8000-000000000001','Setor cruzado')$q$,'23514');
select pg_temp.negar($q$insert into organizacao.funcoes(empresa_id,nome) values(current_setting('e1.empresa_a')::uuid,'Função cruzada')$q$,'42501');
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
insert into organizacao.atribuicoes_papel(empresa_id,vinculo_organizacional_id,papel,concedido_por,motivo) values(current_setting('e1.empresa_a')::uuid,'20000000-0000-4000-8000-000000000004','responsavel_tecnico',organizacao.usuario_atual(),'Concessão explícita');
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000004',true);
select pg_temp.afirmar(organizacao.tem_capacidade(current_setting('e1.empresa_a')::uuid,'estrutura:ler'),'Papel adicional não concedeu capacidade');
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
update organizacao.atribuicoes_papel set status='inativo',motivo='Revogação fictícia' where vinculo_organizacional_id='20000000-0000-4000-8000-000000000004' and papel='responsavel_tecnico';
update organizacao.vinculos_organizacionais set status='inativo' where id='20000000-0000-4000-8000-000000000005';
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000004',true);
select pg_temp.afirmar(not organizacao.tem_capacidade(current_setting('e1.empresa_a')::uuid,'estrutura:ler'),'Papel revogado ainda autoriza');
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000005',true);
select pg_temp.afirmar(not organizacao.tem_vinculo(current_setting('e1.empresa_a')::uuid),'Vínculo revogado ainda autoriza');
select pg_temp.afirmar(organizacao.tem_vinculo(current_setting('e1.empresa_b')::uuid),'Revogação A afetou B');
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000006',true);
select organizacao.reconciliar_perfil('Pessoa Legada Fictícia');
select pg_temp.afirmar(organizacao.perfil_ativo(),'Reconciliação não ativou perfil pendente confirmado');
select pg_temp.afirmar((select count(*)=0 from organizacao.minhas_empresas()),'Reconciliação concedeu empresa');
reset role;
update organizacao.perfis set status='inativo' where id='10000000-0000-4000-8000-000000000005';
set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000005',true);
select pg_temp.afirmar(not organizacao.tem_vinculo(current_setting('e1.empresa_b')::uuid),'Conta inativa preservou acesso');
reset role;
select pg_temp.afirmar(organizacao.cnpj_valido('12ABC34501DE35') and not organizacao.cnpj_valido('12ABC34501DE34'),'Dígitos CNPJ inválidos');
select pg_temp.afirmar((select count(*)>0 from organizacao.eventos_auditoria),'Auditoria vazia');
select pg_temp.afirmar((select count(*)=1 from organizacao.eventos_auditoria where entidade='perfis' and operacao='UPDATE' and registro_id='10000000-0000-4000-8000-000000000001' and ator_id='10000000-0000-4000-8000-000000000001'),'Edição de perfil sem auditoria');
select pg_temp.afirmar((select count(*)=1 from organizacao.eventos_auditoria where entidade='identificacoes_profissionais' and operacao='INSERT' and ator_id='10000000-0000-4000-8000-000000000001'),'Identificação profissional sem auditoria');
select pg_temp.afirmar((select count(*)=1 from organizacao.eventos_auditoria where entidade='estruturas_congeladas' and operacao='INSERT' and empresa_id=current_setting('e1.empresa_a')::uuid and ator_id='10000000-0000-4000-8000-000000000001'),'Snapshot sem auditoria empresarial');
select pg_temp.negar('delete from organizacao.eventos_auditoria','42501');
rollback;
