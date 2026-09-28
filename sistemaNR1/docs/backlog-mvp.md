# Backlog do MVP

Prioridade: uma demonstração completa **C0 → M1 → M2 → M3 → PDF → nova versão**, com dados fictícios e travas efetivas. A Missão 01 entregou somente documentação. Em 2026-09-26, a Missão 02 concluiu e testou **E0**; **E1 está parcialmente implementada**: a migração e cinco cenários de negócio remotos passaram, mas o cadastro público/entrega de e-mail remoto e a regressão Playwright com encerramento limpo seguem sem comprovação. E2–E8 e os 21 RFs continuam pendentes. Escopo detalhado permanece nas SPECs.

## Registro de execução — E1

**Parcialmente implementado — atualizado em 2026-09-28.** Quatro papéis, perfil global, matrícula opcional, atribuições/lotação separadas, bootstrap, empresas/estrutura/grupos/snapshots, autenticação e interface implementados. A migração consolidada foi aplicada no Supabase local e no projeto remoto autorizado. Cinco cenários remotos de Auth por link de fixture, API, RLS, isolamento e navegador passaram; cadastro público remoto bloqueado pelo serviço de e-mail. [Relatório E1](validacao/relatorio-e1.md).

A aplicação remota ocorreu após aprovação específica; não repetir migrações. Identidades/estruturas de teste são fictícias. O usuário aceitou TLS validado até o pooler apenas para este MVP; `pg_stat_ssl.ssl = false` no backend não comprova TLS de ponta a ponta. Os 21 RFs e M1–M6 permanecem pendentes; nenhuma associação nominal a resposta foi criada.

Checkpoint de 2026-09-28: a E1 foi encerrada provisoriamente como **Parcialmente implementada**, com cinco cenários funcionais remotos aprovados. Seguem pendentes cadastro público e entrega de e-mail remoto, encerramento limpo do Playwright, verificação de TLS pooler → PostgreSQL e duas possíveis contas de fixture órfãs. O usuário autorizou iniciar Design System + E2 + E3 + E4 com dados fictícios e migrações somente locais; a aplicação de novas migrações remotas exige autorização específica.

## Registro de execução — E0

**Concluído e testado — 2026-09-26.** Workspace pnpm funcional; Node 24.19.0/pnpm 12.6.0; Next.js e NestJS com TypeScript strict; página PT-BR, componentes básicos, saúde pública, DTOs/erros/CORS/Swagger; contrato compartilhado; CLI Supabase e exemplos sem credenciais. Nenhuma tabela, autenticação ou módulo de negócio implementado.

Evidências: [SPEC técnica](../specs/fundacao/e0.spec.md), [relatório E0](validacao/relatorio-e0.md), [diagnóstico](ambiente/diagnostico.md) e [instalação](ambiente/instalacao.md). 14 testes Jest e 7 Playwright aprovados, lint/typecheck e builds de contratos/API/web aprovados. `pnpm dev` foi exercitado com consulta real no navegador. Histórico de planejamento E0–E8 abaixo preservado; a autorização de E0 veio da Missão 02. Próximo trabalho: E1/C0, com banco/Auth/RLS e isolamento entre empresas fictícias.

## Classificação de todos os RFs

