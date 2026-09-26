# Evidências — cadastro de usuários da Camada 0

Data: 2026-09-26. Revisão base: `5cfbfe8`; alterações locais ainda não commitadas nesta entrega. Pedido explícito: atualizar modelagem, SPECs, migrações preparadas, DTOs, formulários e testes para nome completo, e-mail, senha, matrícula por empresa e lotação opcional. A proibição anterior de aplicar migrações permanece vigente.

**Estado: Parcialmente implementado.** Código local, documentação e testes de aplicação concluídos para este recorte; persistência/RLS reais não foram executadas. E1 inteira não está concluída. [SPEC C0](../../specs/camada-0/estrutura-organizacional.spec.md), [matriz](../matriz-rastreabilidade.md) e [backlog](../backlog-mvp.md) refletem esse limite.

## Entrega preparada

| Responsabilidade | Local |
| --- | --- |
| Identidade, e-mail e senha | Supabase Auth; senha somente na entrada até Auth, sem tabela própria de credenciais |
| Nome completo | `organizacao.perfis_usuarios`, referenciado por `auth.users`; trigger de criação copia o nome |
| Matrícula, papel e lotação | `organizacao.vinculos`, por usuário/empresa, com matrícula textual única na empresa |
| Empresa, estabelecimento, setor, função, turno | Referências organizacionais; FKs compostas impedem misturar empresas; setor pertence ao estabelecimento |
| Autorização | Identidade verificada no servidor por Auth; vínculo ativo de gestor exigido no contexto da empresa |
| Isolamento | Schema privado, papel PostgreSQL restrito, contexto de usuário local à transação e políticas RLS preparadas |
| Interface | `/usuarios`: login administrativo, escolha da empresa, cadastro de nova conta ou vínculo de conta existente |

Associar uma conta existente a outra empresa não altera nome, e-mail ou senha. Cada vínculo recebe sua própria matrícula. Nome/e-mail/matrícula/identificador de usuário não foram adicionados a respostas, tokens de participação ou contratos de agregação do M1. Não há implementação de questionários nesta entrega.

Rotas preparadas sob `/api/v1`: `GET /minhas-empresas`; `GET /empresas/:empresaId/usuarios`; `GET /empresas/:empresaId/usuarios/opcoes`; `POST /empresas/:empresaId/usuarios`; `POST /empresas/:empresaId/vinculos`. Todas exigem Bearer e usam respostas sem cache. E-mail/senha não são devolvidos no vínculo. A API rejeita campos adicionais, inclusive tentativa de definir a empresa/ator no corpo ou alterar credenciais ao vincular conta existente.

Falha depois de criar a identidade Auth retorna `CADASTRO_PARCIAL` e identificador para reconciliação. Não existe transação distribuída entre Auth e PostgreSQL; uma falha de confirmação de commit não permite afirmar que o vínculo foi revertido. Não há exclusão automática de identidade nem concessão permissiva de acesso.

## Verificações executadas

Todos os comandos abaixo terminaram com código 0 no Windows/PowerShell, Node 24.19.0 e pnpm 12.6.0.

| Comando/verificação | Resultado |
| --- | --- |
| `pnpm.cmd install --frozen-lockfile` | Lockfile consistente, instalação reproduzível |
| `pnpm.cmd typecheck` | Contratos, API, frontend e testes sem erros de tipos |
| `pnpm.cmd lint` | Pacotes, testes de navegador e configuração aprovados |
| `pnpm.cmd test` | 44 testes Jest em 4 suítes e 13 testes Playwright aprovados |
| `pnpm.cmd build` | Contratos, NestJS e Next.js compilados; rota `/usuarios` gerada |
| `pnpm.cmd format:check` | Formatação aprovada |
| `git diff --check` | Sem erros de whitespace; avisos de conversão LF/CRLF do Git no Windows |
| SHA-256 contra `docs/validacao/preservacao-e0.json` | 27 arquivos preservados: 21 SPECs M1–M3, 3 PDFs e 3 Skills, nenhuma divergência |
| Links locais da documentação | 281 referências em 51 arquivos Markdown, nenhum destino ausente |
| Busca sanitizada do segredo em artefatos web | 147 arquivos de saída examinados, nenhuma ocorrência da chave secreta |

Os 44 testes Jest incluem os 14 testes de fundação, 9 de domínio/aplicação de usuários, 17 de contrato HTTP/validação e 4 do adaptador Auth. Os 13 testes de navegador incluem 7 cenários de fundação e 6 de usuários.

