# Relatório de validação — E1 / Camada 0

Data inicial: 2026-09-27. Atualização remota: 2026-09-28. Retomada local: 2026-09-29. Escopo: identidade, autorização e estrutura organizacional da Camada 0. Todos os dados de teste foram fictícios. Esta evidência não implementa nem conclui M1, M2, M3, M4, M5 ou M6.

## Estado

**Parcialmente implementado.** A E1 está funcional e validada no Supabase local. A migração base remota foi aplicada e cinco cenários funcionais remotos com fixtures fictícias passaram, incluindo Auth por link de fixture, Nest, PostgreSQL restrito, RLS, isolamento e navegador. O cadastro público remoto e a entrega de e-mail não passaram por validação: duas tentativas retornaram HTTP 400 sem causa sanitizada preservada, e a seguinte retornou `over_email_send_rate_limit` (HTTP 429). A falha histórica de encerramento do Playwright foi superada na integração local de 2026-09-29, conforme a seção de retomada abaixo. A nova migração de auditoria foi aplicada somente no Supabase local. **E1 ainda não atende ao critério de “Concluído e testado”** por falta de prova do fluxo público remoto, aplicação/autorização da nova migração remota e inspeção visual integral. Os 21 RFs originais não foram alterados nesta missão. A decisão acadêmica de usar TLS validado até o pooler não comprova TLS de ponta a ponta nem autoriza dados pessoais reais.

## Entrega implementada

- Supabase Auth para cadastro, confirmação de e-mail, login, logout, recuperação e atualização de senha; credenciais não são persistidas no aplicativo.
- Perfil global com nome e estado; matrícula opcional, papéis e lotação por vínculo empresa/usuário.
- Papéis fechados: trabalhador, gestor SST/RH, responsável técnico e consultoria. Capacidades são verificadas no Nest e novamente no PostgreSQL a cada operação.
- Bootstrap transacional de empresa, vínculo inicial e gestor; associação autorizada de contas existentes; reconciliação segura de perfil pendente ou ausente.
- Empresas, estabelecimentos, setores, funções, turnos, grupos, lotações, dados profissionais e fotografias imutáveis de estrutura.
- RLS, FORCE RLS, grants mínimos, FKs compostas, unicidade de matrícula, prevenção de autoelevação, revogação imediata e proteção do último gestor.
- Interface em PT-BR: autenticação, painel, perfil, empresas, carteira de consultoria, usuários, vínculos, matrícula, papéis, lotações e estrutura. A troca de empresa recria a área de conteúdo e descarta consultas anteriores.

O schema `organizacao` tem 13 tabelas: `perfis`, `empresas`, `vinculos_organizacionais`, `atribuicoes_papel`, `lotacoes_usuario`, `identificacoes_profissionais`, `estabelecimentos`, `setores`, `funcoes`, `turnos`, `grupos`, `estruturas_congeladas` e `eventos_auditoria`. A migração vigente é [20260927000100_camada_zero.sql](../../supabase/migrations/20260927000100_camada_zero.sql); a versão anterior, nunca aplicada remotamente, foi arquivada em [histórico](../arquitetura/historico/20260926000100_c0_usuarios_e_vinculos.sql).

## Segurança, isolamento e anonimato

O navegador usa somente a chave publicável para Auth. A chave secreta continua exclusivamente no ambiente do Nest e não foi impressa. O backend usa `getUser(token)` e ainda confere sujeito, emissor, audiência e expiração. A conexão de negócio usa um login PostgreSQL de teste sem superusuário, BYPASSRLS, criação de papéis ou propriedade das tabelas. Cada transação restaura o contexto do ator e faz rollback em erro.

`anon` não recebe acesso ao schema; `authenticated` não recebe escrita e o schema não integra a Data API. A suíte prova que a Data API rejeita tentativa de autoatribuição e que o fluxo administrativo também bloqueia a mesma ação. Não existem tabelas, endpoints ou vínculos de C0 para respostas, tokens ou questionários M1; a verificação de jornada anônima pertence à E2, como previsto nas SPECs.

## Conexão Supabase

O projeto vinculado é `sfutycdmcjsvmfrvtxam`. Antes da aplicação, a consulta remota confirmou ausência de `organizacao` e do histórico de migrações. A migração revisada tem 348 linhas e SHA-256 `87eb6fd542d23fdd986aeb427539b945524a4ef1bd429487f916b13c1dd25b8b`, idêntico ao aprovado. A chave antiga foi confirmada pelo usuário como revogada antes das operações privilegiadas. Nenhum seed nem conta de teste foi criado remotamente.