| RF | Classificação principal | Recorte / condição de entrega |
| --- | --- | --- |
| [RF-01.1](../specs/m1-coleta/rf-01-1.spec.md) | essencial para o MVP | Link/QR individual por código; envio sem login; concorrência e rollback. |
| [RF-01.2](../specs/m1-coleta/rf-01-2.spec.md) | essencial para o MVP | Rascunho, publicação, janela, meta e adesão; dependências por estado. |
| [RF-01.3](../specs/m1-coleta/rf-01-3.spec.md) | essencial para o MVP | Supressão, ancestral seguro, complementos e filtros; não adiar para depois da demonstração. |
| [RF-01.4](../specs/m1-coleta/rf-01-4.spec.md) | implementação complementar | Campo pode ficar desativado; habilitar só com aviso e proteção implementados. Pendência de uso real P-03. |
| [RF-01.5](../specs/m1-coleta/rf-01-5.spec.md) | essencial para o MVP | Consulta documentada ao encerrar, necessária ao pacote M1. |
| [RF-01.6](../specs/m1-coleta/rf-01-6.spec.md) | essencial para o MVP | Canal alternativo funcional, não apenas texto vazio no cadastro. |
| [RF-01.7](../specs/m1-coleta/rf-01-7.spec.md) | implementação complementar | Cadastro de indicadores com procedência; sem conversão automática em probabilidade. |
| [RF-02.1](../specs/m2-avaliacao/rf-02-1.spec.md) | essencial para o MVP | Modelo 3×3 demonstrativo completo e versionado. |
| [RF-02.2](../specs/m2-avaliacao/rf-02-2.spec.md) | essencial para o MVP | S/P fundamentados pelo técnico fictício; resultado e memória inseparáveis. |
| [RF-02.3](../specs/m2-avaliacao/rf-02-3.spec.md) | essencial para o MVP | Maior consequência e demais consequências preservadas. |
| [RF-02.4](../specs/m2-avaliacao/rf-02-4.spec.md) | essencial para o MVP | Faixa/decisão, justificativa de override e sinal de ação futura. |
| [RF-02.5](../specs/m2-avaliacao/rf-02-5.spec.md) | implementação complementar | Mapa visual e filtros seguros; tabela protegida basta à primeira jornada. |
| [RF-02.6](../specs/m2-avaliacao/rf-02-6.spec.md) | essencial para o MVP | Checklist e medida mínima em M2; sem construir M4. |
| [RF-02.7](../specs/m2-avaliacao/rf-02-7.spec.md) | essencial para o MVP | Resposta obrigatória AEP/AET, distinguindo ausência explícita e campo vazio. |
| [RF-02.8](../specs/m2-avaliacao/rf-02-8.spec.md) | essencial para o MVP | PDF/hash/aprovação acadêmica essenciais; assinatura real dependente de definição P-06. RF permanece parcial até completar. |
| [RF-03.1](../specs/m3-inventario/rf-03-1.spec.md) | essencial para o MVP | Nove alíneas e travas de integração, sem recalcular M2. |
| [RF-03.2](../specs/m3-inventario/rf-03-2.spec.md) | implementação complementar | Biblioteca sintética editável complementar; cadastro manual completo do perigo atende ao fluxo inicial. |
| [RF-03.3](../specs/m3-inventario/rf-03-3.spec.md) | essencial para o MVP | Base geral sintética estruturada integrada ao mesmo inventário. |
| [RF-03.4](../specs/m3-inventario/rf-03-4.spec.md) | essencial para o MVP | Versões imutáveis, diferenças e conflito de revisão desde a primeira entrega. |
| [RF-03.5](../specs/m3-inventario/rf-03-5.spec.md) | necessário para produção futura | Guardas contra exclusão e exportação aberta entram na primeira entrega; custódia por décadas e restauração operacional são futuras. |
| [RF-03.6](../specs/m3-inventario/rf-03-6.spec.md) | essencial para o MVP | PDF demonstrativo com data/campo e trava formal; assinatura real dependente de definição P-06. |

As quatro categorias são **essencial para o MVP**, **implementação complementar**, **dependente de definição** e **necessário para produção futura**. A classificação principal acima não elimina subtarefas condicionadas: assinatura formal de RF-02.8/03.6 e método real de RF-02.1/02.2 são **dependentes de definição**; não impedem os recortes demonstrativos especificados. Não há RF inteiro descartado por falta de definição. Retenção operacional é futura; sua proteção técnica começa agora.

## Etapas executáveis e critérios de saída

