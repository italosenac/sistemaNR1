# sistemaNR1 — MVP

SaaS acadêmico: **estrutura organizacional → coleta protegida → avaliação fundamentada → inventário integrado, PDF e histórico**. Exclusivamente dados fictícios. **E0 concluída e testada. E1 parcialmente implementada:** Camada 0 funcional no Supabase local e remoto; cinco cenários remotos com fixtures passaram, mas o cadastro público e a entrega de e-mail remoto não foram validados. O cliente usa TLS verificado até o pooler; `pg_stat_ssl` indicou TLS inativo na conexão backend. Os 21 requisitos M1–M3 continuam pendentes.

**Missão E1: Camada 0 implementada.** A identidade usa Auth, perfil global, vínculos por empresa, atribuições de papéis e lotação separada. Matrícula é opcional e única quando preenchida. A migração consolidada foi aplicada no projeto remoto. O usuário aceitou TLS verificado até o pooler apenas para o MVP fictício; isso não comprova TLS de ponta a ponta nem autoriza dados pessoais reais. [Relatório E1](docs/validacao/relatorio-e1.md).

## Executar localmente

Requisitos: Node.js **24.19.0 LTS**, pnpm **12.6.0** e Git. No PowerShell:

```powershell
Set-Location 'C:\Users\italo\OneDrive\Documents\MVP\sistemaNR1'
pnpm.cmd install --frozen-lockfile
pnpm.cmd dev
```

