# sistemaNR1 — arquitetura e especificação do MVP

Preparação documental de um SaaS acadêmico: **estrutura organizacional → coleta protegida → avaliação fundamentada → inventário integrado, PDF e histórico**. Exclusivamente dados fictícios. Frontend, backend e banco **ainda não foram implementados**.

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

Próxima etapa: implementar E0 com Next.js App Router/NestJS strict/pnpm, seguindo as SPECs e registrando testes executados. Não há comando de inicialização do aplicativo nesta entrega. Assinatura real, metodologia para uso real, custódia de longo prazo e validação profissional permanecem pendentes. M4–M6 não foram especificados. Este projeto não constitui certificação jurídica ou PGR completo.