| Etapa | Trabalho autorizado em prompt futuro | Dependências reais | Saída verificável |
| --- | --- | --- | --- |
| E0 — Fundação | Inicializar Git se ausente, pnpm workspace, Next App Router/Nest strict, lint/typecheck/Jest; fixar versões; contratos básicos; configuração de exemplo sem segredos | Documentação atual | Builds mínimos, testes realmente executados e instruções locais; sem dados reais |
| E1 — C0 e autorização | Conexão Supabase, migrações revisadas C0, Auth/perfis/vínculos/atribuições/lotação, quatro papéis, empresas/estrutura/grupos, Nest/RLS e interface administrativa | E0; prompt E1 recebido; aprovação separada para aplicar migração remota | Dois tenants sintéticos, quatro papéis, concessão/revogação testadas, estrutura congelável; sem implementar M1–M3 ou ciclo M5 |
| E2 — Campanha/coleta | Rascunho RF-01.2; canal RF-01.6; instrumento demo; códigos RF-01.1; publicar/enviar; RF-01.3 e RF-01.5 no encerramento | E1; regras de população e transação | Link/QR e alternativa geram respostas fictícias únicas; consulta documentada; agregado seguro |
| E3 — Critérios/avaliação | Rascunho RF-02.1 → PDF RF-02.8 → aprovação demo → cálculo RF-02.2/3 → classificação RF-02.4; incluir RF-02.6/7 antes de fechar | E2; P-01/P-02 adotados somente em modo demo | Memória reproduzível, maior consequência, AEP/AET respondida, risco evidente sem medida bloqueado |
| E4 — Inventário integrado | Base geral RF-03.3; rascunho a–i RF-03.1; mecanismo RF-03.4 antes de consolidar; guardas RF-03.5 | E3; referências e conteúdo geral completos | Versão consolidada imutável com diferenças e origem |
| E5 — Documento e roteiro | PDF RF-03.6, exportação JSON/CSV RF-03.5, hash e estados; nova versão com comparação | E4 | Jornada demonstrada até PDF; tentativa de avanço formal sem assinatura rejeitada; pacote aberto legível |
| E6 — Complementos | RF-01.4, RF-01.7, RF-02.5 e RF-03.2; ampliar cenários sem enfraquecer proteções | Base E1–E5 | Funcionalidades complementares com seus testes; pendências expostas |
| E7 — Publicação acadêmica | Configurar contas/segredos autorizados, Vercel/Render/Supabase, HTTPS, persistência, smoke da jornada | E5; autorização/configuração de serviços; termos/cotas conferidos | Demonstração online fictícia, sem alegação de assinatura ou conformidade |
| E8 — Preparação para produção | Resolver P-01 a P-09, assinatura real, custódia/backup/restauração e validação profissional | Especificações/decisões adicionais e autorização | Não é entregue por esta missão nem presumido pronto |
 
Não há prazo em dias inventado: estimar após E0, considerando capacidade e tempo disponível. M4–M6 permanecem fora do backlog implementável até receber requisitos.

## Plano de adaptação E1 — execução autorizada

| Ordem | Reutilização / ajuste necessário | Critério de saída e testes |
| --- | --- | --- |
| E1.1 — contrato e ambiente | Reutilizar E0, CLI vinculado, Auth SDK, guard, erros, contratos e evidências; verificar estado remoto de migrações sem escrita; revisar DTOs quebrados pela mudança | Alvo confirmado, ambiente seguro, plano compatível; credenciais nunca em logs |
| E1.2 — schema revisado | Preservar SQL anterior; revisar migração não aplicada ou criar evolução se houver aplicação externa. Perfis/status/datas, vínculos UUID/matrícula nullable, atribuições, lotações e dados profissionais opcionais | Migração revisável; restrições/índices de identidade e empresa definidos. Aplicação só após autorização específica |
| E1.3 — estrutura organizacional | Completar Empresa, Estabelecimento, Setor, Função, Turno, Grupo e população/snapshots; reaproveitar FKs compostas | CA-C0-01–05 e 13–16; proibir referências entre empresas, sobreposição e perda histórica |
| E1.4 — concessão e revogação | Substituir `exigirGestor` fixo por capacidades explícitas na aplicação, reforçadas no banco; quatro papéis combináveis; estado do perfil/vínculo/atribuição | CA-USU-04–10/14; negar autoelevação, papel forjado, remoção do último gestor e revogação ignorada |
| E1.5 — identidade e bootstrap | Reutilizar getUser/admin.createUser e falha parcial; conta sem matrícula; primeiro gestor/empresa controlados; reconciliação de `leitor` e perfis preexistentes; ativação Auth | CA-USU-01/02/12/13/15/16; sem confirmar e-mail artificialmente nem criar conta duplicada |
| E1.6 — banco restrito e RLS | Revisar grants/políticas/funções para capacidades, TLS, pool e contexto local; login runtime sem privilégios administrativos | Testes reais allow/deny, FKs/NULL/duplicidade, estados, revogação concorrente, acesso direto e reuso do pool; mocks não encerram tarefa |
| E1.7 — interface/contratos | Adaptar `papel` para atribuições, matrícula opcional e lotação separada; perfil próprio, gestão de empresas/estrutura, carteira autorizada da consultoria | E2E troca de contexto, perfis, ausência de privilégio herdado; atualização coordenada Zod/DTO/SDK/Swagger |
| E1.8 — fechamento | Executar cenários e registrar evidências com SPEC/matriz; preservar 21 RFs e fronteira anônima | E1 só concluída com banco real de teste e critérios atendidos; nada de M1/M2/M3 implementado por inferência |

