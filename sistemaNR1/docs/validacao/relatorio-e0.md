# Relatório de validação — E0

Data: **2026-09-26**. Estado: **Concluído e testado**. Escopo: Missão 02 e [SPEC técnica E0](../../specs/fundacao/e0.spec.md). Os 21 RFs de negócio permanecem pendentes e suas SPECs não foram modificadas.

## Entrega

Monorepositório pnpm com Next.js/React/Tailwind/shadcn, NestJS ESM strict, contratos compilados e configuração local Supabase. Página em português com M1 Coleta/M2 Avaliação/M3 Inventário identificados como não implementados. Consulta real ao GET /health com carregamento, sucesso, falha, tempo limite de 5 segundos e nova tentativa.

A API retorna exatamente `{"status":"ok","servico":"sistemaNR1-api"}`, mantém /health fora de /api/v1, valida DTOs, padroniza erros, controla origem CORS por ambiente, escuta 0.0.0.0 e registra Swagger somente em desenvolvimento. Domínio/aplicação estão reservados, sem negócio antecipado.

Versões: Node 24.19.0, npm 11.12.1, pnpm 12.6.0, Git 2.55.0.windows.5; Next 16.3.6/React 19.2.8, Nest 12.1.0, TypeScript 5.9.3, Supabase CLI 2.118.0. Inventário completo em [diagnóstico](../ambiente/diagnostico.md) e [instalação](../ambiente/instalacao.md).

## Comandos e resultados

| Verificação executada | Resultado |
| --- | --- |
| Versões Node/npm/pnpm/Git/Nest CLI/Next/Supabase CLI | Todas responderam; versões fixadas |
| pnpm.cmd install --frozen-lockfile | Sucesso, quatro projetos, lockfile atualizado e políticas aprovadas |
| pnpm.cmd typecheck | Sucesso: contratos, API, web e testes Playwright em strict |
| pnpm.cmd lint | Sucesso, sem erros ou avisos de lint |
| pnpm.cmd format e pnpm.cmd format:check | Sucesso |
| pnpm.cmd test | 14 Jest + 7 Playwright aprovados, sem testes ignorados |
| pnpm.cmd build | Sucesso; contratos antes dos consumidores; API compilada e página Next pré-renderizada |
| pnpm dev dentro do Playwright | Next:3000 e Nest:3001 iniciaram simultaneamente |
| Requisição HTTP real e navegador | /health 200 com contrato exato e indicador API conectada |
| Execução dos builds com NODE_ENV=production | /health 200, página com API conectada, /api/docs-json 404 |
| pnpm.cmd exec supabase init --yes e --version | Configuração local criada, CLI 2.118.0 funcional |
| git check-ignore para arquivos de ambiente | Arquivos reais ignorados; exemplos liberados |

A prova de produção iniciou diretamente o JavaScript compilado da API e o CLI Next start, ambos como processos Node sem janela; um navegador Edge headless consultou os serviços. Ambos foram encerrados depois da prova. Os testes automatizados também encerram seus servidores ao final. As capturas abaixo foram obtidas da execução de produção.

## Cenários automatizados

Jest, em [fundacao.e2e.spec.ts](../../apps/api/test/fundacao.e2e.spec.ts), **14 testes**:

- Saúde exata sem Supabase; prefixo /api/v1 nas rotas comuns e exceção /health.
- Rejeição de DTO inválido e de propriedade desconhecida.
- Erro inesperado sem mensagem interna, segredo ou stack; envelope com correlationId.
- CORS para a origem configurada; origem diferente sem cabeçalho de autorização CORS.
- Swagger presente em development e ausente em production.
- Ambiente padrão sem chaves; rejeição de porta inválida/fora do intervalo, origem curinga/com caminho e NODE_ENV inválido.

Controllers e DTOs de prova existem somente no teste e não entram no build da API.

Playwright, em [fundacao.spec.ts](../../tests/fundacao.spec.ts), **7 testes**:

- Navegador real acessa API real, contrato exato, título/subtítulo, três módulos pendentes, pt-BR e nenhuma exceção de página.
- Falha de rede preserva conteúdo e nova tentativa recupera a conexão real.
- Carregamento visível e botão desabilitado enquanto aguarda resposta.
- HTTP 503 tratado como indisponibilidade.
- JSON de serviço inesperado tratado como indisponibilidade.
- Resposta que não chega encerra a espera e libera nova tentativa.
- Viewport 390×844 mantém módulos/controle utilizáveis e não produz overflow horizontal.

Somente os cenários negativos e o carregamento interceptam a rede. O cenário principal e a recuperação usam NestJS real, incluindo CORS no navegador. Não há testes de transação, autenticação ou RLS em E0.

## Rastreabilidade dos critérios

