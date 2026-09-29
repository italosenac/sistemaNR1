# Auditoria de retomada completa — E0 → E4

Data: 2026-09-28. Escopo: leitura de SPECs, código, testes, Git e estado publicado do MVP acadêmico, exclusivamente com dados fictícios. Esta auditoria não executou migrações, escrita no Supabase, deploy, seed, testes funcionais remotos ou alteração de serviços. Os estados abaixo medem aderência às SPECs integrais, não a aptidão para a apresentação.

## 1. Snapshot

| Item | Estado observado |
| --- | --- |
| Branch / HEAD | `italo_dev` / `55a90e1177ec390d85d7a86d2186d22a150bb9b2` |
| Working tree no início | Limpa; `italo_dev...origin/italo_dev` |
| Remote Git | `origin` → `https://github.com/italosenac/sistemaNR1.git` |
| Ferramentas locais | Node `24.19.0`; pnpm `12.6.0`; Git disponível |
| Monorepo | Raiz, `apps/api`, `apps/web`, `packages/contratos`; `pnpm-workspace.yaml`, lockfile e scripts na raiz |
| Versões fixadas | Next `16.3.6`, React `19.2.8`, Nest `12.1.0`, TypeScript `5.9.3`, Jest `30.5.2`, Playwright `1.63.0`, Supabase CLI `2.118.0` |
| Supabase | Projeto vinculado `sfutycdmcjsvmfrvtxam`; `supabase migration list --linked` mostrou as 12 versões abaixo tanto no lado local quanto remoto. A listagem não confirma checksum remoto nem estado de cada objeto. |
| Render | Serviço `srv-date6n1srm7s738bvoc0`, URL `https://sistemanr1-api-academico.onrender.com`, repo `italosenac/sistemaNR1`, branch configurada `italo_SDD`, Root Directory `sistemaNR1`, Health Check `/health`, auto-deploy ativo, não suspenso. Último deploy **live** observado: `9eb99bfa0ef7b88d6319eb1da73b9d50ac6dc10c`. `GET /health` respondeu 200 e `{"status":"ok","servico":"sistemaNR1-api"}` (uma primeira tentativa de 30 s expirou). |
| Vercel | Projeto `prj_4xUfHTrL9oJPQGtLKz6LCBKHVdmG`; produção **READY** em `b0ce12b8ae94f9809c36ea78a54bc80b4ad043b4`, ref `italo_SDD`, alias `https://sistemanr1-web-academico.vercel.app`; `GET /login` respondeu 200. Previews mais recentes de `italo_dev` existem, mas não substituem a produção. Root Directory `sistemaNR1/apps/web` consta no plano anterior; o conector atual não conseguiu reconfirmá-lo. |
| Alcance da checagem online | Disponibilidade pontual de `/health` e `/login`, não prova regressão ponta a ponta nem permanência por 24 h. Variáveis secretas, CA e seus valores não foram lidos. |

### Inventário de migrações

O estado remoto foi obtido por histórico de versões do CLI, não por comparação independente do SQL executado. Não modificar arquivos já aplicados; correções futuras exigem nova migração.

| Versão / arquivo | Local | Remota | Objetivo | Mutável? |
| --- | --- | --- | --- | --- |
| `20260927000100_camada_zero.sql` | SIM | SIM | Organização, identidade empresarial, RLS, funções, runtime restrito e auditoria E1 | NÃO |
| `20260928000100_m1_base_coleta.sql` | SIM | SIM | Schemas/tabelas da coleta, campanha, grupo, código e resposta protegida | NÃO |
| `20260928000200_m1_fluxo_transacional.sql` | SIM | SIM | Publicação, emissão de código e resposta anônima transacional | NÃO |
| `20260928000300_m1_fotografia_agregada.sql` | SIM | SIM | Encerramento e fotografia agregada protegida | NÃO |
| `20260928000400_m2_criterios_resultados.sql` | SIM | SIM | Critérios versionados e resultados M2 | NÃO |
| `20260928000500_m2_validacoes.sql` | SIM | SIM | Validação interna e grants restritos da avaliação | NÃO |
| `20260928000600_m2_validacao_publica_runtime.sql` | SIM | SIM | Execução delimitada do validador pelo runtime | NÃO |
| `20260928000700_m2_matriz_operadores.sql` | SIM | SIM | Correção da lógica do validador da matriz | NÃO |
| `20260928000800_m2_hash_matriz.sql` | SIM | SIM | Hash da matriz de critério | NÃO |
| `20260928000900_m3_inventario_integrado.sql` | SIM | SIM | Versões imutáveis de inventário, alíneas, PDF/hash | NÃO |
| `20260928001000_documentos_download_restrito.sql` | SIM | SIM | Download privado com revalidação de vínculo | NÃO |
| `20260928001100_coleta_gatilho_execucao_restrita.sql` | SIM | SIM | Revogação de execução indevida da função de gatilho de fotografia | NÃO |

### Inventário dos testes antes de qualquer execução

Os testes foram **inventariados, não repetidos nesta auditoria**: Jest em `apps/api/test/` (fundação, usuários/HTTP, identidade, regras C0, campanha, agregação, coleta HTTP, matriz e PDF); Playwright em `tests/fundacao.spec.ts`, `tests/usuarios.spec.ts`, `tests/questionario.spec.ts`, `tests/integracao/camada-zero.spec.ts` e `tests/remoto/camada-zero.spec.ts`; RLS em `supabase/tests/camada-zero.sql`, `scripts/testar-rls.mjs`, `scripts/testar-rls-remoto.mjs`; integração real M1→M3 em `scripts/testar-coleta-local.mjs`; matriz em `scripts/testar-m2-validacoes-local.mjs`. Os scripts de raiz incluem `test:api`, `test:e2e`, `test:integracao`, `test:remoto:e1`, `test:rls`, `test:coleta:local`, `typecheck`, `lint`, `format:check` e `build`. Os relatórios anteriores registram 67 Jest, integração local e cenários remotos fictícios, mas não constituem nova execução em `italo_dev`. Como as principais lacunas são estáticas e já estão explícitas nas SPECs/código, repetir suites agora não resolveria ambiguidades relevantes.

