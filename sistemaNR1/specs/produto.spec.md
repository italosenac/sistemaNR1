# Produto — MVP acadêmico de gestão de riscos ocupacionais

## Origem e autoridade

[MISSÃO] SaaS acadêmico com foco em fatores psicossociais relacionados ao trabalho. A Missão 01 foi documental; E0 está concluída e há um recorte C0 parcial. A Missão A atual consolida arquitetura, sem implementar banco ou aplicar migrações. Fontes funcionais: [M1](../docs/fontes/M1.pdf), [M2](../docs/fontes/M2.pdf), [M3](../docs/fontes/M3.pdf), conforme [leitura](../docs/extracao/relatorio-leitura.md). O [PDF de schemas](../docs/fontes/arquitetura-schemas.pdf) é referência complementar, subordinada aos 21 RFs e às adaptações explícitas da missão.

| Etiqueta | Significado | Tratamento |
| --- | --- | --- |
| [DOC] | Regra extraída dos PDFs | Preservar fonte, página e bloqueio |
| [MISSÃO] | Determinação explícita do usuário | Ex.: stack, dados fictícios e escopo documental |
| [NORMA] | Complemento ou constatação da consulta oficial | Usar somente com fonte e limite da verificação |
| [ARQ] | Decisão técnica do MVP | Pode evoluir com decisão registrada e atualização da SPEC |
| [PEND] | Lacuna ou hipótese ainda não validada | Não apresentar como requisito original nem como resolvida |
| [MOD] | Complemento de modelagem do novo PDF | Confrontar com RFs; registrar campos aproveitados/adaptados/descartados |
| [FUT] | Proposta futura M4/M5/M6 | Não equivale a SPEC funcional nem autoriza implementação |

A SPEC é a fonte de verdade da implementação. Os PDFs permanecem a fonte de origem do negócio. Conflito não permite ao agente escolher silenciosamente outra regra: registrar divergência, impacto e decisão na SPEC/ADR. As escolhas explicitamente acadêmicas podem ser implementadas no ambiente demonstrativo. Pendências de uso real bloqueiam produção ou avanço formal, não a preparação da estrutura técnica.

## Objetivo e jornada

**Camada 0 → M1 coleta → M2 avaliação → M3 inventário → PDF e histórico.** A pessoa responde sem identificação nominal. O gestor acompanha somente recortes protegidos. O responsável técnico fundamenta severidade e probabilidade, examina consequências e classifica riscos. O inventário consolida avaliações sem recalculá-las e integra o conteúdo ao inventário geral.

M4 plano de ação, M5 ciclo/acompanhamento e M6 comunicação têm especificação pendente. Não criar suas telas, APIs ou automações. Campos de medida imediata em M2 e estados de impedimento existem exclusivamente para cumprir RF-02.6 e RF-03.6. O inventário acadêmico não é um PGR completo nem certificação legal.

## Atores e limites

Quatro papéis: trabalhador, gestor SST/RH, responsável técnico e consultoria. Uma pessoa possui identidade única e vínculos com papéis distintos ou combinados por empresa. Consultoria acessa carteira explicitamente autorizada, selecionando o contexto sem misturar clientes. Conta pessoal de trabalhador é separada do participante anônimo M1, que não precisa de login. “Leitor autorizado” dos RFs é capacidade restrita, não quinto papel funcional. [Identidade](../docs/arquitetura/modelo-identidade.md) e [matriz de autorização](../docs/arquitetura/matriz-permissoes.md).

## Escopo funcional

21 requisitos individuais: 7 de M1, 8 de M2, 6 de M3, todos **pendentes**. A [estrutura C0](camada-0/estrutura-organizacional.spec.md) e [usuários/perfis](camada-0/usuarios-perfis.spec.md) são suporte adicional, não novos RFs documentais; seu código parcial ainda requer adaptação e prova real de isolamento. Ver [matriz](../docs/matriz-rastreabilidade.md).

## Critérios de aceitação do produto

- **CA-PROD-01:** Dadas duas empresas fictícias, quando seus usuários operam a jornada, então nenhum registro, documento ou agregado atravessa a fronteira entre elas.
- **CA-PROD-02:** Dada uma campanha com alternativa de participação, quando códigos únicos são respondidos e a campanha termina, então documentar a consulta e produzir apenas agregados seguros.
- **CA-PROD-03:** Dado agregado seguro e critério demonstrativo previamente aprovado, quando o técnico informa S/P e consequências, então gerar nível, faixa, decisão e memória reproduzível.
- **CA-PROD-04:** Dadas avaliações e base geral fictícia completas, quando consolidadas, então gerar inventário com a–i e PDF datado, preservando estado sem assinatura formal e bloqueando avanço formal.
- **CA-PROD-05:** Dada versão consolidada, quando houver alteração, então criar nova versão, mostrar diferenças e manter a anterior legível/exportável.

## Restrições transversais

[MISSÃO] Dados exclusivamente fictícios; TypeScript strict; nomenclatura de domínio em português brasileiro; stack definida na [arquitetura](../docs/arquitetura/visao-geral.md). [ARQ] API e domínio aplicam travas, independentemente de validação de tela. Não incluir IA na avaliação de risco ou interpretação de respostas. Codex é ferramenta de desenvolvimento.

## Processo SDD e conclusão

Documento → requisito normalizado → SPEC → critérios de aceitação → testes → implementação → validação → requisito concluído. Estados permitidos: **Pendente**, **Em desenvolvimento**, **Parcialmente implementado**, **Concluído e testado**. Evidência deve informar comando real, data, resultado, cenários e revisão de código quando disponível. Compilação ou revisão documental não substitui teste de negócio.

Uma entrega demonstrativa pode conter RFs parcialmente implementados (especialmente assinatura e retenção operacional) desde que suas travas continuem ativas e as limitações estejam visíveis. Conclusão da preparação documental não altera estado de implementação. Procedimento completo em [desenvolvimento SDD](../docs/desenvolvimento-sdd.md).
