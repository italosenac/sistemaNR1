# Pré-publicação acadêmica — histórico e aplicação remota condicionada

Data: 2026-09-28. Projeto vinculado: `sfutycdmcjsvmfrvtxam`. Escopo exclusivo: preparação da jornada fictícia M1→M2→M3→PDF.

**Estado atual:** após alteração expressa do gate pelo usuário, as dez migrações `20260928000100`–`20260928001000` foram aplicadas. Histórico, nove tabelas com RLS/FORCE RLS e atributos do runtime foram confirmados. A auditoria encontrou **EXECUTE excedente para PUBLIC em uma função de gatilho**, detalhado na última seção. Nenhum teste funcional remoto, seed, alteração de Auth, commit, push ou deploy foi executado nesta retomada. As seções anteriores à alteração do gate registram as etapas históricas sem escrita remota; seus bloqueios de 7/7 não constituem a decisão vigente.

## Histórico e integridade

`supabase migration list --linked`, com telemetria desativada e saída sanitizada, confirmou `20260927000100` nas colunas local e remota. As dez versões `20260928000100` a `20260928001000` aparecem somente no lado local. O SHA-256 local da E1 é `87eb6fd542d23fdd986aeb427539b945524a4ef1bd429487f916b13c1dd25b8b`, igual ao registrado na aplicação autorizada de E1. A listagem do CLI informa versões, não um checksum remoto independente do SQL aplicado.

| Migração local pendente | SHA-256 do arquivo nesta revisão |
| --- | --- |
| `20260928000100_m1_base_coleta.sql` | `a0ee4963b07e6a6a05919fccb51db03c69514f34d706669ca63319521b4b8b21` |
| `20260928000200_m1_fluxo_transacional.sql` | `2a27a4ea29aafdc5869f74e0fad297581d7e6a6491a618f108402ebf2e7c1f39` |
| `20260928000300_m1_fotografia_agregada.sql` | `e23f23621cdfb7d82a8e04434c87d5fd72f5207da9a7b2dee36d2143ea1b29a4` |
| `20260928000400_m2_criterios_resultados.sql` | `aa3e5aa2326f959405c62e47a38ccea1d6049bf7522ff46cb63ccb43d5a69401` |
| `20260928000500_m2_validacoes.sql` | `c70bde87a568aaf57037534f3823d292f0f75217cd0cdc169bdeb4fad6bca92a` |
| `20260928000600_m2_validacao_publica_runtime.sql` | `ba250f38c332742dc696abaee89e6bc705553e33d68790a8af1a658e6c214f89` |
| `20260928000700_m2_matriz_operadores.sql` | `0ea586fc6e86fbe78a6e65b6df603a7176055f9167db0b3b5bc5d9d4b4984510` |
| `20260928000800_m2_hash_matriz.sql` | `e8b392bcc90f26a4e33a8b2d16bac0b3560e0a92b4daa4ecd39dad80a1a20ff7` |
| `20260928000900_m3_inventario_integrado.sql` | `5ed63ae35deac439aa5340b96515e064af9a16f9fc327eb70571d959549ea6a4` |
| `20260928001000_documentos_download_restrito.sql` | `1f93a7c2a346cfff1ad55fecc6081b118f79bb9969dc4f57c00f45b692177562` |

## Dependências, operações e segurança

As versões são sequenciais: M1 base→funções→fotografia; M2 critérios→validações→grant específico→correção da matriz→hash; M3 inventário→downloads privados. A E1 remota fornece `organizacao`, funções de contexto, entidades organizacionais, grupo `sistemanr1_api` e login runtime restrito. A migração `00100` adiciona duas chaves únicas compostas a `organizacao.grupos` e `organizacao.estruturas_congeladas`; essas operações exigem trava/varredura nas tabelas existentes, mas não removem dados. A migração `00400` adiciona chave única à fotografia M1; `00500` renomeia duas funções M2 para versões internas e revoga sua execução direta do runtime; `00700` substitui somente o corpo do validador M2. Não há `DROP`, `TRUNCATE`, `DELETE` de dados, criação/alteração de login ou role nas dez migrações. Cada arquivo contém um par `BEGIN`/`COMMIT`.