## 2. E0 — fundação

Fonte: `specs/fundacao/e0.spec.md`; evidência histórica: `docs/validacao/relatorio-e0.md`. **Estado global após a missão de fechamento de 2026-09-28: COMPROVADO no escopo E0.** A descrição original da página com módulos “ainda não implementados” é um retrato de E0, superado pela evolução autorizada E1–E4; os cartões atuais dizem “Parcialmente implementado”, sem remover os módulos.

| Item | Estado e base |
| --- | --- |
| Workspace pnpm, contratos e build topológico | COMPROVADO: `package.json`, `pnpm-workspace.yaml`, `packages/contratos`, lockfile e relatório E0 |
| Next App Router, React, TS strict, Tailwind/shadcn | COMPROVADO: `apps/web`, configuração, componentes `ui`; build relatado em E2–E4 |
| Nest ESM, TS strict, `/health`, prefixo `/api/v1` | COMPROVADO: `apps/api/package.json`, `main.ts`, `configurar-aplicacao.ts`, `saude.controller.ts`; resposta remota 200 atual |
| Swagger somente development, CORS, DTO global, envelope de erro | COMPROVADO por configuração/testes de fundação; revisar após alterações futuras em `configurar-aplicacao.ts` e `filtro-de-erros.ts` |
| Validação de ambiente | COMPROVADO para E0: `validar-ambiente.ts` valida `NODE_ENV`, `PORT` e `FRONTEND_URL` (origem exata), com casos negativos Jest. `NEXT_PUBLIC_API_URL` é configuração pública da web; Supabase/DB e seus segredos pertencem às integrações posteriores e a SPEC E0 não exige checagem externa no startup |
| Supabase local e CLI | COMPROVADO historicamente por integração local; nesta leitura, CLI remoto funcionou. Instalação local limpa não repetida |
| Jest, Playwright, typecheck, lint, format e build | COMPROVADO para E0 nesta missão pelos comandos e resultados atuais abaixo. A suíte E1 mais ampla não foi repetida nem é concluída por este resultado |
| Segredos fora do repositório | COMPROVADO quanto ao padrão de `.gitignore` e arquivos rastreados examinados; não significa auditoria integral de todas as exposições possíveis |

### Evidência atual do fechamento E0 — 2026-09-28

Snapshot antes das alterações: branch `italo_dev`, HEAD `55a90e1177ec390d85d7a86d2186d22a150bb9b2`; somente este relatório estava não rastreado. Node `24.19.0`, pnpm `12.6.0`. Nenhum arquivo privado foi copiado para o clone de reprodução.

| Verificação | Comando / resultado |
| --- | --- |
| Instalação limpa | Clone local isolado do HEAD versionado; `pnpm.cmd install --frozen-lockfile` terminou com código **0**, 924 pacotes reutilizados, sem atualização de lockfile. A primeira tentativa foi bloqueada pelo lock global do store do pnpm no sandbox; a repetição autorizada usou o mesmo comando. Clone descartado após a verificação. |
| Contratos e TypeScript | `pnpm.cmd typecheck` terminou com código **0** após a correção dos testes; compila `@sistemanr1/contratos` e verifica web/API/testes. `RespostaDeSaude` é importado por `saude.controller.ts` e `consultar-saude.ts`. |
| Lint / formato | `pnpm.cmd lint` e `pnpm.cmd format:check` terminaram com código **0** após a correção. |
| Build | `pnpm.cmd build` terminou com código **0** após a correção: contratos, Nest e Next; Next gerou 31 páginas estáticas. |
| Jest E0 | `pnpm.cmd --filter @sistemanr1/api test -- --runTestsByPath test/fundacao.e2e.spec.ts --runInBand`: **14/14 testes**, uma suíte, código **0**. Comprova `/health` exato, prefixo, DTO/campo desconhecido, envelope de erro sem stack/mensagem interna, CORS permitido/negado, Swagger development 200/production 404 e configuração válida/inválida. |
| Playwright E0 | `E0_WEB_PORT=3210`, `E0_API_PORT=3211`, `pnpm.cmd exec playwright test tests/fundacao.spec.ts --reporter=line --global-timeout=180000`: **7/7**, código **0**, término espontâneo em 46,1 s e zero listeners nas portas de teste após a saída. Rodado fora do sandbox porque o sandbox bloqueia o `taskkill /T /F` utilizado pelo próprio Playwright no Windows; uma execução de diagnóstico dentro dele terminou com `7 passed` mas erro de teardown por timeout e não foi considerada aprovada. |
| `/health` local | A API subiu pelo `pnpm dev:api` configurado no Playwright; o teste de navegador fez requisição real e confirmou HTTP **200** com `{"status":"ok","servico":"sistemaNR1-api"}`. O Jest confirmou o mesmo contrato sem Supabase. |
| Segredos rastreados | `git ls-files` identificou somente dois `.env.example`, nenhum `.env` real, certificado ou arquivo de credenciais de demonstração. Busca por padrões de PEM, URL PostgreSQL autenticada e token longo não encontrou valores reais rastreados; duas ocorrências de uma chave curta sintética pertencem a `identidades-supabase.spec.ts`. Nenhum valor foi emitido nesta auditoria. |

Correções mínimas: `tests/fundacao.spec.ts` passou a esperar o estado atual “Parcialmente implementado” nos três cartões e a aceitar a porta local de teste configurada; `playwright.config.ts` permite portas E0 alternativas sem mudar os padrões 3100/3101. A porta 3100 estava ocupada por processo anterior ao teste, por isso o recorte foi repetido em 3210/3211. A falha de encerramento sob sandbox decorreu da impossibilidade de executar o `taskkill` do Playwright; a mesma suíte encerrou com código 0 quando essa restrição não se aplicou. Nenhum servidor de teste ficou nas portas alternativas. Swagger, CORS e envelope foram confirmados por código e testes, sem deploy. A linha E0 do plano preliminar na seção 11 fica atendida por esta evidência; o próximo trabalho é E1, em missão separada.