O dry-run foi repetido imediatamente antes da aplicação e listou apenas `20260927000100_camada_zero.sql`, sem seeds nem roles. O SQL foi revisado e não contém `DROP`, `TRUNCATE` ou `DELETE` de dados. `db push --linked --skip-vault --yes` terminou com código 0 e registrou somente essa migração. Consulta posterior confirmou **13 tabelas, 34 políticas, 23 gatilhos** e uma entrada de histórico para a versão autorizada.

Foi criado o login `sistemanr1_runtime_e1` com senha aleatória guardada apenas em arquivo local ignorado pelo Git. Consulta de metadados confirmou `LOGIN`, limite de cinco conexões e associação ao grupo `sistemanr1_api`, sem SUPERUSER, BYPASSRLS, CREATEDB, CREATEROLE, REPLICATION ou propriedade das tabelas do schema. Não foi usado como credencial geral `postgres` nem a chave secreta Supabase.

O primeiro teste de conexão do driver `pg` pelo endpoint real de pooler registrado pelo CLI, com `sslmode=verify-full` e `rejectUnauthorized: true`, **falhou**. A saída foi sanitizada e não preservou um código de erro que distinga falha de certificado, rede ou autenticação. Nenhuma opção de TLS foi relaxada. A `DATABASE_URL` não foi adicionada ao ambiente do Nest. A execução remota parou nesse ponto, como solicitado para qualquer erro de segurança; autenticação, persistência, autorização, RLS e isolamento no remoto permanecem **sem teste**.

### Diagnóstico autorizado da conexão (2026-09-27)

