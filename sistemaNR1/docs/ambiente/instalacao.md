# Instalação e execução — E0

Validado no Windows x64/PowerShell 5.1 em 2026-09-26. Estado e versões completas no [diagnóstico](diagnostico.md); evidências no [relatório E0](../validacao/relatorio-e0.md).

## Ferramentas do sistema

Git 2.55.0.windows.5 já estava instalado. Node 24.14.1 foi atualizado para **24.19.0 LTS** para atender ao conjunto de ferramentas. npm 11.12.1 e Corepack 0.34.6 estavam disponíveis; Corepack não foi necessário. pnpm **12.6.0** foi instalado no prefixo npm do usuário, já presente no PATH.

Comandos efetivamente utilizados:

```powershell
winget upgrade --id OpenJS.NodeJS.LTS --exact --version 24.19.0 --silent --accept-package-agreements --accept-source-agreements --disable-interactivity
npm.cmd install --global pnpm@12.6.0 --no-fund --no-audit
node --version
npm.cmd --version
pnpm.cmd --version
git --version
```

A instalação Node exigiu elevação administrativa do instalador; foi concluída. Não houve alteração de UAC, antivírus, TLS, políticas do PowerShell ou caminhos longos. Se o PATH de um novo terminal ainda apontar para versão anterior, reabrir o terminal e conferir `Get-Command node,pnpm.cmd`.

## Workspace existente

```powershell
Set-Location 'C:\Users\italo\OneDrive\Documents\MVP\sistemaNR1'
pnpm.cmd install --frozen-lockfile
pnpm.cmd dev
```

Workspace único com três pacotes: `apps/web`, `apps/api`, `packages/contratos`. Manifest raiz privado; pnpm fixado em `packageManager`, Node em `.node-version` e `engines`; dependências exatas e um único lockfile. Contratos são compilados antes dos consumidores. O store pnpm permanece fora do OneDrive. Não mover o projeto nem criar outro Git.

Os comandos abaixo registram **a criação já executada**, não precisam ser repetidos para usar o projeto:

```powershell
New-Item -ItemType Directory -Path apps -Force
pnpm.cmd dlx create-next-app@16.3.6 apps/web --typescript --tailwind --eslint --app --src-dir --import-alias '@/*' --use-pnpm --skip-install --disable-git --yes --no-agents-md
pnpm.cmd dlx shadcn@4.21.0 init --cwd apps/web --defaults --no-monorepo --yes
pnpm.cmd dlx shadcn@4.21.0 add card input label alert --cwd apps/web --yes
pnpm.cmd exec supabase init --yes
```

O shadcn init já adicionou Button. Os demais componentes foram adicionados pelo CLI oficial; MensagemDeErro compõe Alert. O workspace secundário emitido pelo scaffold Next foi removido. `next dev` gera instruções locais em `apps/web/AGENTS.md` e `CLAUDE.md`; as três Skills e o AGENTS da raiz foram preservados.