- Página: [http://localhost:3000](http://localhost:3000).
- API: [http://localhost:3001/health](http://localhost:3001/health).
- Swagger em desenvolvimento: [http://localhost:3001/api/docs](http://localhost:3001/api/docs).
- Usuários e vínculos: [http://localhost:3000/usuarios](http://localhost:3000/usuarios). Persistência depende da preparação de banco descrita abaixo.

`Ctrl+C` encerra os processos. As portas 3000 e 3001 devem estar livres. A raiz Git existente fica em `MVP`; não executar `git init` dentro deste projeto.

Os valores padrão permitem iniciar sem credenciais ou arquivos `.env`. Para personalizar, copie os modelos somente quando o destino não existir:

```powershell
if (-not (Test-Path 'apps/web/.env.local')) { Copy-Item 'apps/web/.env.example' 'apps/web/.env.local' }
if (-not (Test-Path 'apps/api/.env')) { Copy-Item 'apps/api/.env.example' 'apps/api/.env' }
```

`NEXT_PUBLIC_API_URL` aponta para a API; `PORT` e `FRONTEND_URL` controlam porta e origem CORS. Usar a origem exata, sem barra final. Variáveis `NEXT_PUBLIC_*` são públicas e incorporadas ao build. Chaves secretas ficam somente no backend. Reiniciar após alterar configuração.

## Comandos de desenvolvimento e validação

```powershell
pnpm.cmd dev:web       # frontend, após compilar contratos
pnpm.cmd dev:api       # backend, após compilar contratos
pnpm.cmd typecheck
pnpm.cmd lint
pnpm.cmd test          # API e navegador com dados fictícios
pnpm.cmd test:api
pnpm.cmd test:e2e
pnpm.cmd preparar:integracao # somente Supabase local isolado
pnpm.cmd test:rls           # somente Supabase local, rollback das fixtures
pnpm.cmd test:integracao    # Auth, API, banco e navegador locais
pnpm.cmd build        # contratos antes das aplicações
pnpm.cmd format
pnpm.cmd format:check
```

Os testes Playwright iniciam e encerram seus próprios servidores nas portas **3100/3101**, com saída Next em `.next-e2e` e identidade fictícia; não usam o projeto Supabase remoto. No Windows utilizam Microsoft Edge instalado, sem abrir janela. Em outro sistema, executar antes `pnpm.cmd exec playwright install chromium` (usar `pnpm` fora do Windows). A API usa ESM e o Jest usa `--experimental-vm-modules`, conforme sua documentação; o aviso experimental permanece visível. Testes SQL de RLS estão preparados separadamente e não são executados por `pnpm test`.

Builds locais de produção, em terminais separados, depois de `pnpm.cmd build`:

```powershell
# Terminal da API
$env:NODE_ENV = 'production'
pnpm.cmd --filter @sistemanr1/api start:prod
# Terminal do frontend
pnpm.cmd --filter @sistemanr1/web start
```

Swagger não é registrado em `NODE_ENV=production`. Para voltar ao desenvolvimento no mesmo terminal, usar `$env:NODE_ENV = 'development'`.

## Estrutura implementada e Supabase

```text
apps/web/                    # Next.js App Router, Tailwind e shadcn/ui
apps/api/src/
  dominio/                   # regras de lotação e erros de usuário
  aplicacao/                 # cadastro/vínculo e portas de identidade/persistência
  infraestrutura/            # Supabase Auth, PostgreSQL restrito e configuração
  apresentacao/              # saúde, DTOs, autenticação e controllers
packages/contratos/          # saúde e contratos de usuários, compilados em dist/
supabase/config.toml         # configuração local da CLI
supabase/migrations/         # migração C0 consolidada, aplicada no projeto autorizado
supabase/tests/              # testes SQL de RLS locais
tests/                       # regressão e integração de navegador
```

Supabase CLI e SDKs instalados; projeto remoto vinculado, migração autorizada aplicada e schema verificado. Variáveis locais estão nos arquivos ignorados pelo Git, e a chave secreta e `DATABASE_URL` ficam somente no backend. [Conexão](docs/validacao/conexao-supabase.md) e [validação E1](docs/validacao/relatorio-e1.md) registram os testes e limites. A validação local continua reproduzível.

### Cadastro C0 implementado localmente

Nome completo no perfil; e-mail/senha no Supabase Auth; matrícula, papel e lotação no vínculo por empresa. Gestor autorizado cria conta ou associa conta existente com matrícula independente. Credenciais existentes não são alteradas ao criar outro vínculo. Respostas anônimas M1 não recebem identidade nominal.

A funcionalidade usa bootstrap controlado de empresa/gestor e um login PostgreSQL NOSUPERUSER/NOBYPASSRLS membro de `sistemanr1_api`, sem propriedade das tabelas. A conexão remota desse login foi validada com TLS, CA e hostname até o pooler; a conexão backend observada retornou `pg_stat_ssl.ssl = false`. Não repetir a migração remota nem usar `postgres` ou chave de serviço como acesso geral ao banco. A confirmação Auth por link de fixture foi testada remotamente; o cadastro público e a entrega de e-mail ainda não foram validados no remoto. [Execução da Camada 0](docs/arquitetura/execucao-camada-zero.md).

A interface usa `trabalhador`, `gestor_sst_rh`, `responsavel_tecnico` e `consultoria`, com matrícula opcional e lotação separada. [Permissões](docs/arquitetura/matriz-permissoes.md) e [isolamento](docs/arquitetura/isolamento-multiempresa.md) são reforçados no Nest e no banco local. Consultoria só acessa sua carteira autorizada. Conta pessoal de trabalhador não identifica respostas anônimas.

Evidências: [diagnóstico e versões](docs/ambiente/diagnostico.md), [instalação detalhada](docs/ambiente/instalacao.md), [SPEC E0](specs/fundacao/e0.spec.md) e [relatório dos testes e builds](docs/validacao/relatorio-e0.md).

## Comece por aqui

- [SPEC do produto](specs/produto.spec.md) e [Camada 0](specs/camada-0/estrutura-organizacional.spec.md).
- [Matriz dos 21 requisitos](docs/matriz-rastreabilidade.md): links para cada SPEC, origem, dependências e cenários.
- [Backlog do MVP](docs/backlog-mvp.md): etapas E0–E8 e roteiro completo de demonstração.
- [Arquitetura](docs/arquitetura/visao-geral.md), [modelo de domínio](docs/arquitetura/modelo-dominio.md), [contratos](docs/arquitetura/contratos-modulos.md) e [decisões](docs/arquitetura/decisoes.md).
- [Identidade multiempresa](docs/arquitetura/modelo-identidade.md) e [compatibilidade das 18 tabelas do PDF complementar](docs/arquitetura/compatibilidade-schemas.md).
- [Segurança e privacidade](docs/arquitetura/seguranca-privacidade.md), [padrões de código](docs/arquitetura/padroes-codigo.md) e [planejamento MCP](docs/arquitetura/integracoes-mcp.md).
- [Leitura integral dos PDFs](docs/extracao/relatorio-leitura.md), [verificação NR-1](docs/conformidade/verificacao-nr1.md) e [pendências](docs/pendencias.md).
- [Instruções do agente](AGENTS.md), [processo SDD](docs/desenvolvimento-sdd.md) e [validação documental](docs/validacao/relatorio.md).

## Estrutura documental

```text
AGENTS.md
README.md
.agents/skills/
  implementar-requisito/SKILL.md
  validar-regra-negocio/SKILL.md
  revisar-codigo-limpo/SKILL.md
docs/
  fontes/                     # M1.pdf, M2.pdf, M3.pdf originais
  extracao/                   # transcrições, hashes, relatório e 8 prévias
  arquitetura/                # visão, modelo, contratos, ADRs, código, segurança e MCP
  conformidade/verificacao-nr1.md
  validacao/                  # verificação estrutural e evidências documentais
  backlog-mvp.md
  matriz-rastreabilidade.md
  desenvolvimento-sdd.md
  pendencias.md
specs/
  produto.spec.md
  camada-0/                   # estrutura-organizacional e usuarios-perfis
  m1-coleta/                  # 7 SPECs
  m2-avaliacao/               # 8 SPECs
  m3-inventario/              # 6 SPECs
```

Histórico: a Missão 01 entregou a estrutura documental acima; a Missão 02 acrescentou a fundação E0 sem alterar as 21 SPECs. A E1 implementou a Camada 0 e passou nos testes remotos de negócio com fixtures, mas o cadastro público/entrega de e-mail remoto e o encerramento limpo da regressão Playwright permanecem sem evidência suficiente para conclusão. Assinatura real, metodologia para uso real, custódia de longo prazo e validação profissional permanecem pendentes. M4–M6 não foram especificados. Este projeto não constitui certificação jurídica ou PGR completo.