## 3. E1 — Camada 0

Fontes: `specs/camada-0/usuarios-perfis.spec.md`, `specs/camada-0/estrutura-organizacional.spec.md`, migração `20260927000100`, `docs/validacao/relatorio-e1.md`. **Estado global: PARCIAL.** A migração e a maior parte dos fluxos C0 existem; a evidência remota de cinco fixtures fictícias e testes locais comprova recortes, não todos os critérios de aceitação.

| Requisito/fluxo | Estado | Evidência ou lacuna objetiva |
| --- | --- | --- |
| Signup público e confirmação de e-mail | PARCIAL | Formulários e `signUp`/`verifyOtp` existem; as tentativas públicas remotas registradas retornaram 400/429, sem prova de entrega. Links administrativos das fixtures não substituem signup público. |
| Login, logout e sessão | COMPROVADO no recorte fictício | `formulario-auth.tsx`, `sessao-provider.tsx`; testes E1 e demonstração de três papéis. Revalidar ao encerrar E1. |
| Recuperação e atualização de senha | IMPLEMENTADO SEM EVIDÊNCIA remota completa | `resetPasswordForEmail` e `updateUser` existem; entrega/retorno de e-mail público não validado. |
| Perfil global, vínculos por empresa e matrícula | PARCIAL | API, UI, tabelas e testes multiempresa presentes; associação de conta existente tem fluxo e motivo, mas requer prova ponta a ponta completa em condição real de convite/cadastro público. |
| Quatro papéis e autorização | COMPROVADO no recorte testado | `usuario.ts`, guard, serviço/repositórios e cinco cenários remotos fictícios; revogação com mesmo JWT e isolamento relatados. Cobertura integral de matriz de permissões ainda a conferir. |
| Estabelecimentos, setores, funções, turnos, grupos e lotações | PARCIAL | `organizacao.controller.ts`, `repositorio-organizacao-postgres.ts`, `gestao-estrutura.tsx` e migração existem; telas e cenários principais funcionam, mas cobertura visual/autorização completa de cada operação não está demonstrada. |
| Identificação profissional | PARCIAL | Campo e edição em `meu-perfil.tsx` e persistência C0; não constitui validação profissional nem assinatura. |
| Bootstrap, associação de conta existente e snapshots | PARCIAL | Fluxos, motivo de associação, congelamento e revisão estrutural aparecem no código e nos testes; faltam evidências ampliadas de revisão/revogação/concorrência e de conta pública existente. |
| Eventos de auditoria | PARCIAL | Tabelas/gatilhos C0 e consulta restrita existem; política operacional de retenção, cobertura de todas as mutações e inspeção de logs ainda não comprovadas. |
| RLS, FORCE RLS, runtime restrito e TLS | PARCIAL | Migração aplica RLS/FORCE, grants estreitos e login restrito; testes local/remoto fictícios de isolamento passaram. Cliente→pooler validado com CA/hostname; `pg_stat_ssl.ssl=false` no backend observado não comprova TLS ponta a ponta. Aceite acadêmico limitado a dados fictícios. |
| Regressão E1 em navegador | PARCIAL | Treze cenários passaram historicamente, mas processo Playwright não encerrou limpo; inspeção visual autenticada integral segue pendente. |

## 4. E2 / M1 — sete fichas de RF

Convenções das fichas: **evidência remota histórica** refere-se aos testes relatados em `prepublicacao-2026-09-28.md` e `roteiro-demonstracao-mvp.md`; a presente auditoria não os repetiu. Testes referidos por nome são arquivos existentes. RLS/grants de M1 vêm das migrações `00100`–`00300`, com correção `01100`.

### RF-01.1 — questionário anônimo e token único

- **SPEC / status / integral:** `specs/m1-coleta/rf-01-1.spec.md`; PARCIAL; NÃO.
- **Implementação / banco:** `servico-coleta.ts`, `coleta.controller.ts`, `coleta.dto.ts`, `questionario-anonimo.tsx`; tabelas `coleta.codigos` e `coleta.respostas_protegidas`, função transacional em `00200`. Código de alta entropia, hash persistido, consumo com bloqueio de linha e resposta sem chave nominal.
- **API / frontend:** emissão autenticada no controller de campanhas; `POST /api/v1/questionarios/respostas` sem login; rota `/questionario` remove código do fragmento da URL. Não há geração/distribuição completa de lote link/QR.
- **Testes / segurança / remoto:** `coleta-http.spec.ts`, `scripts/testar-coleta-local.mjs`, `tests/questionario.spec.ts`; rollback, concorrência e reuso testados localmente, payload nominal recusado. Fluxo fictício online demonstrado historicamente, sem nova inspeção de logs.
- **Lacunas / regressão / próximo mínimo / reimplementar:** link/QR, lote sem destinatários e prova de ausência de identificadores nos logs/persistência; preservar atomicidade e isolamento. Adicionar distribuição segura e inspeções automatizadas. **Reimplementar: somente distribuição e prova faltante.**

### RF-01.2 — campanha, janela e adesão