Jest executa o adaptador Auth com transporte substituído; os testes HTTP usam Nest real com portas de identidade/persistência substituídas. Playwright mantém a jornada no navegador, com Auth e rotas de cadastro interceptadas e dados exclusivamente fictícios. Os servidores de teste usam portas 3100/3101 e diretório `.next-e2e`; nenhum usuário foi criado no Supabase remoto. Esses testes não comprovam persistência, transações PostgreSQL ou RLS.

Avisos de módulos ESM experimentais do Jest e de cores dos processos não impediram os testes. O build terminou sem falhas. Não houve deploy.

## Cobertura dos critérios

| Critério | Evidência e limite |
| --- | --- |
| CA-C0-01–05 | Preservados; árvore completa, população, revisões e histórico ainda pendentes de E1 |
| CA-C0-06 | DTO/HTTP, divisão dos dados nas portas, payload do SDK e formulário verificados; gravação Auth/perfil/vínculo real pendente |
| CA-C0-07 | Aplicação e navegador verificam matrícula independente e ausência de alteração de credenciais; coexistência/uniqueness preparadas no SQL, não executadas |
| CA-C0-08 | Setor sem estabelecimento rejeitado na API; formulário limpa setor ao trocar estabelecimento; FKs e casos negativos de estabelecimento/setor/função/turno preparados no SQL |
| CA-C0-09 | Token ausente/recusado e recusa de autorização antes da criação testados; identidade usa chave pública, criação usa segredo de backend; vínculo/role reais e RLS pendentes |
| CA-C0-10 | Falhas de Auth, vínculo e formulário não devolvem senha; resultado parcial exige reconciliação; commit/rollback real pendente |
| CA-C0-11 | Revisão de modelo/contratos e hashes das fontes preservados; nenhuma aresta nominal para M1; anonimato funcional será validado na implementação de M1 |
| CA-C0-12 | Quatro campos, validações PT-BR, limpeza de senha após envio, troca de empresa/estabelecimento, vínculo existente e ausência de persistência no armazenamento do navegador testados |

Arquivos de testes: [aplicação](../../apps/api/test/usuarios.spec.ts), [HTTP](../../apps/api/test/usuarios-http.spec.ts), [adaptador Auth](../../apps/api/test/identidades-supabase.spec.ts), [navegador](../../tests/usuarios.spec.ts).

## Banco preparado, sem execução

[Migração C0](../../supabase/migrations/20260926000100_c0_usuarios_e_vinculos.sql) e [testes SQL](../../supabase/tests/usuarios_rls.sql) estão disponíveis para revisão. Nenhum `db push`, `migration up`, `db reset`, seed, DDL remoto ou teste SQL de C0 foi executado. Sintaxe/compatibilidade da migração e comportamento das políticas ainda dependem de execução no ambiente de teste autorizado.

Os testes SQL preparados cobrem trigger de perfil, matrículas por empresa, unicidade sem distinguir caixa, acesso a perfis compartilhados, cadastro válido por gestor, referências de outras empresas/estabelecimentos, tentativa de cadastro em outra empresa, leitor com metadado de papel forjado e vínculo inativo. Usam transação com rollback e somente identidades fictícias. Procedimento e limites no [guia dos testes SQL](../../supabase/tests/README.md).

Para habilitar o fluxo real, ainda será necessário autorizar a aplicação revisada em banco de teste, provisionar login de runtime restrito membro de `sistemanr1_api` com TLS validado e preencher `DATABASE_URL` apenas no backend. O adaptador rejeita superusuário, BYPASSRLS, proprietário das tabelas e conexão sem o papel exigido. Primeiro gestor, empresa e estrutura precisam de provisionamento administrativo controlado. Contas Auth devem ter `nome_completo` nos metadados de criação; identidades anteriores à migração exigem reconciliação de perfil antes de receber vínculo. Novas contas não são confirmadas artificialmente e dependem do procedimento de ativação antes do login.

## Credenciais e conexão

A verificação sanitizada final confirmou chave secreta presente apenas no ambiente do backend, nenhum segredo nos arquivos versionáveis, `.env` da API e `.env.local` do frontend ignorados e não rastreados. `DATABASE_URL` permanece ausente; nenhum valor de ambiente foi impresso. A confirmação anterior de CLI/vínculo/consulta constante, incluindo os limites da Data API pública, está no [relatório da conexão](../validacao/conexao-supabase.md). Essa conexão de gestão não equivale à validação de RLS ou à conexão de runtime restrita.