As nove novas tabelas empresariais usam RLS e `FORCE ROW LEVEL SECURITY`. Os schemas `coleta`, `avaliacao` e `inventario` retiram acesso de `public`, `anon` e `authenticated`; o runtime recebe `USAGE` e grants delimitados. Códigos, respostas individuais, taxas internas, fotografias agregadas e bytes de PDF não têm leitura direta pelo runtime. Funções `SECURITY DEFINER` usam `search_path=''`; operações administrativas validam empresa e papel, e o envio anônimo valida o código de uso único. A inspeção inicial registrou execução apenas pelo grupo API nas funções necessárias; a auditoria remota posterior identificou uma exceção de ACL na função de gatilho `coleta.impedir_alteracao_fotografia()`, descrita ao final. As funções internas M2 não permanecem executáveis diretamente pelo login runtime. Os downloads revalidam o vínculo ativo. A implementação local testou isolamento multiempresa e reuso/concorrência de código. A política de agregação não resolve comparação temporal entre campanhas; o uso demonstrativo permanece restrito a fixtures fictícias comprovadas.

## Checagens locais e implantação proposta

`pnpm.cmd test:coleta:local` passou com Auth/Nest/PostgreSQL locais: coleta anônima, rollback, reuso, concorrência, agregação, M2, M3, PDF e isolamento. `node scripts/testar-m2-validacoes-local.mjs` passou para seis matrizes e grants mínimos. Build local dos contratos e da API passou; o comando de build da web passou executado a partir de `apps/web` e gerou as rotas M1–M3. `apps/api/dist/main.js` existe e passou em `node --check`. O lint da API e `git diff --check` passaram. A instalação limpa e o start dentro de Render/Vercel ainda não foram verificados.

O [plano de publicação](../arquitetura/plano-publicacao-academico.md) fixa Node 24, pnpm 12.6.0, raiz do workspace para Render, `apps/web` com pacotes compartilhados acessíveis para Vercel, CA exclusiva no backend e URLs exatas de Auth. A versão do pnpm disponível em cada provedor, os segredos/variáveis privados, a instalação limpa e o domínio final precisam ser validados antes de deploy. O backend deve manter o login PostgreSQL restrito e `rejectUnauthorized: true`; `pg_stat_ssl.ssl=false` no trecho observado pooler→PostgreSQL segue como limitação acadêmica, sem uso de dados reais.

O workspace ainda contém alterações não registradas no Git, inclusive **nove migrações novas não rastreadas** (`00200`–`01000`), código e documentação. O dry-run usa esses arquivos locais, mas os provedores não poderão recebê-los pelo repositório até que sejam revisados e registrados em commit; nenhum commit ou push foi feito nesta etapa.

## Dry-run e decisão

O dry-run remoto `supabase db push --linked --dry-run --skip-vault` terminou com código 0 e listou **exatamente `20260928000100` a `20260928001000`**, com os dez nomes de arquivo desta revisão, sem seed nem arquivo de roles. O dry-run enumera as migrações pendentes; não executa nem valida semanticamente cada instrução SQL no banco remoto. Nenhuma migração foi aplicada. A aplicação remota exige aprovação específica. Após aplicação futura, testar metadados/RLS/grants, Auth com caixa fictícia apropriada sem repetir envios agora, fluxo Next→Nest→Supabase, isolamento, revogação, agregação 6/7 e complementos, PDF/hash e rollback/concorrência. E1 permanece parcialmente implementada com suas quatro pendências próprias; E2–E4 não são prontas para dados pessoais reais ou produção.

## Retomada da autorização condicionada

O usuário autorizou a aplicação **somente se** todos os pré-requisitos fossem confirmados. Nesta retomada, o vínculo continuou apontando para `sfutycdmcjsvmfrvtxam`; o histórico remoto continha apenas a E1; os dez arquivos mantiveram nomes e SHA-256 idênticos à tabela acima; o novo dry-run terminou com código 0 e listou exatamente as dez versões, sem seed nem roles.

