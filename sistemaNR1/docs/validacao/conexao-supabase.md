# Verificação da conexão Supabase

Data: 2026-09-26. Escopo autorizado: conferir variáveis locais sem mostrar valores, proteger credenciais, autenticar/verificar o CLI, vincular ao projeto informado pelo usuário e testar conexão sem aplicar migrações. A instrução mais recente exige nova permissão antes de implementar E1.

## Resultado

**Conexão confirmada.** Supabase CLI 2.118.0 com autenticação disponível e validada; workspace vinculado ao projeto indicado. Consulta SQL constante `SELECT 1 AS conexao_ok` executada com sucesso via CLI/Management API. Nenhum dado de negócio foi consultado e nenhuma migração foi aplicada.

## Variáveis locais e Git

A conferência inicial identificou valores reais nos dois arquivos `.env.example`, que são rastreados pelo Git. Os arquivos locais de execução ainda não existiam. Os valores foram transferidos integralmente, sem exibição, para os destinos próprios de cada aplicação; os modelos foram restaurados a partir da versão sem credenciais do Git.

| Arquivo | Situação final |
| --- | --- |
| `apps/web/.env.local` | URL e chave publicável presentes; sem chave secreta; ignorado e não rastreado |
| `apps/api/.env` | URL, chave publicável e nova chave secreta presentes; ignorado e não rastreado |
| `apps/web/.env.example` | Modelo sem credenciais, versionável |
| `apps/api/.env.example` | Modelo sem credenciais, versionável |
| `supabase/.temp/` | Metadados locais do vínculo; ignorados pelo Git |

As URLs de ambas as aplicações correspondem ao projeto autorizado. As chaves publicáveis coincidem e usam o formato novo. A chave secreta está somente no ambiente do backend, sem variável `NEXT_PUBLIC_*` correspondente. Nenhum valor de chave, token, senha ou conteúdo de ambiente foi exibido nos comandos ou registrado neste documento.

A chave secreta atual não foi encontrada nos arquivos rastreados do projeto nem nas duas revisões locais que alteraram os arquivos de exemplo. Essa verificação cobre o checkout e o histórico Git local disponíveis; não é uma auditoria de cópias externas, histórico de editores ou sincronização OneDrive.

## CLI e testes remotos

| Verificação | Resultado |
| --- | --- |
| `supabase --version` | 2.118.0 |
| `supabase link --project-ref <projeto autorizado> --yes` | Código de saída 0; referência local corresponde exatamente ao alvo |
| `supabase projects list --output json` | Código 0; autenticação existente confirmada; projeto autorizado encontrado e ativo |
| GET `/auth/v1/settings`, chave publicável | HTTP 200; corpo não exibido |
| GET `/rest/v1/`, chave secreta do backend | HTTP 200; metadados não exibidos |
| GET `/rest/v1/`, chave publicável | HTTP 401; não foi tratado como consulta pública bem-sucedida nem como prova de RLS |
| `supabase db query --linked "SELECT 1 AS conexao_ok" --output json` | Código 0; retorno constante confirmado |

Foi usado o CLI já instalado pelo pnpm, executando seu entrypoint local por Node para capturar stdout/stderr e emitir somente indicadores sanitizados. A autenticação já disponível foi reutilizada e validada pela operação de vínculo e pela consulta de projetos; não foi necessário solicitar token, executar novo login interativo ou imprimir dados da conta. Não se confundiu a chave secreta da aplicação com um token pessoal de acesso do CLI.

A resposta 401 da raiz de metadados da Data API com chave publicável fica registrada como limite dessa consulta, sem atribuir causa não comprovada. Auth com chave publicável, Data API com chave de backend e SQL via CLI foram confirmados separadamente. Nenhuma permissão foi ampliada para fazer essa consulta pública passar. O desenho existente usa Supabase Auth no navegador e mantém acesso a dados de negócio na API NestJS.

O teste SQL usou a Management API do projeto vinculado. Ele não valida ainda uma conexão PostgreSQL direta por pool com papel restrito da aplicação, autorização de usuários, RLS, isolamento entre empresas, Storage ou login funcional do produto. Esses itens pertencem à implementação/testes de E1 e etapas seguintes.

## Preservação do escopo

Não foram executados `db push`, `db pull`, `migration up`, `migration repair`, `db reset`, aplicação de SQL de schema, criação de usuários, seeds ou deploy. A pasta de migrações continua sem arquivos SQL. A configuração remota não foi alterada pelo aplicativo. Nenhum código de E1 foi iniciado e nenhum requisito foi marcado como implementado.

## Próximo passo sujeito à permissão do usuário

Implementar E1 conforme [backlog](../backlog-mvp.md), [Camada 0](../../specs/camada-0/estrutura-organizacional.spec.md), [AGENTS](../../AGENTS.md) e [segurança](../arquitetura/seguranca-privacidade.md): preparar schema e políticas de isolamento, autenticação dos gestores, autorização por vínculo ativo, estrutura organizacional e grupos/população, preservação de revisões e testes positivos/negativos com empresas fictícias. Registrar evidências na SPEC e matriz.

A restrição de **não aplicar migrações** permanece vigente até autorização explícita para isso. A implementação local pode preparar SQL, código e testes revisáveis; não deve declarar testes de persistência/RLS concluídos sem execução real no ambiente autorizado.

Referências oficiais: [autenticação do CLI](https://supabase.com/docs/reference/cli/supabase-login), [vínculo do projeto](https://supabase.com/docs/reference/cli/supabase-link) e [chaves publicáveis e secretas](https://supabase.com/docs/guides/getting-started/api-keys).

## Atualização posterior — autorização delimitada de C0

Após esta verificação, o usuário solicitou explicitamente atualizar SPECs, migrações locais, DTOs, formulários e testes de usuários com nome completo/e-mail/senha/matrícula e lotação por empresa. Esse pedido autoriza o recorte descrito em [C0 usuários](../evidencias/c0-usuarios.md), mantendo a proibição de aplicar migrações. As afirmações acima sobre pasta vazia e código não iniciado registram o estado no momento da conexão; posteriormente uma migração foi preparada localmente, sem execução remota.