A migração consolidada e os contratos atuais já implementam as adaptações acima. Banco remoto continua sem alteração; aplicar somente após aprovação específica. Não usar reset remoto nem mapear `leitor` automaticamente. Papéis são uma lista de atribuições e matrícula é nullable.

Testes existentes a adaptar: `apps/api/test/usuarios.spec.ts`, `usuarios-http.spec.ts`, `identidades-supabase.spec.ts`, `tests/usuarios.spec.ts` e `supabase/tests/camada-zero.sql`. Preservar testes de separação de credenciais/falha parcial; trocar exigência de matrícula pelo comportamento NULL/única quando preenchida e ampliar quatro papéis/atribuições. Regressões E0 continuam obrigatórias.

M1 recebe somente estrutura/grupos congelados, nunca lotações nominais; M2 usa autorização técnica por empresa e mantém critérios/memória/versionamento; M3 valida responsável e acesso a versões sem recalcular. Ciclo é dependência conceitual futura E3/E4, sem tabela/fluxo funcional em E1. Área pessoal M4, aferições M5 e recibos M6 dependem de SPECs futuras.

Na saída da E1, CA-USU-11 é verificado estruturalmente nos contratos; sua jornada de coleta permanece para E2. Snapshots C0 são testados como capacidade própria, sem antecipar campanha/inventário. Registrar essas fronteiras como integrações futuras, não como falha que obrigue implementar M1–M3 dentro da E1.

## Massa e roteiro mínimo de demonstração

Criar duas empresas fictícias. Na primeira, setor A com 20 pessoas esperadas e 8 respostas; setor B com 20 esperadas e 3 respostas. Publicar apenas agregado seguro do estabelecimento (11 respostas), suprimindo a decomposição que revelaria B por subtração. Em campanha independente, setor com 7 respostas demonstra a fronteira; outro escopo inteiro com 6 permanece suprimido. Não reutilizar fotografias para contornar supressão.

Demonstrar código único, reenvio bloqueado, token concorrente, alternativa de coleta, encerramento com taxa registrada, consulta e agregado. Aprovar matriz demo antes do cálculo; usar S=3/P=2 → R=6/faixa alta/introduzir. Registrar consequência determinante, AEP/AET e preliminar. Demonstrar trava de risco evidente sem medida e sua correção documental.

Consolidar inventário geral sintético com a–i, exportar PDF datado/sem assinatura formal, tentar avanço formal e observar bloqueio. Alterar uma descrição por nova versão, mostrar diferença/autor/data e reabrir original intacto. Exportar histórico aberto e tentar exclusão/cross-tenant, ambos recusados.

## Definição de entrega

Entregar a jornada somente após testes relevantes reais, inclusive negativos, com evidências na SPEC/matriz. Informar RFs parciais por assinatura/custódia. Publicação online não transforma RF parcial em concluído. Não omitir complemento apenas por não estar no primeiro roteiro.