- **SPEC / status / integral:** `specs/m1-coleta/rf-01-2.spec.md`; PARCIAL; NÃO.
- **Implementação / banco:** `campanha.ts`, `servico-coleta.ts`, `campanhas.controller.ts`, `gestao-campanhas.tsx`; `coleta.campanhas`, `grupos_campanha`, `registros_consulta` e funções `00100`–`00300`.
- **API / frontend:** criar/listar/publicar/encerrar e anexar grupos/códigos; `/campanhas` mostra jornada demonstrativa.
- **Testes / segurança / remoto:** `campanha.spec.ts`, `coleta-http.spec.ts`, `testar-coleta-local.mjs`; janela e autorização empresarial nos fluxos testados; campanha remota fictícia demonstrada historicamente.
- **Lacunas / regressão / próximo mínimo / reimplementar:** instrumento e metas/adesão precisam de avaliação criterial completa, correções versionadas e visualização integral; não expor taxa interna de pequenos grupos. Completar apresentação/versões e seus testes de autorização. **Reimplementar: somente partes faltantes.**

### RF-01.3 — supressão e agregação hierárquica

- **SPEC / status / integral:** `specs/m1-coleta/rf-01-3.spec.md`; PARCIAL; NÃO.
- **Implementação / banco:** `agregacao-protegida.ts`, `servico-coleta.ts`; `coleta.fotografias_agregadas` e função de fechamento em `00300`. Publica grupo seguro ou estabelecimento seguro, suprime células abaixo de sete e evita complemento imediato por subtotal.
- **API / frontend:** pacote agregado via campanhas; `/campanhas` lê apenas dados divulgáveis.
- **Testes / segurança / remoto:** `agregacao-protegida.spec.ts`, `testar-coleta-local.mjs` cobrem 6/7 e complementos 3+5, 7+3, isolamento; sete respostas fictícias e agregado online relatados. Fotografias e respostas não têm leitura direta pelo runtime.
- **Lacunas / regressão / próximo mínimo / reimplementar:** comparação temporal entre campanhas, filtros função/turno e exportações não têm política contra diferenciação. Definir e testar política de consultas/publicação antes de ampliar filtros. **Reimplementar: somente proteção complementar.**

### RF-01.4 — texto aberto opcional

- **SPEC / status / integral:** `specs/m1-coleta/rf-01-4.spec.md`; AUSENTE; NÃO.
- **Implementação / banco / API / frontend:** nenhum campo, tabela, endpoint ou UI específico localizado nas fontes M1; o DTO atual aceita somente fatores numéricos.
- **Testes / segurança / remoto:** nenhum teste específico; nenhuma evidência remota. Texto livre aumenta risco de identificação e não pode ser publicado individualmente.
- **Lacunas / regressão / próximo mínimo / reimplementar:** aviso prévio, opção de não responder, proteção/triagem/redação e acesso agregado. Especificar o tratamento seguro e acrescentar o campo opcional com testes negativos; preservar rejeição de identificadores nominais. **Reimplementar: somente a capacidade ausente.**

### RF-01.5 — registro documental da consulta

- **SPEC / status / integral:** `specs/m1-coleta/rf-01-5.spec.md`; PARCIAL; NÃO.
- **Implementação / banco:** `servico-coleta.ts`, `campanhas.controller.ts`; `coleta.registros_consulta` e fotografia do fechamento em `00300`.
- **API / frontend:** fechamento associa registro de consulta à campanha; `/campanhas` apresenta dados do processo.
- **Testes / segurança / remoto:** `testar-coleta-local.mjs` comprova registro ligado ao fechamento; autorização empresarial e pacote protegido. Evidência online de fechamento é histórica.
- **Lacunas / regressão / próximo mínimo / reimplementar:** revisões/correções, exportação documental e falha forçada com rollback não estão plenamente provadas. Estender histórico imutável e teste transacional sem expor respostas. **Reimplementar: somente revisão/exportação/prova.**

### RF-01.6 — canal alternativo

- **SPEC / status / integral:** `specs/m1-coleta/rf-01-6.spec.md`; PARCIAL; NÃO.
- **Implementação / banco:** validações de publicação em `campanha.ts`/`servico-coleta.ts` e campos de campanha em `00100`; fluxo de resposta por código é base reaproveitável.
- **API / frontend:** canal demonstrativo web em `/questionario`; não há operação completa de impressão, coleta offline e transcrição neutra.
- **Testes / segurança / remoto:** `campanha.spec.ts`, `testar-coleta-local.mjs`; não há E2E específico do canal alternativo nem evidência remota.
- **Lacunas / regressão / próximo mínimo / reimplementar:** definir emissão, custódia e transcrição de papel/alternativa sem criar elo nominal ou reutilizar códigos; testar duplicidade e prazo. **Reimplementar: somente canal alternativo.**

### RF-01.7 — indicadores complementares

- **SPEC / status / integral:** `specs/m1-coleta/rf-01-7.spec.md`; AUSENTE; NÃO.
- **Implementação / banco / API / frontend:** não se localizou modelo persistente, endpoint ou tela para indicadores objetivos com fonte, período e versão; métricas de campanha não os substituem.
- **Testes / segurança / remoto:** nenhum teste específico nem evidência remota.
- **Lacunas / regressão / próximo mínimo / reimplementar:** modelo de procedência, correção/versionamento e uso sem deduzir identidade ou probabilidade só da contagem de respostas. Projetar módulo complementar mínimo e testes de rastreabilidade/isolamento. **Reimplementar: somente capacidade ausente.**

## 5. E3 / M2 — oito fichas de RF

Base comum: `servico-avaliacao.ts`, `avaliacao.controller.ts`, `avaliacao.dto.ts`, `matriz-risco.ts`, `avaliacao-demonstrativa.tsx`; schemas/tabelas/funções em `00400`–`00800`. Critérios e resultados empresariais têm RLS/FORCE RLS, funções internas sem execução direta indevida e PDF privado. O modelo 3×3 é acadêmico.

### RF-02.1 — matriz editável

