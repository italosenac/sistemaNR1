# Instalação e execução — E0 e cadastro C0

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
| API, cadastro C0 | pg 8.23.0; @types/pg 8.23.1; @jest/globals 30.5.2 |
| Ferramentas | TypeScript 5.9.3; ESLint 9.39.5; typescript-eslint 8.70.1; Prettier 3.9.9; Nest CLI 12.0.7; Supabase CLI 2.118.0; concurrently 10.0.5 |
| Testes | Jest 30.5.2; ts-jest 29.4.14; Supertest 7.3.0; Playwright 1.63.0 |

Tipos e dependências auxiliares constam dos quatro manifests e do lockfile. `pnpm.cmd list --recursive --depth 0` lista os valores instalados. E0 preparou SDKs e bibliotecas de formulários; a atualização de C0 utiliza essas dependências no cadastro administrativo em `/usuarios`.

## Variáveis de ambiente

A página inicial e a saúde de E0 funcionam sem arquivos locais. O cadastro C0 depende de Auth, schema preparado e conexão de runtime restrita. Para configurar os arquivos sem sobrescrever os existentes:

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
| SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY / SUPABASE_SECRET_KEY | API; vazias nos exemplos |
| DATABASE_URL | API; conexão de runtime restrita para C0, ausente até provisionamento autorizado |

Os exemplos e testes usam valores fictícios; a conexão posteriormente autorizada usa configurações locais ignoradas pelo Git. Variáveis públicas são incluídas no build Next: nunca colocar chave secreta nelas. `FRONTEND_URL` não aceita `*`, caminho ou barra final; CORS é uma regra do navegador. A API verifica a identidade no Supabase Auth e exige vínculo ativo de gestor na empresa para cadastrar usuários; validação real do banco/RLS ainda depende da aplicação autorizada da migração.

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
- Cadastro administrativo C0: http://localhost:3000/usuarios
- Prefixo das rotas de negócio: /api/v1

```powershell
Invoke-RestMethod -Uri 'http://localhost:3001/health'
pnpm.cmd typecheck
pnpm.cmd lint
pnpm.cmd test
pnpm.cmd build
pnpm.cmd format:check
```

`pnpm test` executa testes HTTP/configuração/cadastro e testes no navegador. Playwright usa servidores próprios nas portas 3100/3101 e diretório `.next-e2e`, com variáveis fictícias que impedem cadastros remotos pelos testes. Windows usa Edge instalado. Fora do Windows, instalar Chromium com `pnpm exec playwright install chromium`. Se Edge estiver ausente no Windows, instalar seu navegador de teste com `pnpm.cmd exec playwright install msedge`. Scripts SQL de RLS são separados e aguardam autorização para migração/teste real.

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

Na entrega E0, a CLI local foi inicializada com `supabase/config.toml`, mantendo migrations vazia e sem conexão remota. **Atualização de 2026-09-26:** projeto informado pelo usuário vinculado pelo CLI, autenticação confirmada e consulta SQL constante bem-sucedida, sem aplicação de migrações. As configurações foram colocadas em `apps/web/.env.local` e `apps/api/.env`, ambos ignorados. Evidências e limites no [relatório da conexão](../validacao/conexao-supabase.md). O pedido posterior autorizou o recorte de usuários C0: integração Auth e SQL de RLS preparados localmente; E1 permanece parcial e Storage não foi implementado. Docker não é necessário para E0.

O projeto de teste já foi indicado pelo usuário e as variáveis locais foram conferidas. Para configuração em outra máquina, login CLI pode ser interativo; não copiar tokens para código, terminal compartilhado ou relatório. Com projeto definido, os comandos são:

```powershell
pnpm.cmd exec supabase login
pnpm.cmd exec supabase link --project-ref REFERENCIA_DO_PROJETO_DE_TESTE
```

Nesta máquina o vínculo foi executado usando a autenticação já disponível, sem novo login interativo. O pedido posterior autorizou preparar usuários/perfis/matrículas/lotação da Camada 0. A proibição de aplicar migrações continua vigente; scripts SQL e código estão preparados, não implantados. Antes de habilitar persistência, revisar a migração e provisionar um login restrito membro de `sistemanr1_api`, preencher `DATABASE_URL` somente no backend e validar isolamento real entre empresas sintéticas. A saúde de processo atual não testa banco; a consulta de conexão foi uma verificação separada. [Guia oficial da CLI Supabase](https://supabase.com/docs/guides/local-development/cli/getting-started).
