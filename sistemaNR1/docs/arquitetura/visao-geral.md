# Visão geral da arquitetura

## Decisão e escopo

[MISSÃO] Monorepositório com pnpm workspaces. Frontend Next.js App Router, React, TypeScript strict, Tailwind CSS e shadcn/ui. Backend NestJS, TypeScript strict, API REST, Swagger/OpenAPI e Jest. Supabase PostgreSQL, Auth e Storage. Git/GitHub. Vercel para frontend e Render para API. **Essas escolhas são arquiteturais da missão, não exigências dos PDFs.** Versões exatas serão escolhidas e fixadas no lockfile no início da implementação após checar compatibilidade oficial; não há dependências instaladas do aplicativo nesta etapa.

[ARQ] Monólito modular NestJS: uma implantação e um banco, com limites internos explícitos. Sem microsserviços, Redis, broker ou servidor MCP próprio. Processos de exportação idempotentes podem usar registros duráveis no mesmo PostgreSQL; não depender da memória de uma instância gratuita.

```mermaid
flowchart LR
  Pessoa[Participante fictício] --> Web[Next.js / Vercel]
  Gestor[Gestor e técnico] --> Web
  Web --> Auth[Supabase Auth]
  Web --> API[NestJS REST / Render]
  API --> Org[Camada 0]
  API --> M1[M1: coleta e agregação protegida]
  M1 --> M2[M2: critérios e avaliação]
  M2 --> M3[M3: inventário versionado]
  M3 --> Doc[Documentos e auditoria]
  API --> PG[(Supabase PostgreSQL)]
  Doc --> Storage[Supabase Storage privado]
```

## Camadas e direção das dependências

| Camada | Responsabilidade | Restrições |
| --- | --- | --- |
| Domínio | Entidades, valores, invariantes, cálculo e políticas | TypeScript puro; sem NestJS, HTTP, SDK Supabase ou SQL |
| Aplicação | Casos de uso, autorização contextual, transações, portas | Depende do domínio; declara interfaces de repositório, relógio, hash e documentos |
| Infraestrutura | Adaptadores PostgreSQL, Auth, Storage, PDF e logs | Implementa portas; concentra detalhes externos |
| Apresentação | Controllers, DTOs, Swagger e conversão de erros | Sem regras de domínio; chama casos de uso |

Imports apontam para o interior. Módulo NestJS faz composição/injeção; não exportar repositórios internos para outro módulo. Domínio decide a trava, aplicação controla a operação e persistência reforça invariantes críticas. Frontend valida para orientar o usuário; autoridade final permanece no backend.

## Capacidades e proprietários

| Módulo | Responsabilidade e dados próprios | Interfaces principais |
| --- | --- | --- |
| Organizações | Empresa, estrutura, populações e vínculos de acesso | Obter escopo autorizado; congelar estrutura |
| Campanhas | Janela, meta, estados, divulgação, canal e registro de consulta | Criar/publicar/encerrar campanha |
| Anonimato | Tokens, consumo único, supressão, partições e fotografias | Validar participação; obter agregado publicável |
| Questionários | Versão do instrumento, validação e respostas protegidas | Receber resposta sem identidade; fornecer somente ao agregador |
| Indicadores | Valores objetivos, unidade, fonte e período | Registrar/revisar indicador; fornecer procedência |
| Critérios de avaliação | Escalas, matriz, faixas, decisões e aprovação | Publicar versão completa; consultar versão imutável |
| Avaliações | Preliminar, consequências, AEP/AET, cálculo e decisão | Avaliar fator; fornecer pacote para inventário |
| Inventários | Biblioteca, integração geral, a–i, versões/diferenças e retenção | Consolidar; criar revisão; exportar formato aberto |
| Documentos | PDF, objetos privados, hashes e estados de assinatura | Gerar artefato; verificar integridade; autorizar download |
| Auditoria | Eventos administrativos e histórico de operações | Registrar evento sanitizado; consultar trilha autorizada |

Autenticação/autorização são capacidades transversais de suporte; não acrescentam RF documental. Ações futuras M4–M6 não têm módulos implementados ou requisitos inventados.

## Estrutura futura, ainda não criada

```text
apps/
  web/src/app/                 # rotas Next.js e composição de telas
  web/src/funcionalidades/     # fluxos por capacidade
  api/src/modulos/<capacidade>/
    dominio/
    aplicacao/
    infraestrutura/
    apresentacao/
packages/
  contratos/                  # DTOs públicos e schemas; sem entidades de persistência
  configuracao/               # TypeScript/lint compartilhados se houver repetição real
supabase/migrations/          # somente na etapa de implementação
specs/                        # contratos de comportamento
docs/                         # fontes, decisões, evidências e backlog
.agents/skills/               # três fluxos locais do Codex
```

Não criar pacote compartilhado de domínio prematuramente. Em vez de importação cruzada de entidades, usar portas/contratos dos módulos. Nomes obrigatórios `page.tsx`, `layout.tsx`, `Controller`, `Module`, `Request` etc. permanecem conforme APIs.

## Persistência e acesso

[ARQ] Adaptador PostgreSQL com SQL parametrizado e transações explícitas; biblioteca `pg` é a proposta mínima, a confirmar por compatibilidade. Sem ORM obrigatório. Modelagem é conceitual nesta entrega. RLS e privilégios mínimos reforçam isolamento; conexões comuns não usam papel dono do banco nem BYPASSRLS. O NestJS valida JWT e resolve vínculo ativo no servidor. A rota anônima de coleta usa privilégio estrito de consumir código/gravar resposta, sem ler respostas. Ver [segurança](seguranca-privacidade.md).

## Publicação acadêmica futura

Vercel Hobby tem restrição a uso pessoal não comercial; confirmar enquadramento da demonstração antes do deploy. Não assumir que o SaaS comercial poderá permanecer nesse plano. [Documentação Vercel](https://vercel.com/docs/plans/hobby).

Render gratuito pode suspender por inatividade e perde arquivos locais em reinicializações. PDFs devem persistir no Storage e tarefas precisam sobreviver a reinícios. Não prometer disponibilidade de produção. [Documentação Render](https://render.com/docs/free).

Planejar exportação do banco e dos objetos separadamente: backup de banco não inclui bytes dos objetos Storage; plano gratuito requer estratégia própria de backup. A guarda por 20 anos continua pendência operacional. [Backups Supabase](https://supabase.com/docs/guides/platform/backups).

Estas condições foram consultadas em 2026-09-26 e precisam ser reconferidas antes da publicação. Contas, credenciais, regiões, cotas, domínios, custos e deploy não foram configurados. Falhas de rede/PDF não devem avançar estados de negócio.
