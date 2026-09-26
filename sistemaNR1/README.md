# sistemaNR1 — MVP

SaaS acadêmico: **estrutura organizacional → coleta protegida → avaliação fundamentada → inventário integrado, PDF e histórico**. Exclusivamente dados fictícios. **E0 concluída e testada. E1 parcial:** cadastro de usuários/perfis/vínculos preparado, com migração ainda não aplicada. Os 21 requisitos M1–M3 continuam pendentes.

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
supabase/migrations/         # migração C0 preparada, não aplicada
supabase/tests/              # testes SQL preparados, não executados
tests/                      # integração no navegador
```

Supabase CLI e SDKs instalados; projeto remoto vinculado e conexão confirmada por consulta SQL constante, sem aplicar migrações. Variáveis locais estão nos arquivos ignorados pelo Git, e a chave secreta fica somente no backend. [Relatório da conexão](docs/validacao/conexao-supabase.md). A atualização posterior autorizou preparar o cadastro C0, mantendo a proibição de aplicar migrações. A ausência de chaves continua não impedindo E0; procedimento em [instalação](docs/ambiente/instalacao.md).

### Cadastro C0 preparado

Nome completo no perfil; e-mail/senha no Supabase Auth; matrícula, papel e lotação no vínculo por empresa. Gestor autorizado cria conta ou associa conta existente com matrícula independente. Credenciais existentes não são alteradas ao criar outro vínculo. Respostas anônimas M1 não recebem identidade nominal.

A funcionalidade ainda precisa da migração revisada, bootstrap controlado de empresa/gestor e `DATABASE_URL` de um login PostgreSQL NOSUPERUSER/NOBYPASSRLS, membro de `sistemanr1_api`, com TLS validado e sem propriedade das tabelas. **Não executar migrações sem autorização.** Não usar `postgres` ou chave de serviço como acesso geral ao banco. Novas contas Auth são criadas sem confirmar artificialmente o e-mail; ativação deve seguir procedimento administrativo controlado. [Evidências e limites do recorte](docs/evidencias/c0-usuarios.md).

Evidências: [diagnóstico e versões](docs/ambiente/diagnostico.md), [instalação detalhada](docs/ambiente/instalacao.md), [SPEC E0](specs/fundacao/e0.spec.md) e [relatório dos testes e builds](docs/validacao/relatorio-e0.md).

## Comece por aqui

- [SPEC do produto](specs/produto.spec.md) e [Camada 0](specs/camada-0/estrutura-organizacional.spec.md).
- [Matriz dos 21 requisitos](docs/matriz-rastreabilidade.md): links para cada SPEC, origem, dependências e cenários.
- [Backlog do MVP](docs/backlog-mvp.md): etapas E0–E8 e roteiro completo de demonstração.
- [Arquitetura](docs/arquitetura/visao-geral.md), [modelo de domínio](docs/arquitetura/modelo-dominio.md), [contratos](docs/arquitetura/contratos-modulos.md) e [decisões](docs/arquitetura/decisoes.md).
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
  camada-0/estrutura-organizacional.spec.md
  m1-coleta/                  # 7 SPECs
  m2-avaliacao/               # 8 SPECs
  m3-inventario/              # 6 SPECs
```

Histórico: a Missão 01 entregou a estrutura documental acima; a Missão 02 acrescentou a fundação E0 sem alterar as 21 SPECs. Próxima etapa: E1, banco de dados, autenticação e isolamento entre empresas conforme a Camada 0. Assinatura real, metodologia para uso real, custódia de longo prazo e validação profissional permanecem pendentes. M4–M6 não foram especificados. Este projeto não constitui certificação jurídica ou PGR completo.
