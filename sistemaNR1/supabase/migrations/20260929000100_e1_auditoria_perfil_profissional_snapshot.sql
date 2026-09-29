begin;

create trigger z_auditar after insert or update on organizacao.perfis
for each row execute function organizacao.registrar_auditoria();

create trigger z_auditar after insert or update on organizacao.identificacoes_profissionais
for each row execute function organizacao.registrar_auditoria();

create trigger z_auditar after insert on organizacao.estruturas_congeladas
for each row execute function organizacao.registrar_auditoria();

commit;
