---
name: validar-regra-negocio
description: Validar regras e bloqueios do sistemaNR1 contra as SPECs, com testes negativos e evidências. Usar em auditoria funcional, investigação de divergência ou revisão do estado de conclusão de requisitos.
---

# Validar regra de negócio

Identificar RF, operação e escopo solicitado. Ler sua SPEC, [matriz](../../../docs/matriz-rastreabilidade.md) e regras transversais pertinentes em [segurança](../../../docs/arquitetura/seguranca-privacidade.md). Usar [AGENTS.md](../../../AGENTS.md) como instrução permanente. Se ainda não existir aplicativo, validar apenas documentação e informar que não há evidência funcional.

## Procedimento

1. Relacionar cada regra de bloqueio e critério CA ao ponto real que o aplica. Conferir domínio, caso de uso, API/persistência e saídas relevantes; validação de tela isolada não basta.
2. Verificar testes existentes pelo comportamento, não pelo nome do arquivo. Criar/executar casos negativos faltantes dentro do escopo da validação autorizada, somente com dados fictícios.
3. Examinar fronteiras ligadas ao RF: 6/7 respostas e k maior; complementos/filtros; mesmo token concorrente; rollback; critério incompleto; consequência ausente/menor; override sem justificativa; risco evidente sem medida; AEP/AET nulo versus nenhuma; nove alíneas; inventário isolado; sobrescrita/retorno de versão; exclusão antecipada; assinatura de outra versão.
4. Conferir isolamento entre empresas e equivalência de proteção entre API, tela e exportação quando a regra atingir esses canais. Não consultar respostas reais para provar proteção.
5. Registrar evidência de comando, resultado, cenário e localização da falha. Classificar diferença entre implementação e SPEC sem alterar a SPEC para legitimar o defeito.
6. Se houver autorização para correção, corrigir no escopo e repetir os testes afetados. Em revisão somente, produzir achados com impacto e reprodução; não alterar comportamento sem pedido.

## Conclusão e limites

Relatar por regra: atendida com evidência, divergente ou sem evidência. Usar **Concluído e testado** somente quando testes relevantes efetivamente executados comprovarem os critérios. Um teste mockado de repositório não comprova concorrência, RLS ou retenção no banco. Um PDF gerado não comprova assinatura formal. Não marcar custódia por décadas como comprovada por unidade de tempo simulado.

Atualizar SPEC/matriz quando a tarefa incluir manutenção do estado; se detectar conclusão sem evidência, corrigir esse estado com justificativa e apontar faltas. Fluxo de evidência em [SDD](../../../docs/desenvolvimento-sdd.md). Não criar requisito novo, contornar bloqueio, executar migração destrutiva ou conectar serviço externo por efeito desta Skill.