Consulta remota somente de leitura confirmou `organizacao.grupos = 0` e `organizacao.estruturas_congeladas = 0`, com zero duplicatas em ambas. Assim, os dados atuais não impedem as duas novas restrições de unicidade. A mesma consulta contou duas empresas e sete perfis, mas a checagem inicial de nomes procurava o prefixo `E1REMOTO-` no início da razão social. A fixture conhecida usa `Empresa Fictícia E1REMOTO-...`; portanto esse resultado **não prova** presença de empresas alheias, tampouco prova que todas as empresas são fictícias. O manifesto local ignorado pelo Git registra duas empresas e cinco contas de fixture; a comparação remota exata por ID e marcador ainda não foi concluída. A consulta de `row_security_active` executada sob o usuário de leitura administrativa retornou `false` e não avalia o RLS do login runtime.

A tentativa de executar essa comparação restrita foi **rejeitada pela revisão automática antes da execução** por limite de uso. A revisão informou que não conseguiu concluir a aprovação; não classificou a consulta como insegura. Como a condição de confirmar exclusivamente dados fictícios permanece sem evidência suficiente, a aplicação das migrações foi **interrompida antes de qualquer escrita remota**. Nenhuma versão E2–E4 foi aplicada, e a etapa de verificação posterior à aplicação não foi iniciada. Para retomar, é necessário liberar a revisão automática, executar somente a comparação de contagens/IDs das duas empresas com o manifesto, confirmar ausência de dados não fictícios e então repetir as verificações temporais de histórico/checksum/dry-run antes da aplicação autorizada. Não contornar a revisão com outra via de acesso.

## Retomada controlada — comparação restrita

Após nova instrução do usuário, a mesma rota oficial de **consulta somente de leitura** pôde ser executada. Foram comparados IDs exatos das duas empresas e das cinco contas registradas no manifesto, além dos e-mails exatos das quatro tentativas de cadastro já registradas localmente; a saída apresentou **somente contagens**, sem nomes, e-mails ou IDs. Resultado: `empresas_remotas=2`, `empresas_fixture_reconhecidas=2`, `empresas_desconhecidas=0`; `perfis_remotos=7`, `perfis_fixture_reconhecidos=5`, `perfis_nao_reconhecidos=2`. Grupos e estruturas congeladas continuaram vazios, sem duplicatas.

Os dois perfis não reconhecidos podem ter origem em operações de fixture anteriores, mas **isso não foi comprovado** pela comparação autorizada. Conforme a condição expressa, a execução parou imediatamente; esses perfis não foram consultados individualmente, alterados nem excluídos. Não houve nova consulta de histórico/checksum/dry-run após o resultado divergente, aplicação de migração, seed, teste com escrita ou deploy. A autorização condicionada **não habilita a aplicação enquanto os dois perfis permanecerem sem comprovação segura de origem fictícia**. O bloqueio atual é a divergência de identidade das fixtures, e não o limite anterior da revisão automática.

## Investigação local dos dois perfis — 2026-09-28

**Resultado B: origem ainda não comprovada; nenhuma migração aplicada nesta retomada.** A investigação começou pelos artefatos existentes e encerrou sem consulta remota. As contagens abaixo preservam a última comparação remota documentada; não representam nova medição do banco:

| Evidência acumulada | Resultado |
| --- | --- |
| Empresas fictícias comprovadas | 2/2 |
| Empresas desconhecidas | 0 |
| Perfis fictícios comprovados | 5/7 |
| Perfis de origem desconhecida | 2 |
| Condição de ambiente exclusivamente fictício | **Não satisfeita** |

### Artefatos e evidências encontrados

