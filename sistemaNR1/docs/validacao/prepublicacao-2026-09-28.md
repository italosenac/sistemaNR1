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

Após essa preparação, `pnpm.cmd typecheck`, `pnpm.cmd lint`, `pnpm.cmd format:check` e `pnpm.cmd build` concluíram com código 0. O build gerou a API NestJS e 31 páginas Next.js, incluindo a jornada M1–M3 e as rotas de Auth. O ambiente do build local contém a configuração pública `.env.local`; isso ainda não valida instalação limpa nem variáveis nos provedores. Os commits `c9d11e4` (auditoria e correção local) e `ba9e0fa` (plano de deploy ajustado à raiz real do repositório) foram enviados à branch `italo_SDD`.

### Preflight somente de leitura para a correção 01100

O arquivo local `supabase/.temp/project-ref` corresponde a `sfutycdmcjsvmfrvtxam`, e o SHA-256 da `01100` continua `57f256265a6c6d9728e73de5feffddd76473b31b6e66859ab8fa9782ecabed45`. Uma nova consulta sanitizada de `supabase migration list --linked` terminou com código 0: E1 e `20260928000100`–`20260928001000` estão nas colunas local e remota; `20260928001100` está somente na coluna local. `supabase db push --linked --dry-run --skip-vault` também terminou com código 0 e enumerou **apenas** `20260928001100_coleta_gatilho_execucao_restrita.sql`, sem seed nem roles. Esses comandos não aplicaram SQL; o dry-run não constitui validação semântica remota. A autorização específica da `01100` ainda é necessária antes de qualquer aplicação.

Render e Vercel permanecem sem conexão nesta sessão. Portanto, não há URLs públicas, verificação remota de `/health`, configuração remota de Auth/CORS ou testes integrados online nesta etapa. Os dois perfis desconhecidos não foram acessados ou modificados.

## Missão final do MVP demonstrável — checkpoint A e inspeção local

O usuário autorizou especificamente a aplicação da `20260928001100_coleta_gatilho_execucao_restrita.sql`, condicionada ao projeto, SHA-256, histórico e dry-run exatos. A branch era `italo_SDD`, o Git estava limpo e o HEAD era `e53ae2105f574496447675214be595aa1ee40991` antes das alterações desta missão.

Imediatamente antes da aplicação, o helper privado `.e1/aplicar-01100.ps1` confirmou projeto `sfutycdmcjsvmfrvtxam`, SHA-256 `57f256265a6c6d9728e73de5feffddd76473b31b6e66859ab8fa9782ecabed45`, histórico de E1 + `00100`–`01000` em ambos os lados e `01100` somente local. O dry-run retornou exclusivamente `20260928001100_coleta_gatilho_execucao_restrita.sql`, sem seed ou roles. O helper repetiu esses checks e executou **uma** aplicação remota por `supabase db push --linked --skip-vault --yes`, com saída sanitizada e código 0. Não houve `reset`, `repair`, seed ou alteração das versões anteriores.

A auditoria remota de metadados, somente de leitura, confirmou `01100` registrada, corpo da função inalterado, gatilho `fotografia_agregada_imutavel` habilitado e `EXECUTE=false` para PUBLIC, `anon`, `authenticated` e login runtime em `coleta.impedir_alteracao_fotografia()`. O histórico do CLI confirmou as 12 versões nas duas colunas. **Grant excedente corrigido**; a auditoria não é teste funcional de RLS.

No frontend, a inspeção local em navegador controlado usou respostas sintéticas **simuladas** para renderizar login, dashboard, campanhas, avaliações e inventário em 1440 px e 390 px. Isso verifica apresentação e navegação, não integração com backend remoto. A primeira rodada detectou hidratação divergente no login; a inicialização do cliente Auth foi ajustada e a segunda rodada terminou sem erro de console ou overflow horizontal. Foram adicionados shell com navegação ativa e empresa visível, dashboard com contagens da API, seleção nominal de estabelecimento M1, matriz M2 em grade, memória de cálculo legível e seleção nominal M3. As capturas temporárias em `.e1/visual-*.png` permanecem ignoradas pelo Git e não serão apresentadas como evidência de fluxo remoto.