API estruturada manualmente nas quatro camadas pedidas, com CLI Nest local e TypeScript/Jest/ESLint. Nest 12 é ESM; imports relativos terminam em `.js` para o Node executar o JavaScript compilado. Jest usa ts-jest ESM e `--experimental-vm-modules`, seguindo [Jest](https://jestjs.io/docs/ecmascript-modules) e [ts-jest](https://kulshekhar.github.io/ts-jest/docs/guides/esm-support). O aviso experimental não é suprimido.

## Bibliotecas instaladas

| Local | Bibliotecas principais e versões |
| --- | --- |
| Web | Next 16.3.6; React/React DOM 19.2.8; Tailwind/PostCSS 4.3.3; shadcn 4.21.0; Base UI 1.8.0; lucide-react 1.48.0 |
| Web, preparação solicitada | @supabase/ssr 0.12.7; @supabase/supabase-js 2.117.2; zod 4.6.5; react-hook-form 7.89.0; @hookform/resolvers 5.9.1 |
| Componentes | class-variance-authority 0.7.1; cn 0.4.0; tw-animate-css 1.4.0 |
| API | @nestjs/common/core/platform-express/testing 12.1.0; @nestjs/config 12.0.1; @nestjs/swagger 12.0.2; class-validator 0.15.1; class-transformer 0.5.1; reflect-metadata 0.2.2; rxjs 7.8.2; @supabase/supabase-js 2.117.2 |
| Ferramentas | TypeScript 5.9.3; ESLint 9.39.5; typescript-eslint 8.70.1; Prettier 3.9.9; Nest CLI 12.0.7; Supabase CLI 2.118.0; concurrently 10.0.5 |
| Testes | Jest 30.5.2; ts-jest 29.4.14; Supertest 7.3.0; Playwright 1.63.0 |

Tipos e dependências auxiliares constam dos quatro manifests e do lockfile. `pnpm.cmd list --recursive --depth 0` lista os valores instalados. SDKs Supabase e bibliotecas de formulários são preparação explicitamente pedida; E0 não cria autenticação nem formulários de negócio.

## Variáveis de ambiente

A aplicação funciona sem criar arquivos locais. Para configurar:

```powershell
if (-not (Test-Path 'apps/web/.env.local')) { Copy-Item 'apps/web/.env.example' 'apps/web/.env.local' }
if (-not (Test-Path 'apps/api/.env')) { Copy-Item 'apps/api/.env.example' 'apps/api/.env' }
```

| Variável | Local / padrão E0 |
| --- | --- |
| NEXT_PUBLIC_API_URL | Web; http://localhost:3001 |
| NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY | Web; vazias |
| NODE_ENV | API; development |
| PORT | API; 3001 |
| FRONTEND_URL | API; http://localhost:3000; somente origem exata |
| SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY / SUPABASE_SECRET_KEY | API; vazias |

Nenhum valor real foi usado. Arquivos `.env` e variantes estão ignorados; os exemplos são versionáveis. Variáveis públicas são incluídas no build Next: nunca colocar chave secreta nelas. `FRONTEND_URL` não aceita `*`, caminho ou barra final; CORS é uma regra do navegador, não autorização de usuário. Autorização de negócio será implementada em E1.

## Execução e verificação

```powershell
pnpm.cmd dev
# Ou em terminais separados:
pnpm.cmd dev:web
pnpm.cmd dev:api
```

- Frontend: http://localhost:3000
- Saúde pública: http://localhost:3001/health
- Swagger (development): http://localhost:3001/api/docs
- Prefixo reservado às rotas de negócio futuras: /api/v1

```powershell
Invoke-RestMethod -Uri 'http://localhost:3001/health'
pnpm.cmd typecheck
pnpm.cmd lint
pnpm.cmd test
pnpm.cmd build
pnpm.cmd format:check
```

`pnpm test` executa 14 testes HTTP/configuração e 7 testes no navegador. Fechar servidores manuais antes de executar os testes de navegador, pois eles iniciam seus próprios servidores nas portas 3000/3001. Windows usa Edge instalado. Fora do Windows, instalar Chromium com `pnpm exec playwright install chromium`. Se Edge estiver ausente no Windows, instalar seu navegador de teste com `pnpm.cmd exec playwright install msedge`.

Produção local após build, em terminais separados:

```powershell
# API
$env:NODE_ENV = 'production'
pnpm.cmd --filter @sistemanr1/api start:prod
# Web, outro terminal
pnpm.cmd --filter @sistemanr1/web start
```

O ambiente `production` deve ser definido explicitamente também na hospedagem futura. API escuta `0.0.0.0`, respeita PORT e omite Swagger em produção. `Ctrl+C` encerra os servidores; `$env:NODE_ENV = 'development'` restaura o modo no terminal da API. Nenhum deploy foi realizado.

## Supabase na próxima etapa

CLI local inicializada com `supabase/config.toml`; migrations vazia. Não foram executados `start`, `link`, `db push` ou migrations. Não há conexão remota ou garantia de Auth/Storage/RLS nesta entrega. Docker não é necessário para E0.

Na E1, selecionar/criar um projeto **de teste** com dados fictícios, confirmar escopo e preencher os arquivos locais com URL/chaves apropriadas do painel. Login CLI pode ser interativo; não copiar tokens para código, terminal compartilhado ou relatório. Com projeto definido, os comandos previstos são:

```powershell
pnpm.cmd exec supabase login
pnpm.cmd exec supabase link --project-ref REFERENCIA_DO_PROJETO_DE_TESTE
```

Esses comandos não foram executados. Criar migrations a partir da Camada 0, revisar privilégios/RLS, implementar verificação de identidade e vínculo no servidor e testar isolamento entre duas empresas sintéticas. Só então aplicar migrations no ambiente de teste. A saúde de processo atual não testa banco; uma verificação de prontidão futura deverá ter semântica própria. [Guia oficial da CLI Supabase](https://supabase.com/docs/guides/local-development/cli/getting-started).