- O manifesto privado `.e1/fixtures-remotas.local.json`, ignorado pelo Git, contém duas empresas, cinco contas com IDs e quatro tentativas de cadastro público **sem ID retornado**. Não contém os identificadores dos dois perfis restantes. A inspeção retornou somente contagens e estrutura dos registros, sem valores de identificação ou credenciais.
- Foram examinados os scripts de fixture remota, cadastro público e preflight, o relatório E1, os registros `.last-run.json`, os demais artefatos pertinentes de `.e1/` e o histórico Git dos testes remotos nas revisões `2afa354` e `94895e9`. Os registros de resultado preservam o estado da suíte, sem identificar contas adicionais. Nenhum teste ou script de criação foi executado novamente.
- O histórico local das execuções anteriores de E1 e pré-publicação foi pesquisado com saída sanitizada. Ele preserva uma falha em `apoio.ts:98`, na verificação `expect(dados.user?.id).toBeTruthy()`, anterior à gravação do manifesto. Preserva também a correção para aceitar o ID no formato plano da resposta. Isso confirma a falha de leitura da resposta relatada na E1, mas **não associa os dois perfis remotos a essa execução**: não foi localizado registro dos seus UUIDs, da resposta de criação ou de identidades sintéticas exatas que permita a correlação.
- A comparação remota anterior retornou somente contagens. O script `.e1/preflight-remoto.ps1` não preserva uma lista dos dois UUIDs desconhecidos. Portanto, embora o pedido mencione dois perfis já identificados, os artefatos disponíveis identificam a divergência quantitativa, sem fornecer os dois IDs necessários ao recorte solicitado.

| Perfil pendente, sem associação nominal | Fixture local exata localizada | Origem fictícia comprovada |
| --- | --- | --- |
| Perfil A | Não | Não |
| Perfil B | Não | Não |

Os rótulos A/B apenas representam os dois perfis da contagem anterior; não são uma identificação individual. Não se classificou nenhum perfil como fictício por papel, empresa, proximidade temporal, padrão de nome ou quantidade total.

### Limite da consulta e decisão

A etapa seguinte foi autorizada com restrição aos **UUIDs exatos dos dois perfis**. Como esses identificadores não foram recuperados, não se executou consulta de relações organizacionais nem de Auth; não se substituiu esse recorte por inventário de contas ou busca ampla por nome/e-mail. Falta um registro técnico anterior que forneça os dois IDs e evidência positiva de criação para teste, ou permita a correlação restrita autorizada. Nenhum manifesto foi modificado para atribuir origem retroativamente.

| Verificação/operação desta retomada | Resultado |
| --- | --- |
| Projeto vinculado | Arquivo local `supabase/.temp/project-ref` corresponde ao projeto autorizado; sem reconfirmação remota |
| Histórico imediatamente anterior à aplicação | Não executado: condição 7/7 não satisfeita |
| Checksums imediatamente anteriores à aplicação | Não recalculados nesta retomada |
| Dry-run final | Não executado |
| Aplicação individual de `20260928000100`–`20260928001000` | Nenhuma das dez foi executada |
| Histórico pós-operação | Não executado |
| Schemas, nove tabelas, RLS/FORCE RLS e políticas | Auditoria pós-migração não executada |
| Grants, funções e login runtime restrito | Não verificados remotamente nesta retomada |
| Escrita remota, seed, alteração de Auth/usuários/vínculos/papéis | Nenhuma |
| Testes funcionais, novos envios de e-mail, deploy, commit ou push | Não executados |

A leitura local utilizou `rg --files --hidden --no-ignore`, `git log`, `git show`, `git ls-files` e inspeções em memória com Node, emitindo apenas dados sanitizados. `git diff --check -- docs/validacao/prepublicacao-2026-09-28.md` passou após esta atualização. O estado Git atual difere do retrato inicial desta auditoria: as onze migrações já estão rastreadas, e a única alteração indicada por `git status --short` é este relatório. Nenhum commit foi realizado nesta retomada; os parágrafos anteriores permanecem como histórico das respectivas etapas.

**Encerramento:** autorização de aplicação não ativada; bloqueio por falta de prova individual das duas origens. E1, E2, E3 e E4 permanecem **Parcialmente implementadas**. Continuam as pendências de cadastro público/e-mail, encerramento do Playwright, inspeção visual autenticada e TLS no trecho pooler → PostgreSQL. Não há nova evidência funcional remota, conformidade legal integral ou prontidão para produção. O próximo passo é recuperar os identificadores e registros anteriores das duas criações para permitir a correlação estritamente delimitada, sem criar contas, alterar dados ou repetir envios.

## Alteração autorizada do gate e aplicação — 2026-09-28

