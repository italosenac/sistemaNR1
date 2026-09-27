# Desenvolvimento orientado por especificações

## Fluxo de trabalho

1. Selecionar RF pelo backlog e ler PDF/página, SPEC, contratos e dependências de estado. Distinguir fonte documental, normativa e decisão técnica. Se fonte essencial estiver ausente/ilegível, interromper sua extração e registrar; não reconstruir do resumo.
2. Confirmar escopo autorizado da tarefa. Para implementação futura, produzir plano breve por caso de uso e listar critérios CA a cobrir. Uma dependência em rascunho não precisa estar publicada para construir o rascunho dependente.
3. Escrever testes de aceitação correspondentes ao comportamento esperado, incluindo ao menos os bloqueios relevantes. Demonstrar falha inicial quando for útil para provar reprodução; não exigir teste artificial para mera formatação documental.
4. Implementar o menor fluxo que satisfaça a SPEC. Regras no domínio; transações/autorização na aplicação; integrações atrás de portas. Não adaptar requisitos para fazer teste passar.
5. Executar testes apropriados, typecheck/lint/build conforme scripts existentes. Integração transacional e RLS precisa de banco de teste; registrar pendência se não houver ambiente, sem fingir sucesso.
6. Conferir critérios positivos/negativos, regressões pertinentes, saídas de privacidade e documentação. Revisão Clean Code quando a mudança justificar ou for solicitada.
7. Registrar evidências e atualizar SPEC/matriz. Informar limitações e RFs parciais. Concluir apenas quando nenhum critério necessário estiver sem implementação/teste relevante.

## Rastreabilidade de evidência

Na etapa de implementação, criar `docs/evidencias/<rf>-<data>.md` contendo requisito/revisão, cenário CA, teste/arquivo, comando literal executado, ambiente sintético, data, exit code, resultado e limitações. Identificar commit quando houver; caso contrário, registrar estado do workspace sem inventar hash. Não copiar segredos ou respostas nos relatórios.

Estados: **Pendente** (nada implementado), **Em desenvolvimento**, **Parcialmente implementado** (subconjunto funcional com faltas explícitas), **Concluído e testado** (critérios atendidos com evidências reais). Estado de negócio da campanha/documento e estado de implementação do RF são conceitos distintos.

## Alterações de especificação

Registrar requisito/fonte afetados, motivo, tipo da mudança, critérios/testes impactados e decisão. Nova interpretação normativa vai para conformidade/pendências; não substituir requisito original silenciosamente. Nova decisão técnica vai para ADR e SPEC. Uma escolha [ARQ] já aceita para demonstração não necessita nova confirmação a cada uso.

Matriz de rastreabilidade é índice, SPEC descreve comportamento, backlog define ordem. Evitar três definições divergentes do mesmo bloqueio. A validação documental desta fase verifica estrutura/cobertura/referências; não prova execução de testes do aplicativo.

Validação atual: `python docs/validacao/validar-documentacao.py`. O verificador ignora dependências/saídas geradas, confere as 21 SPECs, suporte C0, quatro papéis documentados, hashes dos PDFs e links. `--fase-documental-inicial` preserva a checagem histórica de ausência de aplicativo, que deve falhar no workspace E0/C0 atual. Missão A é auditoria documental: código/SQL anteriores são preservados, lacunas ficam no backlog, e a próxima implementação exige novo prompt/permissão solicitados pelo usuário.

## Uso das Skills

Implementação: `implementar-requisito`. Validação de travas/completude: `validar-regra-negocio`. Revisão/refatoração: `revisar-codigo-limpo`. Não carregar todas por padrão. Exemplo de próxima tarefa: implementar E0 do backlog mantendo dados fictícios, sem banco remoto ou deploy, e registrar testes efetivamente executados.