| Critério | Evidência |
| --- | --- |
| CA-E0-01 | Diagnóstico, versões e manifests |
| CA-E0-02 | Install congelado, typecheck, lint e build topológico |
| CA-E0-03 | Jest saúde + HTTP real + navegador |
| CA-E0-04 | Jest prefixo/erro inesperado, filtro de erros |
| CA-E0-05 | Jest DTOs/CORS + conexão real no browser |
| CA-E0-06 | Jest development/production + 404 na prova de produção |
| CA-E0-07 | Playwright com API real |
| CA-E0-08 | Playwright carregamento/rede/503/contrato/timeout/recuperação |
| CA-E0-09 | Playwright celular, inspeção visual desktop/celular |
| CA-E0-10 | pnpm dev nos testes, builds e execução dos artefatos de produção |
| CA-E0-11 | CLI init/version; .env.example; Git ignore; execução sem chaves |
| CA-E0-12 | Comparação SHA-256 com baseline, documentação e matriz atualizadas |

## Capturas e revisão

- [Desktop](e0-desktop.png), 1280 pixels de largura.
- [Celular](e0-celular.png), 390 pixels de largura.

Aplicada a Skill [revisar-codigo-limpo](../../.agents/skills/revisar-codigo-limpo/SKILL.md). Revisados controller de saúde, filtro de erros, validação/configuração do ambiente, cliente HTTP e componente de conexão. Os conceitos próprios usam português; domínio não depende de frameworks; controller não contém regras de negócio; cliente valida dados externos com Zod e usa contrato compartilhado; estados de conexão e consulta HTTP têm responsabilidades separadas. Componentes gerados preservam nomes oficiais. Sem achados funcionais pendentes no escopo E0.

## Falhas encontradas e correções

| Ocorrência | Correção / resultado |
| --- | --- |
| Node 24.14.1 abaixo do mínimo corrente do gerador Nest na linha 24 | Atualização via winget para 24.19.0, confirmada |
| Rede/locks de operação pnpm bloqueados pelo sandbox | Execuções autorizadas fora da restrição; sem alterar segurança do Windows |
| Primeira geração Next sem diretório apps | Criado diretório pai e repetido CLI oficial com sucesso |
| Workspace adicional gerado pelo scaffold Next | Removido; somente workspace raiz, shadcn com --no-monorepo |
| Scripts nativos aguardando decisão pnpm 12 | allowBuilds explícito; Scarf bloqueado; install congelado final aprovado |
| TypeScript 7 incompatível com peers consultados | TypeScript 5.9.3 fixado, strict mantido |
| Nest 12 ESM com configuração inicial CommonJS | API NodeNext/type module, imports .js, Jest ESM; 14 testes aprovados |
| Link HTML interno apontado pelo ESLint Next | Uso de next/link; lint aprovado |
| Teste localizou dois elementos role=alert (app e anunciador Next) | Seletor restrito à região de conexão; comportamento preservado, suíte aprovada |
| .gitignore do scaffold ignorava .env.example | Exceção explícita para exemplo; arquivos reais continuam ignorados |

Avisos visíveis: VM Modules experimental no Jest; ESLint 9 depreciado no registro; NO_COLOR/FORCE_COLOR do ambiente de testes. Não foram desabilitadas checagens para ocultá-los. Builds utilizam fontes do sistema e não dependem de download do Google Fonts. Nenhuma falha de escrita/link/compilação atribuível ao OneDrive foi reproduzida.

## Preservação e histórico

Baseline de **59 arquivos anteriores à E0** em [preservacao-e0.json](preservacao-e0.json). Todos permanecem presentes: **55 idênticos por SHA-256** e quatro atualizações documentais intencionais, limitadas a README, backlog, matriz e decisões (ADR-11). Os 17 links anteriores do README foram preservados. PDFs, extrações, 21 SPECs, três Skills, AGENTS e demais arquivos originais permanecem iguais ao baseline. Resultado da conferência em [preservacao-resultado-e0.json](preservacao-resultado-e0.json); nenhum problema encontrado nos arquivos e links locais verificados.

Raiz Git preservada em MVP, branch italo_SDD. Baseline documental em 351d10f; durante a sessão passou a existir a revisão 627f2e9, mantida sem reset/rebase. Esta execução não fez commit, push, merge ou deploy. O validador documental da Missão 01 foi preservado como histórico: ele foi escrito para a fase sem código e não deve percorrer node_modules na E0.

## Limites e próxima etapa

Supabase CLI/SDKs preparados, sem projeto remoto conectado, tabelas, migrações SQL, Auth, RLS ou Storage funcional. Banco e isolamento não foram testados nem declarados concluídos. Não há cadastro, campanhas, questionários, avaliação, inventário, PDFs, assinatura ou deploy.

Próxima etapa E1: banco/Auth de teste e Camada 0, autorização por vínculo no servidor e testes de isolamento entre empresas fictícias, conforme SPECs. Os RFs permanecem pendentes; pendências profissionais da documentação original continuam válidas.

Para iniciar novamente:

```powershell
Set-Location 'C:\Users\italo\OneDrive\Documents\MVP\sistemaNR1'
pnpm.cmd install --frozen-lockfile
pnpm.cmd dev
```

Página http://localhost:3000; saúde http://localhost:3001/health; Swagger em desenvolvimento http://localhost:3001/api/docs. Nenhuma chave real é necessária.
