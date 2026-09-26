---
name: implementar-requisito
description: Implementar um requisito do sistemaNR1 a partir de sua SPEC, com testes de aceitação e rastreabilidade. Usar quando a tarefa pedir implementação de um RF; não iniciar código em tarefas apenas documentais.
---

# Implementar requisito

Receber identificador do RF ou localizar o requisito inequívoco em [matriz de rastreabilidade](../../../docs/matriz-rastreabilidade.md). Se houver ambiguidade material, avançar na análise comum e pedir somente a definição faltante. Não ampliar o escopo para outros módulos.

## Contexto obrigatório

Ler [AGENTS.md](../../../AGENTS.md), a SPEC individual em `specs/`, os critérios CA e dependências pertinentes. Consultar [contratos](../../../docs/arquitetura/contratos-modulos.md) ao atravessar módulos e [decisões](../../../docs/arquitetura/decisoes.md) para escolhas demonstrativas. Caminhos de código serão os existentes no repositório, não presumir scaffold já criado.

## Fluxo SDD

1. Identificar fonte/página, regras de negócio e bloqueios. Distinguir [DOC], [NORMA], [MISSÃO], [ARQ] e [PEND]. Não substituir regra documental por conveniência técnica.
2. Identificar dependências **por estado**: rascunho de campanha precede publicação; rascunho de matriz precede PDF/aprovação. Planejar o recorte implementável e seus cenários, usando o backlog.
3. Escrever testes de aceitação positivos e negativos para as regras alteradas antes da implementação. Para concorrência, RLS e transações, planejar integração real com ambiente sintético; mock não comprova a garantia.
4. Implementar casos de uso e domínio separados de infraestrutura/controllers. Seguir nomes em português brasileiro e TypeScript strict. Aplicar privacidade no backend e em todas as saídas.
5. Executar testes relevantes e comandos de lint/typecheck/build que de fato existirem. Se ambiente impedir execução, informar comando/falha e manter conclusão pendente ou parcial; não inventar resultado.
6. Revisar aceitação contra a SPEC. Registrar evidências conforme [processo SDD](../../../docs/desenvolvimento-sdd.md), atualizar estado da SPEC e matriz juntas. Relatar mudança, validação e faltas concretas.

## Invariantes do projeto

Usar somente dados fictícios. M1 não entrega respostas individuais ao M2. Token pertence ao grupo e é consumido uma única vez em transação. Critérios são anteriores ao cálculo; resultado não existe sem memória. Consolidado não é sobrescrito. Aprovação acadêmica/hash/campo de assinatura não equivalem a assinatura formal. Cumprir travas mesmo em recorte demonstrativo.

Pendência de metodologia ou assinatura real não impede implementar o recorte acadêmico já descrito, mas impede marcá-lo como solução real completa. M4–M6 aguardam especificação. Esta Skill não autoriza conexões externas, deploy, merge, mensagens ou banco destrutivo. Respeitar a autorização já existente para implementação local sem pedir confirmação repetida.

## Resultado esperado

Funcionalidade correspondente à SPEC, cenários testados com evidências e rastreabilidade atualizada. Se faltarem critérios, declarar **Parcialmente implementado** com o que falta; **Concluído e testado** exige evidência de todos os comportamentos relevantes.