- **SPEC / status / integral:** `specs/m2-avaliacao/rf-02-1.spec.md`; PARCIAL; NÃO.
- **Implementação / banco:** validação de todas as nove células da matriz demonstrativa, versão imutável e hash; `avaliacao.criterios_versoes` (`00400`–`00800`).
- **API / frontend:** modelo e publicação em `/api/v1/avaliacoes`; `/avaliacoes` publica matriz fixa 3×3; não é editor de escalas/células completo.
- **Testes / segurança / remoto:** `matriz-risco.spec.ts`, `testar-m2-validacoes-local.mjs` cobrem matrizes inválidas/grants; critério online fictício relatado.
- **Lacunas / regressão / próximo mínimo / reimplementar:** edição efetiva, rascunho, aprovação formal e versões completas. Adicionar edição em torno do validador existente, preservando cobertura integral e imutabilidade publicada. **Reimplementar: somente edição/workflow.**

### RF-02.2 — nível numérico e memória

- **SPEC / status / integral:** `specs/m2-avaliacao/rf-02-2.spec.md`; PARCIAL; NÃO.
- **Implementação / banco:** cálculo `R=S×P`, justificativas, memória e resultado persistido em `avaliacao.resultados` (`00400`–`00800`), com origem M1 publicável.
- **API / frontend:** POST/lista de resultados; `/avaliacoes` mostra memória após criação, mas sua reabertura/histórico completo na UI não está demonstrada.
- **Testes / segurança / remoto:** `matriz-risco.spec.ts`, `testar-coleta-local.mjs`; resultado fictício online histórico; isolamento empresarial testado localmente.
- **Lacunas / regressão / próximo mínimo / reimplementar:** memória recuperável, revisões, fontes complementares e justificativa auditável integral. Expandir leitura/apresentação sem recalcular registros antigos. **Reimplementar: somente memória/histórico faltantes.**

### RF-02.3 — consequência determinante

- **SPEC / status / integral:** `specs/m2-avaliacao/rf-02-3.spec.md`; PARCIAL; NÃO.
- **Implementação / banco:** domínio valida maior consequência e empate justificado; lista persistida no resultado (`00400`–`00800`).
- **API / frontend:** DTO recebe consequências; formulário `/avaliacoes` demonstra uma consequência por vez, sem gestão completa da lista e revisões.
- **Testes / segurança / remoto:** `matriz-risco.spec.ts`, `testar-coleta-local.mjs`; evidência online apenas da jornada demonstrativa.
- **Lacunas / regressão / próximo mínimo / reimplementar:** UI de múltiplas consequências, exibição da determinante e demais, histórico de revisão. Ampliar formulário e leitura mantendo regra de máximo/empate no servidor. **Reimplementar: somente interface e revisão.**

### RF-02.4 — faixa e decisão justificada

- **SPEC / status / integral:** `specs/m2-avaliacao/rf-02-4.spec.md`; PARCIAL; NÃO.
- **Implementação / banco:** domínio/backend calculam faixa e aceitam override com justificativa; resultado em `avaliacao.resultados`.
- **API / frontend:** endpoint aceita dados; UI demonstrativa não expõe o fluxo completo de override e revisão.
- **Testes / segurança / remoto:** `matriz-risco.spec.ts`, `testar-coleta-local.mjs`; sem prova remota da decisão excepcional.
- **Lacunas / regressão / próximo mínimo / reimplementar:** apresentação da decisão, medidas, justificativa e trilha de alterações. Completar UI/histórico e testes negativos de override sem justificativa. **Reimplementar: somente workflow faltante.**

### RF-02.5 — mapa de calor protegido

- **SPEC / status / integral:** `specs/m2-avaliacao/rf-02-5.spec.md`; AUSENTE; NÃO.
- **Implementação / banco / API / frontend:** nenhum mapa, consulta filtrada ou rota específica localizado; agregados M1 e resultados M2 existentes são insumos reaproveitáveis, não o recurso.
- **Testes / segurança / remoto:** nenhum teste específico; filtros podem revelar grupos pequenos por diferença.
- **Lacunas / regressão / próximo mínimo / reimplementar:** política de supressão/filtros antes da visualização; criar consulta protegida e UI com testes de diferenciação e isolamento. **Reimplementar: somente recurso ausente.**

### RF-02.6 — preliminar e risco evidente

- **SPEC / status / integral:** `specs/m2-avaliacao/rf-02-6.spec.md`; PARCIAL; NÃO.
- **Implementação / banco:** `riscoEvidente` exige `medidaRegistrada` na validação e persistência M2 (`00400`–`00800`).
- **API / frontend:** resultado registra medida; `/avaliacoes` não contém checklist preliminar integral ou bloqueio formal completo.
- **Testes / segurança / remoto:** `matriz-risco.spec.ts` e integração local; sem teste remoto do checklist completo.
- **Lacunas / regressão / próximo mínimo / reimplementar:** estruturar checklist e impedir avanço sem medidas quando evidente; testes de bloqueio por etapa. **Reimplementar: somente checklist/workflow.**

### RF-02.7 — AEP/AET

- **SPEC / status / integral:** `specs/m2-avaliacao/rf-02-7.spec.md`; PARCIAL; NÃO.
- **Implementação / banco:** estado explícito `nenhum`/`aep`/`aet` e referência em resultado M2 (`00400`–`00800`).
- **API / frontend:** formulário de avaliação registra estado/referência; apresentação e integração documental integral não encontradas.
- **Testes / segurança / remoto:** `matriz-risco.spec.ts`, integração local; sem validação profissional remota específica.
- **Lacunas / regressão / próximo mínimo / reimplementar:** comprovação da existência/versão dos documentos, validação profissional e vínculo às avaliações. Acrescentar referência verificável e testes de ausência/mismatch. **Reimplementar: somente integração documental.**

### RF-02.8 — documento de critérios