O usuário revogou expressamente a exigência anterior de comprovar 7/7 perfis para esta pré-publicação. O critério vigente é: **todos os dados, contas, vínculos e empresas utilizados nos testes e na demonstração acadêmica devem ser fixtures fictícias previamente comprovadas**. As cinco contas e duas empresas do manifesto delimitam esse uso; os dois perfis preexistentes ficam fora do escopo operacional. Não houve nova investigação de proveniência nem consulta individual desses perfis.

> O projeto remoto contém sete perfis. Cinco foram comprovadamente associados às fixtures fictícias utilizadas na validação acadêmica. Dois perfis preexistentes permanecem com origem não comprovada e foram excluídos do escopo operacional da demonstração. Eles não foram consultados individualmente, alterados, excluídos ou utilizados nos testes.

Essas quantidades são as evidências anteriores aceitas expressamente nesta autorização, sem nova contagem ou inventário Auth. **A demonstração utiliza exclusivamente fixtures fictícias comprovadas**; não se afirma que todo o projeto remoto seja exclusivamente sintético. A exclusão de escopo é uma restrição operacional, sem alteração dos registros ou de seus vínculos.

### Inspeção estática obrigatória

As dez migrações foram lidas integralmente e conferidas com `rg` antes da aplicação. Não contêm UPDATE/DELETE de `organizacao.perfis`, INSERT derivado de perfis, acesso a `auth.users`, transformação nominal, backfill, alteração automática de vínculos ou grants a usuários individuais. Não há requisito de sete perfis nem participação obrigatória de todos os registros existentes. O número sete nas regras de M1 se refere ao mínimo de divulgação, sem relação com a quantidade de perfis.

As cinco referências a `organizacao.perfis` em `00100`, `00400` e `00900` são FKs de autoria futura. As novas tabelas são criadas sem carga de dados. As consultas a vínculos/papéis ficam em funções de autorização para operações futuras, delimitadas por empresa e ator; essas funções de negócio não são chamadas pelas migrações. Os gatilhos de imutabilidade pertencem às novas tabelas, sem processamento retroativo dos perfis. As duas constraints acrescentadas a tabelas organizacionais existentes são de unicidade em `grupos` e `estruturas_congeladas`, sem transformação nominal.

**Resultado: as dez migrações são independentes dos dois perfis para sua aplicação e não os processam nominalmente.** Isso não cria uma restrição técnica nova de login ou uma lista de contas permitidas na aplicação; a demonstração futura deve selecionar somente as fixtures comprovadas.

### Revalidação e aplicação autorizada

O projeto vinculado permaneceu `sfutycdmcjsvmfrvtxam`. O manifesto local preservou as duas empresas e cinco contas conhecidas, sem alteração. Todos os dez SHA-256 coincidiram exatamente com a tabela aprovada acima; o SHA-256 da E1 também permaneceu igual. O diretório de migrações continha exatamente a E1 e as dez versões autorizadas.

O CLI retornou o histórico em JSON; após adequar a captura local a esse formato, `supabase migration list --linked` confirmou E1 nas colunas local/remota e as dez novas versões somente locais. `supabase db push --linked --dry-run --skip-vault` terminou com código 0 e listou exatamente os dez arquivos aprovados, sem seed, roles ou operação adicional. A revalidação final foi registrada às **18:15:22 UTC**.

`supabase db push --linked --skip-vault --yes` foi executado uma única vez para aplicação e terminou com **código 0**, com resultado registrado às **18:18:39 UTC**. O helper local reconferiu destino, lista de arquivos e hashes antes do comando. Não houve falha de migração, repetição de aplicação, `repair`, `reset` ou rollback improvisado.

| Versão | Aplicação | Histórico posterior local/remoto |
| --- | --- | --- |
| `20260928000100` | Aplicada | Confirmada em ambos |
| `20260928000200` | Aplicada | Confirmada em ambos |
| `20260928000300` | Aplicada | Confirmada em ambos |
| `20260928000400` | Aplicada | Confirmada em ambos |
| `20260928000500` | Aplicada | Confirmada em ambos |
| `20260928000600` | Aplicada | Confirmada em ambos |
| `20260928000700` | Aplicada | Confirmada em ambos |
| `20260928000800` | Aplicada | Confirmada em ambos |
| `20260928000900` | Aplicada | Confirmada em ambos |
| `20260928001000` | Aplicada | Confirmada em ambos |

