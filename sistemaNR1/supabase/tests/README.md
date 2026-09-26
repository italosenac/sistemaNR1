# Testes de banco preparados

`usuarios_rls.sql` contém verificações de perfis, matrículas por empresa, FKs de lotação e RLS usando dados fictícios e transação com rollback.

**Não executado.** A instrução vigente proíbe aplicar migrações. Este arquivo não é incluído em `pnpm test`, pois os testes de aplicação com portas substituídas não comprovam RLS.

Após autorização explícita, preparar Supabase local/descartável com a migração revisada e executar com cliente SQL autenticado como administrador desse ambiente de teste. Não apontar para produção nem executar contra projeto com dados reais. A conexão de runtime deve usar login NOSUPERUSER/NOBYPASSRLS membro de `sistemanr1_api`, sem ser proprietário das tabelas, e TLS validado.

Os testes não criam hash/senha em tabelas próprias e não adicionam identidade a M1. Os UUIDs reservados são sintéticos; repetir somente em ambiente isolado. O primeiro perfil Auth controlado precisa de `nome_completo` nos metadados de criação para o trigger preparado.