O endpoint de *Session pooler* guardado pelo Supabase CLI vinculado corresponde ao formato oficial do projeto: `aws-0-us-west-2.pooler.supabase.com`, porta `5432`, usuário personalizado `sistemanr1_runtime_e1.sfutycdmcjsvmfrvtxam`. A [documentação oficial de conexão](https://supabase.com/docs/guides/database/connecting-to-postgres) confirma porta, modo e sufixo de usuário. A verificação não imprimiu senha nem URL completa.

O diagnóstico segregado retornou: DNS **resolvido**; TCP **conectado**; negociação PostgreSQL para TLS **aceita**; validação TLS de CA/hostname **falhou**, código sanitizado `SELF_SIGNED_CERT_IN_CHAIN`. A autenticação PostgreSQL não foi iniciada porque o canal TLS não foi validado. Um primeiro `EACCES` de TCP ocorreu somente dentro do sandbox local; a repetição autorizada com acesso à rede confirmou TCP. A causa imediata é que a cadeia apresentada pelo endpoint não é confiável ao cliente sem a CA oficial; a correspondência do hostname permanece sem comprovação até instalar a CA.

Inspeção da versão instalada de `pg`/`pg-connection-string` confirmou outra falha na configuração anterior: o parâmetro `sslmode=verify-full` na connection string **substitui** o objeto `ssl` fornecido ao construtor. O Nest foi corrigido para separar host, porta, banco, usuário e senha da URL e passar explicitamente `ssl: { ca, rejectUnauthorized: true, servername: host }`, carregando a CA de `DATABASE_CA_CERT_PATH` apenas no backend. Para endpoint remoto, a aplicação agora recusa iniciar a conexão sem o arquivo CA. Essa correção passou em `pnpm.cmd typecheck`, `pnpm.cmd lint` e `pnpm.cmd format:check`; **naquele momento a conexão remota corrigida ainda não havia sido validada**, pois nenhum certificado CA oficial fora encontrado nos caminhos inspecionados (workspace e Downloads).
Uma checagem local de `ConnectionParameters` confirmou `objeto_sobrescrito` no formato antigo e `ssl_explicito_preservado` no formato corrigido. Isso comprova a precedência da configuração, mas não substitui o teste de autenticação/TLS remoto com a CA oficial.

Obter o certificado no [Dashboard do projeto → Database Settings → SSL Configuration → Download Certificate](https://supabase.com/dashboard/project/sfutycdmcjsvmfrvtxam/settings/database), sem alterar o controle de *SSL enforcement*. Guardar o arquivo em um caminho local acessível apenas ao backend e configurar `DATABASE_CA_CERT_PATH` com esse caminho; o conteúdo do certificado não deve ser colado em logs ou relatório. A [documentação de SSL do Supabase](https://supabase.com/docs/guides/platform/ssl-enforcement) identifica essa CA como necessária para `verify-full`. Depois disso, repetir somente DNS/TCP/TLS, autenticação restrita e `SELECT current_user` mais `pg_stat_ssl.ssl`, sem gravar dados.

### Validação final autorizada de TLS (2026-09-27)

O caminho literal recebido, `C:\Users\italo.config\sistemaNR1\supabase-ca.crt`, não existe. O certificado com o mesmo nome foi localizado em `C:\Users\italo\.config\sistemaNR1\supabase-ca.crt` e usado somente como `DATABASE_CA_CERT_PATH` do processo de diagnóstico. O arquivo contém certificado X.509 de CA válido no período verificado. Nenhum conteúdo do certificado ou credencial foi impresso.

Com a CA indicada, DNS e TCP passaram, o endpoint do pooler aceitou TLS e a cadeia/hostname foram validados (`rejectUnauthorized: true`). O driver `pg` confirmou `encrypted === true` e `authorized === true`. A autenticação foi aprovada e uma consulta **somente de leitura** confirmou `current_user = sistemanr1_runtime_e1`. A mesma consulta encontrou `pg_stat_ssl.ssl = false` para `pg_backend_pid()`.

O resultado de `pg_stat_ssl` **não mede o canal cliente → pooler**: a [documentação do PostgreSQL](https://www.postgresql.org/docs/current/monitoring-stats.html) define essa visão por processo backend; a [documentação do Supabase sobre o pooler](https://supabase.com/docs/guides/troubleshooting/supavisor-and-connection-terminology-explained-9pr_ZO) distingue a conexão do cliente da conexão que o pooler abre com o banco. O [Supavisor documenta `upstream_ssl` separadamente de `enforce_ssl`](https://github.com/supabase/supavisor/blob/main/docs/configuration/tenants.md). Assim, os testes comprovam TLS verificado até o pooler e mostram que a conexão backend observada não usa TLS. A interpretação de que o pooler encerra TLS e abre outra conexão sem TLS é **inferência** compatível com esses resultados, não confirmação da configuração interna do serviço. Nenhuma configuração de segurança foi alterada para investigar. Como o requisito pedido incluía confirmar TLS ativo em `pg_stat_ssl`, esta verificação **não foi aprovada integralmente**. Permanecem pendentes a decisão sobre aceitar a terminação TLS no pooler ou exigir outro endpoint/caminho de conexão com TLS também visível no backend, e os testes funcionais remotos.

### Decisão acadêmica e execução funcional remota (2026-09-28)

O usuário autorizou explicitamente, **somente para este MVP com dados fictícios**, a conexão NestJS → pooler oficial com TLS, CA e hostname validados. A decisão aceita a evidência `pg_stat_ssl.ssl = false` para a conexão observada entre pooler e PostgreSQL; **não afirma TLS de ponta a ponta nem prontidão para produção**. Não houve alteração na configuração TLS do Supabase, migração adicional, recriação de login ou mudança de permissões.

`DATABASE_URL` do login `sistemanr1_runtime_e1` e `DATABASE_CA_CERT_PATH` foram adicionados exclusivamente ao `.env` privado do NestJS, com cópia anterior em `.e1/`, ambos ignorados pelo Git. O Next.js permaneceu apenas com chave publicável e URL pública; a verificação confirmou ausência de chave secreta e URL PostgreSQL no seu ambiente. O driver manteve `rejectUnauthorized: true` e `servername` do endpoint oficial. Valores de credenciais, strings completas e conteúdo da CA não foram registrados.

Consulta à configuração Auth pela API oficial mostrou `Site URL` já em `http://localhost:3000`, cadastro habilitado e confirmação de e-mail exigida. Foram adicionadas e reconfirmadas as quatro URLs **exatas** de confirmação e atualização de senha para `localhost:3000` e `localhost:3200`, preservando as demais configurações. Não foram alterados SMTP, limites de envio ou templates. Ver [orientação oficial de Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls).

`pnpm.cmd test:remoto:e1` passou nos **cinco cenários** com cinco contas e duas empresas sintéticas identificadas por prefixo `E1REMOTO-` e manifesto local ignorado pelo Git. A suíte validou criação Auth por `admin/generate_link` de fixture, confirmação por token real, login/senha incorreta, perfil, bootstrap, quatro papéis, vínculos e matrículas distintos por empresa, estrutura, lotação, referências cruzadas bloqueadas, acesso negado, revogação imediata com o mesmo JWT, RLS de leitura e jornada Next.js → NestJS → Supabase em navegador real. A chave secreta foi usada somente para criar links Auth das fixtures, nunca como credencial geral de banco ou execução da aplicação. `node scripts/testar-rls-remoto.mjs` comprovou, com login restrito e transação revertida, que gestor de A lê A e não lê nem altera B.

O cadastro público com endereços de exemplo fictícios retornou HTTP 400 em duas tentativas sem código de causa preservado; novas tentativas alcançaram HTTP 429, `over_email_send_rate_limit`. Nenhuma resposta dessas tentativas confirmou criação de conta ou entrega de e-mail. A [documentação oficial do SMTP padrão](https://supabase.com/docs/guides/auth/auth-smtp) informa restrição a membros da organização e limite baixo de mensagens; não se usou endereço real para contornar a restrição. Portanto o link administrativo prova criação/confirmação Auth para fixtures, **mas não prova o fluxo público de cadastro nem envio/recebimento de e-mail remoto**. A conclusão acadêmica da E1 depende dessa validação ou de um critério de aceitação revisto explicitamente.

Duas contas de fixture podem ter sido criadas nas primeiras tentativas de `generate_link` antes de o teste aceitar o formato plano da resposta remota; elas mantêm prefixo fictício `E1REMOTO-`, mas seus IDs não foram incluídos no manifesto. Não foram alteradas ou consultadas contas de terceiros. O inventário geral de usuários Auth não foi executado porque a revisão automática rejeitou uma consulta que poderia ler contas fora do escopo das fixtures.

## Testes executados

| Comando / verificação | Resultado |
| --- | --- |
| `pnpm.cmd typecheck` | Aprovado |
| `pnpm.cmd lint` | Aprovado |
| `pnpm.cmd format:check` | Aprovado |
| `pnpm.cmd test` | Aprovado: 52 testes Jest e 13 testes Playwright de regressão |
| `pnpm.cmd build` | Aprovado: contratos, Nest e 27 rotas estáticas Next |
| `pnpm.cmd test:integracao` | Aprovado: 10 cenários reais, com Auth, Mailpit, Nest, PostgreSQL local e navegador |
| `node scripts/testar-rls.mjs` | Aprovado: quatro papéis, RLS, grants, referências cruzadas, revogação, matrícula e snapshots, em transação revertida |
| Consulta remota de metadados via CLI | Aprovada: projeto correto, schema/histórico ausentes |
| `supabase db push --linked --dry-run --skip-vault` | Aprovado sem escrita: listou somente `20260927000100_camada_zero.sql`; sem seeds nem roles |
| `supabase db push --linked --skip-vault --yes` | Aprovado: somente a migração autorizada; 13 tabelas, 34 políticas e 23 gatilhos verificados |
| Auditoria SQL do login runtime remoto | Aprovada: mínimo privilégio e ausência de propriedade das tabelas |
| Driver `pg`, pooler real, `sslmode=verify-full` e validação de certificado | **Falhou**; diagnóstico sanitizado, sem credenciais ou código de causa |
| Diagnóstico segregado autorizado de DNS, TCP e TLS | DNS/TCP aprovados; TLS falhou com `SELF_SIGNED_CERT_IN_CHAIN`; autenticação não tentada |
| Correção da configuração `pg` e verificações locais | CA obrigatória e `ssl` explícito preservados; typecheck, lint e format:check aprovados |
| Diagnóstico com CA oficial e login restrito, somente leitura | CA válida, DNS/TCP, TLS/hostname e autenticação aprovados; `current_user` restrito confirmado; `pg_stat_ssl.ssl = false` no backend, logo o critério de TLS ativo nessa visão não foi atendido |
| Testes remotos até 2026-09-27 | **Não executados** naquela data, por interrupção após a falha inicial de conexão |
| `pnpm.cmd test:remoto:e1` — 2026-09-28 | Aprovado: 5/5 cenários de fixtures Auth, API, persistência, autorização, RLS, isolamento e navegador |
| `node scripts/testar-rls-remoto.mjs` — 2026-09-28 | Aprovado: leitura A, bloqueio de leitura/escrita B; transação revertida |
| Cadastro público remoto — 2026-09-28 | **Não aprovado**: HTTP 400 em duas tentativas; depois HTTP 429 `over_email_send_rate_limit`; entrega de e-mail não verificada |
| `pnpm.cmd typecheck`, `pnpm.cmd lint`, `pnpm.cmd format:check`, `pnpm.cmd build` — 2026-09-28 | Aprovados; build Nest/contratos e 27 rotas estáticas Next |
| `pnpm.cmd test:api` — 2026-09-28 | Aprovado com código 0: 52 testes Jest em cinco suítes |
| `pnpm.cmd test` — 2026-09-28 | 52 Jest e 13 Playwright passaram, porém o processo não encerrou após os cenários; interrompido manualmente, sem código final 0 |

Os 10 cenários de integração real cobriram: cadastro e confirmação de e-mail, rejeição de senha/token inválido e expirado, bootstrap, vínculos em duas empresas, matrícula NULL/duplicada/em empresas distintas, quatro papéis, carteira da consultoria, estrutura e lotação, FKs cruzadas, sobreposição de grupos, snapshots e concorrência, revogação, Data API, perfil parcial/legado, inativação, concorrência de CNPJ/matrícula, fluxo completo do navegador, recuperação de senha e preservação do último gestor.

As verificações locais e os cenários remotos de negócio acima foram executados. A aplicação da migração remota ocorreu após aprovação explícita. O cadastro público/entrega de e-mail e o encerramento limpo da regressão Playwright ainda carecem de evidência para declarar a E1 concluída.

## Limites e pendências

- O canal NestJS → pooler usa TLS/CA/hostname validados; `pg_stat_ssl.ssl = false` no backend. Esta limitação foi aceita apenas para o MVP fictício, sem comprovar TLS de ponta a ponta ou permitir dados pessoais reais.
- O SMTP padrão não permitiu validar cadastro público e entrega de e-mail com endereços fictícios. Não há evidência remota suficiente para concluir esse critério sem caixa de teste/SMTP apropriado ou decisão explícita sobre escopo de aceitação.
- A regressão Jest passou e os 13 cenários Playwright passaram. Uma repetição após liberar explicitamente a requisição interceptada no teste de timeout também executou os 13 cenários, mas o comando Playwright continuou travando no encerramento no Windows; o código final não foi 0.
- O limite elevado de e-mails no `supabase/config.toml` serve somente ao Mailpit local e não deve ser promovido ao projeto remoto.
- A sessão web atual usa a persistência do Supabase Auth no navegador (`persistSession: true`), necessária ao fluxo de demonstração entre recargas. O teste E1 verifica que a senha não é gravada no armazenamento; o token de sessão permanece sob responsabilidade do cliente Supabase. A descrição antiga de sessão somente em memória não corresponde mais ao código atual.
- O papel de consultoria isolado não recebe capacidade técnica ou administrativa. `leitor` não é migrado automaticamente.
- A C0 prepara estrutura e snapshots para módulos posteriores sem antecipar campanhas, respostas, matrizes, inventários, documentos ou assinaturas.

## Próxima etapa após tratar a falha

Encerramento provisório autorizado em 2026-09-28: **Parcialmente implementada**, com cinco cenários funcionais remotos aprovados. Permanecem pendentes o cadastro público e a entrega de e-mail remoto, o encerramento limpo do Playwright, a verificação de TLS no trecho pooler → PostgreSQL e a identificação segura de duas possíveis contas de fixture órfãs. Não repetir envios de e-mail, não fazer inventário geral Auth e não consultar, alterar ou excluir contas de terceiros. Os manifestos das fixtures devem ser preservados. A missão conjunta Design System + E2 + E3 + E4 foi autorizada em seguida, com novas migrações somente locais até aprovação remota específica. Para qualquer uso futuro com dados reais, reavaliar a conexão pooler → PostgreSQL e demais pendências de segurança; esta validação acadêmica não autoriza produção.

## Retomada E1 em `italo_dev` — 2026-09-29

HEAD inicial `32496e348d725542a7585dcc63c827af5b20364b`, árvore inicialmente limpa; Node `24.19.0`, pnpm `12.6.0`. A revisão usou as duas SPECs C0 e a [matriz de permissões](../arquitetura/matriz-permissoes.md). O fluxo local exercitou Auth/Mailpit, Nest, login PostgreSQL restrito, browser e RLS com dados exclusivamente sintéticos. Os dois perfis remotos de origem não comprovada não foram consultados nem alterados. Não houve consulta ou escrita remota, deploy ou merge nesta retomada.

O link visual de perfil agora tem nome acessível estável; os seletores Playwright foram atualizados para os rótulos reais de navegação e para a porta isolada de teste. O teste de armazenamento verifica ausência de **senha**, preservando a sessão Supabase atual. A atualização de senha consulta a sessão Auth no envio para não falhar quando a recuperação do link termina após a renderização inicial. Nenhuma credencial é gravada pelo aplicativo.

A migração incremental [20260929000100_e1_auditoria_perfil_profissional_snapshot.sql](../../supabase/migrations/20260929000100_e1_auditoria_perfil_profissional_snapshot.sql) acrescenta eventos de INSERT/UPDATE para `perfis` e `identificacoes_profissionais` e de INSERT para `estruturas_congeladas`. SHA-256: `6f867d62dd3104efb18074787a4e9aee6a45dd9b6a0382e46bc07e805ee1f1c5`. A migração E1 original não foi editada. `supabase migration up --local` aplicou apenas a nova versão ao banco local; `pnpm.cmd test:rls` passou, com transação revertida e asserções de entidade, operação, ator e empresa do snapshot. Perfis e identificação profissional são registros globais no modelo e seus eventos não possuem `empresa_id`; essa ausência não deve ser apresentada como auditoria empresarial. A nova versão **não foi aplicada remotamente** e requer verificações finais e autorização específica antes de qualquer aplicação.

| Verificação E1 desta retomada | Resultado |
| --- | --- |
| Jest `usuarios`, `usuarios-http`, `identidades-supabase`, `regras-camada-zero` | 4 suítes, 38 testes, código 0 |
| RLS SQL local após migração incremental | Aprovado, incluindo perfil, identificação profissional e snapshot; rollback |
| Playwright `tests/usuarios.spec.ts` | 7/7, código 0, encerramento limpo; viewport mobile e telas públicas incluídos |
| Integração local `pnpm.cmd test:integracao` | 11/11 após a migração incremental e as correções de Auth/UI, código 0 e encerramento limpo |
| `pnpm.cmd typecheck`, `pnpm.cmd lint`, `pnpm.cmd format:check`, `pnpm.cmd build` | Todos código 0 sobre o código final; build de contratos, Nest e 29 rotas Next |
| `git diff --check` e revisão sanitizada do diff | Código 0; nenhuma chave privada, URL PostgreSQL com credencial, token longo ou chave Supabase secreta adicionada |

O navegador local confirmou cadastro e confirmação pelo Mailpit, login inválido/válido, logout, recuperação/atualização de senha, associação de conta anterior, empresa e gestor atômicos, quatro papéis, duas empresas com matrículas próprias, estrutura e lotação, snapshots, RLS/isolamento e revogação com o mesmo JWT. A matriz E1 nega gestão ao trabalhador, nega estrutura à consultoria sem papel adicional e limita o responsável técnico à leitura estrutural; gestor opera apenas sua empresa e não se autopromove. As dez rotas autenticadas C0 existentes foram percorridas em desktop, e dashboard, perfil, usuários e estabelecimentos também em viewport de 390 px; os formulários dessas páginas foram aguardados antes de capturar imagens privadas em `.e1/`. Login, recuperação, atualização e confirmação sem link foram inspecionados no celular. As capturas finais foram revisadas e não mostraram overflow da página nem erros técnicos crus nas páginas amostradas; o menu horizontal mobile permite rolagem própria. A confirmação sem link agora orienta a abrir o e-mail, em vez de ficar indefinidamente em “Verificando”. Cadastro público e entrega de e-mail **remotos** continuam sem prova, portanto E1 permanece **Parcialmente implementada**. Registro profissional cadastrado não equivale a habilitação oficial ou assinatura. TLS Nest→pooler com CA e hostname validados é a evidência existente; `pg_stat_ssl.ssl=false` no backend observado não comprova TLS ponta a ponta.

Ao final, não havia listeners nas portas locais de teste 3200/3201/3210/3211. A revisão visual cobre estados principais, não cada combinação possível de erro, permissão e dado. Para validar cadastro/entrega de e-mail remotos falta uma caixa fictícia capaz de receber as mensagens e condições SMTP apropriadas; nenhuma nova tentativa de envio foi feita. A nova migração deve passar por histórico remoto, checksum e dry-run imediatamente antes de qualquer aplicação, seguida de autorização específica.