- **SPEC / status / integral:** `specs/m2-avaliacao/rf-02-8.spec.md`; PARCIAL; NÃO.
- **Implementação / banco:** PDF, versão, data, responsável acadêmico e hashes em `criterios_versoes`; bytes privados e download restrito (`00400`, `01000`). Estado fixo `nao_assinado`.
- **API / frontend:** endpoint de PDF e botão em `/avaliacoes`.
- **Testes / segurança / remoto:** `pdf-rascunho.spec.ts`, `testar-coleta-local.mjs` validam bytes/hash/isolamento; PDF fictício online relatado.
- **Lacunas / regressão / próximo mínimo / reimplementar:** assinatura formal verificável e fluxo de aprovação; hash não é assinatura. Preservar rascunho e adicionar mecanismo formal só após requisito/decisão próprios. **Reimplementar: somente assinatura/workflow.**

## 6. E4 / M3 — seis fichas de RF

Base comum: `servico-inventario.ts`, `inventario.controller.ts`, `inventario.dto.ts`, `inventario-integrado.tsx`; `inventario.versoes` em `00900` e download restrito em `01000`. O serviço copia os resultados M2, sem recalcular o risco.

### RF-03.1 — nove alíneas

- **SPEC / status / integral:** `specs/m3-inventario/rf-03-1.spec.md`; PARCIAL; NÃO.
- **Implementação / banco:** DTO e função `alineas_completas` exigem alíneas a–i por item e bloqueiam consolidação incompleta (`00900`).
- **API / frontend:** POST de consolidação e formulário `/inventarios`; exemplo fictício editável.
- **Testes / segurança / remoto:** `testar-coleta-local.mjs` omite cada alínea e confirma bloqueio; inventário online fictício histórico; RLS empresarial.
- **Lacunas / regressão / próximo mínimo / reimplementar:** pertinência técnica/conteúdo efetivo das alíneas e vínculo formal às fontes e ao responsável; validar semanticamente sem enfraquecer o bloqueio. **Reimplementar: somente validação/completude substantiva.**

### RF-03.2 — biblioteca de perigos

- **SPEC / status / integral:** `specs/m3-inventario/rf-03-2.spec.md`; AUSENTE; NÃO.
- **Implementação / banco / API / frontend:** nenhuma tabela, serviço, endpoint ou editor de biblioteca de perigos psicossociais localizado. Campos livres do item não substituem biblioteca editável/versionada.
- **Testes / segurança / remoto:** nenhum teste específico ou evidência remota.
- **Lacunas / regressão / próximo mínimo / reimplementar:** catálogo editável, procedência, versão, autorização e vínculo com itens. Acrescentar capacidade sem alterar versões consolidadas; testar isolamento e referências. **Reimplementar: somente recurso ausente.**

### RF-03.3 — integração ao inventário geral

- **SPEC / status / integral:** `specs/m3-inventario/rf-03-3.spec.md`; PARCIAL; NÃO.
- **Implementação / banco:** `servico-inventario.ts` combina item geral informado e resultados psicossociais M2, exige ambos e conserva valor M2 (`00900`).
- **API / frontend:** consolidação em `/api/v1/inventarios`; `/inventarios` demonstra item geral fictício.
- **Testes / segurança / remoto:** `testar-coleta-local.mjs` prova ausência do geral bloqueada e preservação M2; fluxo fictício online histórico, sem integração a PGR geral real.
- **Lacunas / regressão / próximo mínimo / reimplementar:** fonte estruturada/versionada do inventário geral e reconciliação de referências; manter não recálculo M2. **Reimplementar: somente conector/modelo geral.**

### RF-03.4 — versões e diferenças

- **SPEC / status / integral:** `specs/m3-inventario/rf-03-4.spec.md`; PARCIAL; NÃO.
- **Implementação / banco:** versões imutáveis, autor, data, hash e resumo `hashAnterior/hashAtual/conteudoAlterado` em `inventario.versoes` (`00900`); UPDATE/DELETE bloqueados.
- **API / frontend:** lista/consulta de versões; `/inventarios` mostra resumo.
- **Testes / segurança / remoto:** `testar-coleta-local.mjs` cobre duas versões e bloqueio DELETE; uso remoto de versões não exaustivamente revalidado.
- **Lacunas / regressão / próximo mínimo / reimplementar:** diff semântico por campo e concorrência otimista. Acrescentar comparação e conflito de versão preservando imutabilidade. **Reimplementar: somente diff/concorrência.**

### RF-03.5 — retenção e exportação aberta

- **SPEC / status / integral:** `specs/m3-inventario/rf-03-5.spec.md`; PARCIAL; NÃO.
- **Implementação / banco:** histórico de versões e bloqueio de DELETE em `00900`; PDF privado em `01000`.
- **API / frontend:** leitura das versões/PDF; exportação aberta estruturada e manifesto de hashes não localizados.
- **Testes / segurança / remoto:** `testar-coleta-local.mjs` testa imutabilidade; não prova retenção operacional de 20 anos, backup/restore ou exportação.
- **Lacunas / regressão / próximo mínimo / reimplementar:** JSON/CSV com metadados/manifesto e política operacional de custódia; teste de exportação e restauração, autorização e integridade. **Reimplementar: somente exportação/custódia faltantes.**

### RF-03.6 — PDF e assinatura

- **SPEC / status / integral:** `specs/m3-inventario/rf-03-6.spec.md`; PARCIAL; NÃO.
- **Implementação / banco:** PDF com hash, versão e estado `nao_assinado` em `00900`; download privado em `01000`.
- **API / frontend:** rota PDF e botão `/inventarios`.
- **Testes / segurança / remoto:** `pdf-rascunho.spec.ts`, `testar-coleta-local.mjs` comprovam formato/hash e acesso empresarial; PDF online fictício histórico.
- **Lacunas / regressão / próximo mínimo / reimplementar:** assinatura formal verificável, identidade/habilitação do responsável técnico e avanço formal. Conservar marcação **RASCUNHO NÃO ASSINADO** até evidência verificável; teste de assinatura e download. **Reimplementar: somente formalização.**

## 7. Matriz consolidada dos 21 RFs

