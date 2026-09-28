# Relatório de validação — E1 / Camada 0

Data: 2026-09-27. Escopo: identidade, autorização e estrutura organizacional da Camada 0. Todos os dados de teste foram fictícios. Esta evidência não implementa nem conclui M1, M2, M3, M4, M5 ou M6.

## Estado

**Parcialmente implementado.** A E1 está funcional e validada contra o Supabase local isolado. O usuário autorizou a migração remota, que foi aplicada com êxito. O login remoto restrito foi criado e auditado. Em diagnóstico posterior, a conexão do driver `pg` ao pooler foi autenticada com TLS, CA e hostname validados; a consulta `pg_stat_ssl` retornou `false` para a conexão entre o pooler e o backend PostgreSQL. Essa distinção permanece como pendência de segurança antes da validação funcional remota. `DATABASE_URL` não foi configurada no Nest e não foram criados dados de teste remotos. Os 21 RFs originais permanecem pendentes e inalterados.

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
| Testes remotos de Auth, persistência, autorização, RLS e isolamento | **Não executados**, por interrupção após a falha de conexão |

Os 10 cenários de integração real cobriram: cadastro e confirmação de e-mail, rejeição de senha/token inválido e expirado, bootstrap, vínculos em duas empresas, matrícula NULL/duplicada/em empresas distintas, quatro papéis, carteira da consultoria, estrutura e lotação, FKs cruzadas, sobreposição de grupos, snapshots e concorrência, revogação, Data API, perfil parcial/legado, inativação, concorrência de CNPJ/matrícula, fluxo completo do navegador, recuperação de senha e preservação do último gestor.

Todas as verificações locais planejadas para a E1 foram executadas. A aplicação da migração remota ocorreu após aprovação explícita; a validação funcional remota continua pendente da resolução da conexão segura.

## Limites e pendências

- O canal cliente → pooler está autenticado com TLS/CA/hostname validados, mas `pg_stat_ssl.ssl = false` no backend. Avaliar esse limite do pooler frente ao requisito de TLS fim a fim antes de configurar `DATABASE_URL`. Ajustes remotos de redirects/Auth e testes funcionais remotos ainda não foram feitos.
- O limite elevado de e-mails no `supabase/config.toml` serve somente ao Mailpit local e não deve ser promovido ao projeto remoto.
- Sessão web fica somente em memória: recarregar a página ou abrir nova aba exige autenticar novamente. É uma decisão de minimização documentada, não persistência de token no navegador.
- O papel de consultoria isolado não recebe capacidade técnica ou administrativa. `leitor` não é migrado automaticamente.
- A C0 prepara estrutura e snapshots para módulos posteriores sem antecipar campanhas, respostas, matrizes, inventários, documentos ou assinaturas.

## Próxima etapa após tratar a falha

Decidir, com base no requisito de segurança, se TLS verificado até o pooler e conexão interna sem TLS são aceitáveis; caso seja exigido TLS fim a fim, avaliar um endpoint direto acessível que apresente `pg_stat_ssl.ssl = true`, mantendo CA/hostname validados e o login restrito. Somente após resolver essa divergência, configurar `DATABASE_URL` e `DATABASE_CA_CERT_PATH` no backend e planejar testes remotos de Auth, persistência, RLS e isolamento com identidades fictícias. Não usar `db reset` remoto, conexão administrativa no runtime ou `rejectUnauthorized: false`. O login remoto já existe: não repetir `CREATE ROLE` nem girar a senha por tentativa cega.