O histórico posterior, confirmado pelo CLI e pela consulta de metadados, contém exatamente essas dez versões e `20260927000100`, sem versão adicional. Isso comprova o registro das versões; não constitui checksum remoto independente de cada arquivo SQL.

### Auditoria estrutural somente de leitura

A consulta utilizou a rota oficial `/database/query/read-only` e somente catálogos/metadados. Não consultou perfis, Auth, respostas, códigos ou bytes de documentos. A primeira tentativa recebeu HTTP 400 por serialização local do campo `query` como objeto; após corrigir esse campo para string, a consulta concluiu. Isso não exigiu alteração no banco.

Os schemas `coleta`, `avaliacao` e `inventario` foram encontrados. As **nove tabelas** apresentam `relrowsecurity=true` e `relforcerowsecurity=true`:

| Tabela | Leitura direta do runtime |
| --- | --- |
| `coleta.campanhas` | SELECT previsto; INSERT sujeito à política de rascunho |
| `coleta.grupos_campanha` | SELECT previsto |
| `coleta.codigos` | Nenhuma coluna autorizada |
| `coleta.respostas_protegidas` | Nenhuma coluna autorizada |
| `coleta.registros_consulta` | Nenhuma coluna autorizada, incluindo taxa interna |
| `coleta.fotografias_agregadas` | Nenhuma coluna autorizada |
| `avaliacao.criterios_versoes` | Somente as colunas previstas; sem `pdf` |
| `avaliacao.resultados` | SELECT previsto |
| `inventario.versoes` | Somente as colunas previstas; sem `pdf` |

Foram confirmadas **seis políticas**, todas destinadas a `sistemanr1_api`, e **quatro gatilhos de imutabilidade habilitados**. Não há ACL de tabela/coluna para PUBLIC nem acesso direto de `anon`/`authenticated` às novas tabelas. Esses papéis também não têm USAGE nos três schemas. O runtime tem USAGE sem CREATE; não recebeu UPDATE, DELETE, TRUNCATE, REFERENCES ou TRIGGER nas nove tabelas, nem INSERT fora de `coleta.campanhas`. Códigos/hashes, respostas individuais, taxa interna, fotografia protegida e bytes de PDF não têm SELECT direto pelo runtime.

As **24 funções** esperadas foram encontradas, com **19 SECURITY DEFINER** e `search_path` vazio nas 24. Os corpos remotos conferiram com as definições finais locais por comparação de MD5 do corpo, normalizando CRLF; essa comparação é complementar aos SHA-256 dos arquivos. As funções internas `avaliacao.publicar_criterio_base`, `avaliacao.registrar_resultado_base` e o encerramento M1 substituído permanecem sem EXECUTE pelo runtime. A inspeção dos corpos correspondentes confirmou as validações de empresa/papel, código de uso único e vínculo ativo nos downloads; essas rotinas não foram executadas nesta auditoria.

O login `sistemanr1_runtime_e1` mantém LOGIN, INHERIT, limite de cinco conexões e membership direta apenas em `sistemanr1_api`, sem SUPERUSER, BYPASSRLS, CREATEDB, CREATEROLE ou REPLICATION. Não possui tabelas, views, sequências, schemas ou funções. **Atributos e membership do login preservados**, com a ressalva de EXECUTE herdado da ACL pública abaixo. Não houve alteração de credenciais nem teste funcional de RLS; `row_security_active` administrativo não foi usado como prova.

### Divergência de grants e encerramento

**Grants: DIVERGENTE.** A função de gatilho `coleta.impedir_alteracao_fotografia()`, criada em `20260928000300_m1_fotografia_agregada.sql:31`, manteve EXECUTE para PUBLIC. Os metadados também retornam EXECUTE para `anon`, `authenticated` e runtime nessa função. A migração não contém revogação explícita para ela. As outras 23 funções não apresentam EXECUTE para PUBLIC, `anon` ou `authenticated`.