| Etapa | RF | Estado | Base existente que deve ser preservada |
| --- | --- | --- | --- |
| E2/M1 | 01.1 | PARCIAL | Código único, resposta anônima e transação |
| E2/M1 | 01.2 | PARCIAL | Campanha, grupos, janela e fechamento |
| E2/M1 | 01.3 | PARCIAL | Fotografia com supressão 6/7 |
| E2/M1 | 01.4 | AUSENTE | Questionário numérico existente como base |
| E2/M1 | 01.5 | PARCIAL | Registro de consulta associado |
| E2/M1 | 01.6 | PARCIAL | Publicação e código como base |
| E2/M1 | 01.7 | AUSENTE | Agregado M1 como fonte futura, sem inventar indicador |
| E3/M2 | 02.1 | PARCIAL | Matriz 3×3 validada/versionada |
| E3/M2 | 02.2 | PARCIAL | `R=S×P` e memória persistida |
| E3/M2 | 02.3 | PARCIAL | Determinante e empate validados |
| E3/M2 | 02.4 | PARCIAL | Faixa/override justificado no backend |
| E3/M2 | 02.5 | AUSENTE | Resultado M2 e agregado M1 como insumos |
| E3/M2 | 02.6 | PARCIAL | Risco evidente exige medida |
| E3/M2 | 02.7 | PARCIAL | Estado/ref AEP/AET |
| E3/M2 | 02.8 | PARCIAL | PDF/hash não assinado |
| E4/M3 | 03.1 | PARCIAL | Nove alíneas bloqueadas no banco |
| E4/M3 | 03.2 | AUSENTE | Inventário atual como consumidor futuro |
| E4/M3 | 03.3 | PARCIAL | Consolidação de geral + M2 sem recálculo |
| E4/M3 | 03.4 | PARCIAL | Versões imutáveis e hash |
| E4/M3 | 03.5 | PARCIAL | Histórico e bloqueio DELETE |
| E4/M3 | 03.6 | PARCIAL | PDF privado em rascunho não assinado |

Contagem: **0 COMPROVADO, 17 PARCIAL, 0 IMPLEMENTADO SEM EVIDÊNCIA, 4 AUSENTE, 0 DIVERGENTE, 0 BLOQUEADO** entre os 21 RFs. O estado de E0 e os subitens E1 não entram nessa conta. Ausência de implementação integral não invalida a evidência dos recortes demonstrados.

## 8. Dívidas técnicas

1. **Proteção M1:** a fotografia evita pequenos grupos e complementos imediatos, mas comparação temporal, filtros adicionais e exportação podem permitir diferenciação. Definir política antes de novas consultas.
2. **Operação E1:** signup/entrega de e-mail público, término limpo do Playwright, cobertura visual autenticada e TLS entre pooler e backend PostgreSQL permanecem sem aprovação integral. Não usar dados pessoais reais.
3. **Versionamento e documentos:** critério M2 e inventário M3 são rascunhos com hash. Falta assinatura verificável, diffs semânticos e custódia operacional; hash não é assinatura, bloqueio DELETE não prova 20 anos.
4. **Deploy acadêmico:** Render/Vercel produção seguem `italo_SDD`, enquanto desenvolvimento atual está em `italo_dev`; a produção não acompanha automaticamente o HEAD auditado. Saúde HTTP pontual não prova capacidade/estabilidade nem suite ponta a ponta.
5. **Fonte geral M3:** o item geral demonstrativo é digitado no fluxo; não há integração comprovada com inventário PGR geral versionado.

## 9. Divergências SPEC × implementação e documentação

Não foi encontrada contradição que imponha status **DIVERGENTE** a um RF; foram encontradas implementações parciais. A matriz fixa M2 não satisfaz a exigência de edição integral; o PDF/hash sem assinatura não satisfaz a formalização; o item geral manual não satisfaz integração geral plena. Essas são lacunas, não evidência para descartar o código existente.

**DOCUMENTAÇÃO DESATUALIZADA:** `README.md` e o cabeçalho de `docs/matriz-rastreabilidade.md` ainda apresentam os 21 RFs como pendentes; `docs/backlog-mvp.md` e `docs/validacao/relatorio-e2-e4.md` falam de migrações M1–M3 somente locais ou aguardando aprovação. Algumas SPECs repetem esse estado histórico. A listagem remota atual contém E1, `00100`–`01000` e `01100`; os componentes M1–M3 e seus testes existem. Os relatos antigos permanecem úteis como histórico, sem serem a fotografia operacional atual. Não foram alterados nesta passagem.

## 10. Evidências faltantes

- Comparação independente de checksums/objetos SQL remotos; `migration list` prova versões, não igualdade semântica dos arquivos.
- A instalação limpa, os checks estáticos, Jest E0 e Playwright E0 de `italo_dev` foram comprovados na missão E0 posterior à auditoria inicial. Permanecem por repetir separadamente a integração local M1→M3, RLS e a suíte Playwright mais ampla de E1–E4 com encerramento limpo; não fazem parte do aceite E0.
- Signup público, confirmação/entrega, recuperação de senha e associação de conta existente em fluxo remoto controlado com caixa fictícia apropriada.
- Inspeção de logs/persistência da coleta sem elo nominal; teste de política contra diferenças entre campanhas, filtros e exportações.
- Testes completos do editor M2, override, checklist, AEP/AET e heatmap protegido; prova de que probabilidade não deriva apenas do número de respostas.
- Integração a inventário geral estruturado, biblioteca de perigos, diff por campo, exportação aberta, custódia operacional, assinatura verificável e habilitação do responsável técnico.
- Nova verificação ponta a ponta do deploy após futuros commits/deploys; Vercel Root Directory não reconfirmado pelo conector atual.

## 11. Plano de continuação, em ordem original

Cada linha abaixo conserva a base indicada na matriz; “pronto” significa critérios da SPEC comprovados por testes correspondentes e documentação/rastreabilidade atualizadas, nunca somente tela ou PDF. Implementação futura deve usar as Skills aplicáveis e migrações **novas** para mudanças de banco; não editar as 12 versões aplicadas.