O [roteiro](roteiro-demonstracao-mvp.md) e o [checklist manual curto](publicacao-manual-rapida.md) foram preparados. Render e Vercel ainda dependem de conexão para obter URLs, configurar variáveis privadas e testar a jornada online. As duas identidades de origem desconhecida permaneceram fora do escopo.

### Publicação online — checkpoint D

A revisão `f2159c84fec290dabdb6f1f221b40ed78cbca05d` foi enviada à branch `italo_SDD`. A Vercel compilou essa revisão com pnpm 12.6.0 e publicou [o frontend](https://sistemanr1-web-academico.vercel.app). As rotas públicas `/login` e `/questionario` responderam HTTP 200. O projeto está configurado com Root Directory `sistemaNR1/apps/web`, Next.js e Node 24. Como a conexão GitHub da conta Vercel ainda não está habilitada, este deploy foi feito pelo CLI oficial a partir do conteúdo exato do commit; a publicação automática de commits futuros ainda depende da conexão GitHub na Vercel.

O Render publicou [a API](https://sistemanr1-api-academico.onrender.com) a partir da mesma branch e revisão. A configuração do serviço foi lida novamente: Root Directory `sistemaNR1`, Health Check `/health`, build e start do monorepo conforme o plano. O deploy está `live`; uma requisição HTTPS a [`/health`](https://sistemanr1-api-academico.onrender.com/health) retornou HTTP 200 e `{"status":"ok","servico":"sistemaNR1-api"}`. A mesma requisição com `Origin` do frontend retornou `Access-Control-Allow-Origin` correspondente. Isso verifica disponibilidade e CORS nessa rota, não autenticação ou acesso ao banco.

No Supabase Auth, a Site URL foi configurada para o domínio público da Vercel. A primeira atualização serializou por engano os dois redirects numa entrada; a segunda atualização corrigiu a entrada, preservou as URLs anteriores e a leitura final confirmou `/auth/confirmacao` e `/atualizar-senha` como duas Redirect URLs distintas. Não foi enviado e-mail ou criada conta nesse processo.

A revisão automática **rejeitou**, antes da execução, o envio de `SUPABASE_SECRET_KEY` e `DATABASE_URL` como argumentos de linha de comando ao criar o serviço Render. O motivo declarado foi o risco de transmitir os valores privados por essa via; a autorização geral da missão não aprovava os valores exatos nem o meio de transferência. A ação não foi contornada. O serviço foi criado sem esses segredos. `SUPABASE_SECRET_KEY`, `DATABASE_URL` do login restrito e o Secret File `supabase-ca.crt` ainda precisam ser inseridos pelo usuário no painel privado do Render; `SUPABASE_URL`, chave pública, `DATABASE_CA_CERT_PATH` e `FRONTEND_URL` já foram configurados. Enquanto isso, o endpoint de saúde pode responder 200, mas **a jornada M1→M2→M3→PDF online não foi validada nem deve ser declarada funcional**. Após inserir os três itens privados, conferir o novo deploy, login com uma das cinco fixtures comprovadas, operações M1–M3 e PDF sem envolver os dois perfis desconhecidos. E1–E4 permanecem parcialmente implementadas e não prontas para dados reais ou produção.

### Smoke após configuração privada do Render

O usuário confirmou pelo chat que salvou os dois segredos e o Secret File no painel, sem revelar valores. O Render concluiu novo deploy da branch `italo_SDD` na revisão `9eb99bf`. Uma verificação do Auth por ID e e-mail exatos do primeiro registro do manifesto confirmou que se tratava de uma das cinco fixtures comprovadas. Um link administrativo de sessão foi gerado e consumido **sem envio de e-mail e sem criar conta**; Auth retornou uma sessão para o mesmo ID. A chamada autenticada `GET /api/v1/minhas-empresas` na API pública, porém, retornou **HTTP 503 `SERVICO_INDISPONIVEL`**, com mensagem sanitizada de indisponibilidade do cadastro organizacional. Nenhuma campanha ou dado de demonstração foi criado.

Como diagnóstico independente, a conexão PostgreSQL do ambiente local ao mesmo projeto remoto, com o login `sistemanr1_runtime_e1` e CA local, passou com TLS validado no cliente e login restrito confirmado. `pg_stat_ssl` continuou `false` no trecho pooler→PostgreSQL já documentado. Isso não comprova que o valor ou arquivo inserido no Render seja igual ao local. A revisão automática rejeitou a abertura de uma sessão SSH irrestrita no serviço por expor execução remota ampla e acesso potencial a segredos; não houve tentativa de contorno. Foi solicitada ao usuário somente a conferência, no painel privado, da URL do login restrito, do caminho `/etc/secrets/supabase-ca.crt` e do Secret File, sem envio dos valores ao chat. **Status atual: frontend, API e `/health` online; Auth da fixture validado; acesso da API ao cadastro remoto bloqueado por 503; fluxo M1→M2→M3→PDF online pendente.**

### Diagnóstico do 503 e próximo deploy

O usuário confirmou que a primeira `DATABASE_URL` salva no Render apontava para `127.0.0.1` e a substituiu pela URL do pooler remoto. O deploy seguinte ficou `live`, e o erro mudou: a API agora responde HTTP 503 com a mensagem sanitizada **"O certificado CA da conexão remota está indisponível."** Isso ocorre antes de abrir a conexão PostgreSQL. A conexão local com a URL remota e a CA local continuou válida; a consulta de leitura `organizacao.minhas_empresas()` para o ID exato da primeira fixture retornou uma empresa, sem consultar os perfis desconhecidos.

O usuário informou que a CA está disponível, mas o serviço ainda não iniciou outro deploy e a chamada pública permanece no mesmo erro. A documentação do Render exige um Secret File cujo **Filename** seja `supabase-ca.crt`, disponível em `/etc/secrets/supabase-ca.crt` no runtime; salvar somente sem deploy não altera a instância ativa. A tentativa de acionar o novo deploy pela integração foi **rejeitada automaticamente antes da execução por limite de uso da revisão**, sem classificação de insegurança. Não se usou CLI nem outra rota para contornar o bloqueio. Foi indicado ao usuário o painel oficial para adicionar créditos/aguardar a renovação; após a revisão voltar a funcionar, acionar o deploy, confirmar a leitura autenticada e só então executar o smoke M1→M2→M3→PDF. O script privado do smoke está preparado em `.e1/jornada-online.mjs`, sintaticamente validado, mas **não foi executado**. Nenhum novo registro de campanha, código, resposta ou PDF foi criado remotamente.

### Resultado final da publicação e smoke online

Após o usuário adicionar créditos, o deploy Render pôde ser acionado pela mesma integração. A configuração remota inicialmente usava uma URL local `127.0.0.1`; o usuário a substituiu pela URL do pooler remoto. O erro seguinte indicou CA indisponível, mesmo com Secret File presente no painel. A integração fixou novamente **apenas** `DATABASE_CA_CERT_PATH=/etc/secrets/supabase-ca.crt`; o deploy seguinte ficou `live` e a leitura autenticada `GET /api/v1/minhas-empresas` retornou **HTTP 200**, reconhecendo uma empresa da fixture. O `/health` público retornou 200 e o CORS aceitou exatamente a origem Vercel. O Secret File e as credenciais não foram exibidos nem registrados em Git.

O smoke online usou somente IDs das cinco contas e duas empresas do manifesto privado, validando ID/e-mail da fixture antes de gerar sessões administrativas sem envio de e-mail. Na primeira empresa fictícia, foram criados estabelecimento, setor, grupo e fotografia; M1 publicou campanha, emitiu sete códigos de uso único e recebeu **sete respostas anônimas sintéticas**. Após a janela, o encerramento produziu agregado com estado `grupo` e partição divulgável. O responsável técnico conhecido publicou o critério demonstrativo, registrou uma avaliação M2 a partir desse agregado e consolidou um inventário M3. O PDF privado retornou `2449` bytes, cabeçalho `%PDF-1.4` e SHA-256 igual ao `hashPdf` da versão; estado `nao_assinado`. O teste não consultou nem alterou os dois perfis de origem desconhecida.

No frontend público, links de sessão de uso único abriram o painel real para gestor e técnico. A navegação interna percorreu campanhas, avaliações e inventário em desktop **1440 px** e mobile **390 px**, sem erro de página ou overflow horizontal. O painel mostrou uma campanha encerrada, uma avaliação e um inventário; o botão **Baixar PDF privado** produziu no navegador o mesmo arquivo de `2449` bytes e hash esperado. Capturas privadas ficam em `.e1/online-*.png`. Uma recarga completa perde a sessão por `persistSession:false`; durante a apresentação, usar a navegação interna ou gerar novo link. A primeira captura feita antes do fim da carga mostrava listas vazias; após aguardar a API, a versão M3 e o botão de PDF apareceram, e a captura foi refeita. A memória M2 é exibida pelo frontend logo após uma nova avaliação, mas a página ainda não permite reabrir a memória de um resultado já persistido; a API mantém essa memória.

Para demonstrar o questionário ao vivo sem alterar o agregado já fechado, foi criada uma **segunda campanha fictícia ativa** e um código ainda não consumido, guardado somente em `.e1/codigo-demo.local.txt`; o fim programado é `2026-09-29T04:52:32.931Z`. Os links locais de entrada do gestor, trabalhador e responsável técnico ficam em `.e1/entrada-demo-*.local.txt`. As senhas aleatórias originais da E1 não foram preservadas. Uma tentativa de preparar novas senhas para as três contas foi **rejeitada pela revisão automática antes da execução** porque sobrescrever senhas remotas poderia invalidar acessos existentes; nenhuma senha foi alterada e não houve contorno. Os links de uso único são a forma de entrada demonstrativa validada.

O frontend está em `https://sistemanr1-web-academico.vercel.app` e a API em `https://sistemanr1-api-academico.onrender.com`. O Render usa Root Directory `sistemaNR1` e Health Check `/health`; a Vercel usa Root Directory `sistemaNR1/apps/web`. A Vercel compilou o código da revisão `f2159c8`; o Render usou a mesma revisão de código, com commit documental posterior. A conexão GitHub da Vercel ainda depende do login OAuth próprio da conta para deploy automático futuro. E1–E4 continuam **Parcialmente implementadas**: permanecem SMTP remoto, regressão Playwright completa, persistência de sessão entre recargas, reabertura da memória M2 no frontend, TLS não comprovado no trecho pooler→PostgreSQL, assinatura formal e custódia/uso real. A apresentação é exclusivamente acadêmica com fixtures fictícias comprovadas.

### Atualização para a aula — sessão e acessos

A revisão `b0ce12b` da branch `italo_SDD` foi enviada ao GitHub e publicada manualmente na Vercel, no mesmo projeto e URL pública. O build remoto concluiu com pnpm 12.6.0; `/login` e `/health` retornaram HTTP 200. A sessão agora é persistida no navegador. O teste publicado confirmou entrada e recarga do painel para as fixtures conhecidas de gestor, trabalhador e responsável técnico; gestor e técnico percorreram M1, M2 e M3, e o gestor baixou o PDF privado de 2449 bytes com SHA-256 esperado. Desktop e mobile não apresentaram erros de página ou overflow no teste. A recarga persistiu na sessão de teste; disponibilidade contínua por 24 horas depende dos serviços de hospedagem e Auth e não foi medida por 24 horas.

Os três links privados de entrada foram renovados sem envio de e-mail em `.e1/entrada-demo-gestor.local.txt`, `.e1/entrada-demo-trabalhador.local.txt` e `.e1/entrada-demo-tecnico.local.txt`. São de uso único e devem ser abertos antes de expirarem; após a entrada, manter a sessão no mesmo navegador. A revisão automática rejeitou a troca de senhas dessas contas porque invalidaria acessos existentes, e nenhuma senha foi modificada. Não houve acesso aos dois perfis de origem desconhecida. A memória M2 persistida ainda não pode ser reaberta pela interface; as demais limitações acadêmicas anteriores permanecem.