O impacto observado é uma permissão excedente: a função retorna `trigger`, não é SECURITY DEFINER e seu corpo apenas lança a exceção de imutabilidade. Os schemas continuam sem USAGE para `anon`/`authenticated`, e a auditoria não encontrou leitura direta indevida das tabelas ou PDFs. Portanto, o achado **não comprova exposição de dados**, mas impede declarar todos os grants mínimos. Nenhum teste de chamada foi realizado e nenhuma permissão foi corrigida nesta missão.

As evidências sanitizadas e os helpers desta execução estão em `.e1/`, ignorado pelo Git: `prepublicacao-gate.ps1`, `prepublicacao-gate.local.json`, `aplicacao-e2-e4.local.json`, `auditar-e2-e4.ps1`, `auditoria-e2-e4.sql` e `auditoria-e2-e4.local.json`. Não contêm credenciais incorporadas nem identidades dos dois perfis. O manifesto original foi preservado. Os únicos comandos remotos com escrita foram a aplicação das dez migrações e seu registro normal pelo CLI; não houve escrita adicional autorizada por inferência.

**Encerramento desta missão:** migrações aplicadas; histórico e RLS/FORCE RLS estruturais confirmados; login restrito preservado; uma divergência de EXECUTE registrada, sem correção. E1, E2, E3 e E4 continuam **Parcialmente implementadas**. Nenhuma campanha, token, resposta, avaliação, inventário, PDF, conta ou e-mail foi criado para teste remoto. Não foram repetidos testes locais, builds ou Playwright. Não houve commit, push ou deploy, nem alteração dos dois perfis desconhecidos. As limitações acadêmicas, funcionais, de TLS e de produção permanecem.

**Próximo passo:** tratar o EXECUTE excedente em nova migração especificamente autorizada, preservando os arquivos já aplicados, e repetir a auditoria de grants antes da missão de testes funcionais com as cinco fixtures conhecidas.

## Preparação da publicação integrada — 2026-09-28

O usuário autorizou a preparação e publicação acadêmica de backend e frontend, Git e testes remotos com as cinco fixtures conhecidas. A autorização para **aplicação de migrações remotas**, porém, enumerou exclusivamente `20260928000100`–`20260928001000`, já aplicadas. Por isso, a correção da ACL foi preparada como [migração 01100](../../supabase/migrations/20260928001100_coleta_gatilho_execucao_restrita.sql), sem alterar as dez versões consolidadas. A autorização específica para aplicá-la remotamente foi solicitada e permanece pendente.

`pnpm.cmd exec supabase migration up --local --yes` aplicou somente `20260928001100` no Supabase **local** de teste. A consulta estrutural local seguinte retornou `EXECUTE=false` para runtime, `anon`, `authenticated` e grupo API, ACL PUBLIC igual a zero e o gatilho de imutabilidade ainda habilitado. Nenhum perfil foi consultado ou alterado. O SHA-256 do arquivo proposto é `57f256265a6c6d9728e73de5feffddd76473b31b6e66859ab8fa9782ecabed45`.

A inspeção do Git confirmou que `.env` da API e da web e `.e1/` estão ignorados; arquivos de segredo não foram adicionados. O repositório remoto configurado é GitHub, mas Render e Vercel ainda não estão conectados nesta sessão. Foram encontradas integrações específicas para ambos os provedores e sugerida a conexão; não há configuração local de CLI/API desses provedores no ambiente atual. A preparação de código e a verificação de build prosseguem enquanto essas conexões e a autorização da migração 01100 permanecem pendentes.

Após essa preparação, `pnpm.cmd typecheck`, `pnpm.cmd lint`, `pnpm.cmd format:check` e `pnpm.cmd build` concluíram com código 0. O build gerou a API NestJS e 31 páginas Next.js, incluindo a jornada M1–M3 e as rotas de Auth. O ambiente do build local contém a configuração pública `.env.local`; isso ainda não valida instalação limpa nem variáveis nos provedores. A branch `italo_SDD` do GitHub foi conferida por `git ls-remote` e permanece no commit local anterior ao preparo desta publicação.