| Ordem | Existente → falta | Arquivos prováveis / testes necessários | Dependência e risco de regressão / definição de pronto |
| --- | --- | --- | --- |
| E0 | Fundação funcional → instalação limpa, checks atuais e Playwright com saída limpa | `package.json`, configs, `tests/fundacao.spec.ts`, `apps/api/test/fundacao.e2e.spec.ts`; `build`, `typecheck`, `lint`, `format:check`, Playwright | Base de todas as etapas; não mudar contrato `/health` nem CORS; CA E0 e saída 0 |
| E1 | C0 implementada → signup/e-mail/recuperação, associação e cobertura visual, decisão TLS | `formulario-auth.tsx`, `confirmacao-auth.tsx`, `servico-usuarios.ts`, `tests/remoto/camada-zero.spec.ts`, `tests/usuarios.spec.ts` | Requer caixa fictícia/ambiente aprovado; evitar contas reais e efeito sobre fixtures; CAs C0 comprovados |
| RF-01.1 | Transação segura → lote link/QR e inspeção logs | `servico-coleta.ts`, `questionario-anonimo.tsx`, `testar-coleta-local.mjs`, `tests/questionario.spec.ts` | Depende C0/01.2/01.6; não criar elo nominal; quatro CAs e inspeção aprovados |
| RF-01.2 | Campanha/janela → instrumento, meta/adesão, revisão e telas | `campanha.ts`, `servico-coleta.ts`, `gestao-campanhas.tsx`, testes campanha/HTTP | Não revelar contagens sensíveis; todos CAs 01.2 |
| RF-01.3 | Supressão de fotografia → política temporal/filtros/exportação | `agregacao-protegida.ts`, nova migração/consulta, testes 6/7 e diferença | Depende 01.2; evitar reconstruir grupo; todos CAs 01.3 |
| RF-01.4 | Questionário numérico → texto opcional protegido | DTO, `questionario-anonimo.tsx`, nova migração e testes negativos | Depende política de anonimato; aviso/triagem/acesso seguro e CAs 01.4 |
| RF-01.5 | Registro vinculado → revisão/exportação/rollback | `servico-coleta.ts`, nova migração, integração transacional | Não expor respostas; CAs 01.5 |
| RF-01.6 | Código web → canal alternativo operacional | serviço/UI de campanha, testes offline/transcrição | Depende 01.1/01.2; sem vínculo destinatário; CAs 01.6 |
| RF-01.7 | Agregado → indicador objetivo com procedência | novo modelo/endpoint/UI e testes de fonte/versão | Depende M1 seguro; não inferir probabilidade só da adesão; CAs 01.7 |
| RF-02.1 | Matriz 3×3 → editor/workflow completo | `matriz-risco.ts`, `servico-avaliacao.ts`, `avaliacao-demonstrativa.tsx`, validações | Depende M1; preservar matriz publicada; CAs 02.1 |
| RF-02.2 | `R=S×P` → memória recuperável/revisões/fontes | serviço/endpoint/UI M2, testes de persistência e cálculo | Depende 02.1; não recalcular versões antigas; CAs 02.2 |
| RF-02.3 | Determinante → lista/empate/revisões na UI | `matriz-risco.ts`, DTO/UI e testes de empate | Depende 02.2; máximo no servidor; CAs 02.3 |
| RF-02.4 | Faixa/override backend → decisão/medidas/auditoria UI | serviço/DTO/UI e testes de justificativa | Depende 02.2/02.3; impedir override sem razão; CAs 02.4 |
| RF-02.5 | Dados M1/M2 → heatmap protegido | consulta/API/UI nova, testes de filtros/diferença | Depende 01.3 e 02.4; nenhum filtro pode revelar célula pequena; CAs 02.5 |
| RF-02.6 | Risco evidente exige medida → checklist completo | serviço/DTO/UI, testes de bloqueio | Depende 02.4; impedir avanço indevido; CAs 02.6 |
| RF-02.7 | Status/ref AEP/AET → vínculo documental/profissional | serviço/DTO/UI, testes de referência | Depende C0/02.6; não fingir validação profissional; CAs 02.7 |
| RF-02.8 | PDF/hash rascunho → assinatura formal verificável | `servico-avaliacao.ts`, `pdf-rascunho.ts`, teste bytes/assinatura | Depende aprovação profissional/critério; manter não assinado até comprovação; CAs 02.8 |
| RF-03.1 | Bloqueio a–i → validação substantiva e fontes | DTO, `servico-inventario.ts`, testes de alíneas | Depende M2; não aceitar item nominal indevido; CAs 03.1 |
| RF-03.2 | Sem biblioteca → catálogo editável/versionado | nova migração, serviço/UI, testes de isolamento | Depende 03.1; não mutar versões consolidadas; CAs 03.2 |
| RF-03.3 | Geral manual + M2 → fonte geral estruturada | serviço/DTO/UI e integração real do geral | Depende 03.1/03.2; M3 não recalcula M2; CAs 03.3 |
| RF-03.4 | Imutabilidade/hash → diff semântico e concorrência | `servico-inventario.ts`, nova migração, testes de conflito | Depende 03.3; não alterar versões antigas; CAs 03.4 |
| RF-03.5 | Histórico/DELETE bloqueado → exportação e custódia | serviço/endpoint, testes de export/restore/autorização | Depende 03.4; retenção real exige operação/backups; CAs 03.5 |
| RF-03.6 | PDF privado → assinatura/estado formal | serviço/PDF/UI, teste verificável de assinatura | Depende 03.5/identidade técnica; só avançar do rascunho com prova; CAs 03.6 |

**Primeiro RF a retomar após as pendências de E0/E1: RF-01.1**, porque a distribuição por link/QR e a prova de ausência de vínculo nominal completam a porta de entrada de M1, da qual as etapas seguintes dependem. O código transacional e o questionário existentes devem ser preservados.
