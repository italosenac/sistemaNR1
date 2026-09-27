# Compatibilidade do PDF complementar com o MVP

Fonte lida integralmente: [arquitetura-schemas.pdf](../fontes/arquitetura-schemas.pdf), 5 páginas. [Extração](../extracao/arquitetura-schemas.md) e [hash/paginação](../extracao/manifesto-arquitetura.json). Os três PDFs M1/M2/M3 e suas 21 SPECs continuam sendo a origem funcional; nenhum foi substituído.

## Hierarquia e classificação

| Classificação | Uso nesta revisão |
| --- | --- |
| REQUISITO ORIGINAL — [DOC] | RFs e travas dos três PDFs de negócio; permanecem nas 21 SPECs |
| DECISÃO ARQUITETURAL — [ARQ] | Auth, vínculos, atribuições, FKs compostas, JSONB seletivo e regras técnicas; não são obrigação normativa |
| COMPLEMENTO DE MODELAGEM — [MOD] | Entidades/campos efetivamente localizados no PDF complementar; aceitos somente após confronto com RFs e missão |
| PROPOSTA FUTURA — [FUT] | M4/M5/M6 e evoluções sem especificação funcional; não autorizam tabelas, endpoints ou telas agora |

[MISSÃO] identifica determinações do usuário, inclusive mudanças que corrigem o próprio PDF complementar. [NORMA] permanece reservada a consultas normativas documentadas; não atribuir esse caráter ao esquema. [PEND] registra lacunas. Fonte e página são informadas em cada linha a seguir.

## Todas as 18 tabelas apresentadas no PDF

“Descartado” significa não adotar aquela representação/semântica; o PDF original permanece intacto. Todos os acréscimos não presentes no PDF estão identificados como adaptação.

| Origem / página | Correspondência no projeto | Campos aproveitados | Campos adaptados/acrescentados | Campos/semântica descartados | Justificativa | Módulo | Implementação prevista |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `empresas`, p.1 | Empresa | UUID, razão social, fantasia, CNPJ, e-mail, telefone | Status/datas; contatos opcionais e CNPJ sintético/opcional no MVP | Obrigatoriedade de documento real | Cadastro organizacional sem coletar dados reais por conveniência | C0 | E1 |
| `estabelecimentos`, p.1 | Estabelecimento | UUID, nome, empresa | Descrição/endereço opcional, caracterização, status, FK composta | Nenhum campo | Compartilhar a mesma entidade entre módulos | C0 | E1 |
| `setores`, p.1 | Setor | UUID, nome, estabelecimento | Empresa explícita, descrição, status, FK empresa/estabelecimento | Inferir isolamento só pelo id do setor | Impedir referência cruzada e facilitar RLS | C0 | E1 |
| `usuarios`, p.1 | Auth + Perfil + Vínculo + Atribuição + Lotação + identificação profissional | UUID, nome, status; identificação profissional quando necessária | E-mail/credenciais em Auth; matrícula por empresa; vários vínculos/papéis; lotação por vínculo | `senha_hash` própria, empresa única/perfil global, papel global único, CPF indiscriminado | A mesma pessoa pode atuar em vários clientes; usuário identificado não é respondente M1 | C0 | E1; habilitação/assinatura real depende P-06/P-09 |
| `campanhas_coleta`, p.2 | Campanha | UUID, estabelecimento, meta, estado | Empresa, janela/fuso, grupos congelados, instrumento/canal; meta percentual 0–100 das SPECs | Converter silenciosamente 0.8 em 80; estados aberta/tabulada como substitutos das transições existentes | RF-01.2/5/6 exigem condições não presentes no quadro resumido | M1 | E2 |
| `respostas_agregadas`, p.2 | FotografiaDeAgregacao / ResultadoAgregado | UUID, campanha, grupo/escopo | Versão, fator, k, partição, estado publicável/suprimido e ancestral efetivo; n interno protegido | `n_respostas` público obrigatório; leitura de n≥7 como garantia absoluta ou bloqueio de toda consolidação | RF-01.3 permite ancestral seguro e exige proteger complementos; não substituir respostas protegidas por esta tabela | M1 | E2/E6 |
| `indicadores_objetivos`, p.2 | IndicadorComplementar | Tipo, valor | Unidade, fonte, período, setor, empresa, revisão; incluir horas extras e contagens CIPA; precisão numérica apropriada | Restrição a dois tipos e importação de RH como requisito obrigatório | RF-01.7 exige procedência e veda denúncia nominal | M1 | E6, insumo disponível ao fluxo anterior quando implementado |
| `matrizes_risco`, p.2 | CriterioAvaliacao / VersaoCriterio / MatrizRisco / CelulaMatriz | UUID; configuração de severidade/probabilidade | Configuração JSONB validada e versionada, células/faixas/decisões completas, aprovação/data/documento | Matriz mutável usada retrospectivamente por avaliações | RF-02.1/8 e critérios anteriores ao cálculo | M2 | E3 |
| `perigos_biblioteca`, p.2 | PerigoBibliotecaVersao | UUID, fator, fontes; procedência do exemplo | Empresa, descrição, circunstâncias, agravos, revisão; cópia contextualizada por empresa | `is_custom` como permissão global ou compartilhamento de conteúdo empresarial | RF-03.2 continua proprietário; M2 pode referenciar/cadastrar perigo sem dependência circular | M3, usado por M2 | E6; perigo completo manual em E3 |
| `riscos_avaliados`, p.2 | AvaliacaoDeRisco + MemoriaDeCalculo + Consequencia + Decisao/JustificativaOverride | UUID, escopo/perigo, memória | Grupo efetivo, empresa, versão do critério, fotografia M1, S/P/fundamentos, consequências, decisão e justificativa; memória JSONB imutável | Enum fixo trivial/tolerável/intolerável; média do questionário como P automática | Preservar oito RFs M2 e faixas acadêmicas versionadas de ADR-03 | M2 | E3/E6 |
| `inventarios_versoes`, p.3 | Inventario / InventarioVersao / ArtefatoDocumental / EvidenciaDeAssinatura | UUID, estabelecimento, referência a ciclo, responsável, hash e arquivo | Empresa, inventário estável, número/autor/data/diferenças, nove alíneas, referências e estados; objeto privado | “Assinatura SHA-256”; URL pública; um PDF como todo o inventário | Hash confere integridade; RF-03.1/3/4/5/6 exigem conteúdo, integração e histórico | M3 | E4/E5; assinatura formal após P-06 |
| `acoes`, p.3 | Ação futura | UUID, risco de origem, frente, responsável, status | Escopo empresa e responsável por vínculo autorizado; validar futura hierarquia/fluxo em SPEC | Assumir que o quadro já especifica M4; ligar ação pessoal à resposta anônima | Registro mínimo de medida em M2 não equivale ao plano completo | M4 | Após especificação, fora da E1 |
| `evidencias`, p.3 | Evidência de ação futura | UUID, ação, arquivo | Empresa, objeto privado e acesso por autorização; retenção própria a definir | URL pública ou garantia automática de execução por anexo | Requer requisitos de M4 e governança | M4 | Após especificação |
| `ciclos`, p.4 | CicloReferencia | UUID, estabelecimento | Empresa, início, encerramento previsto e status; vínculo opcional do inventário; sem automação | Prazo fixo calculado de 2/3 anos como regra já validada | Referência conceitual útil; fluxo completo e gatilhos pertencem ao futuro M5 | Suporte M2/M3; M5 futuro | Dependência conceitual em E3/E4; máquina M5 fora da E1 |
| `afericoes_eficacia`, p.4 | Aferição de eficácia futura | UUID, ação, resultado | Empresa, método/evidência e critérios a especificar | Eficaz encerra/ineficaz reabre automaticamente sem SPEC | Não alterar classificação histórica nem implementar reavaliação por inferência | M5 | Após especificação |
| `trilha_auditoria`, p.4 | EventoDeAuditoria | UUID, ator administrativo, diferenças estruturadas | Empresa, ação/recurso/versão, data/motivo e proteção append-only; JSONB sanitizado | Logs de credenciais/respostas ou vínculo operador↔resposta | Auditoria transversal já requerida em C0/M2/M3 independe do módulo M5 | Transversal; M5 futuro | E1 permissões; E3/E4 decisões/versões; M5 depois |
| `comunicados`, p.4 | Comunicado futuro | UUID, inventário/versão, setor, devolutiva | Empresa, conteúdo aprovado, destinatários/escopo a especificar | Divulgação que ignore supressão ou atravesse empresas | Proposta M6 não substitui divulgação protegida já prevista em M1 | M6 | Após especificação |
| `recibos_ciencia`, p.4 | Recibo de ciência futuro | UUID, comunicado; possível destinatário nominal | Requisitos de identificação, minimização e retenção ainda pendentes | IP obrigatório e leitura tratada automaticamente como assinatura/evidência legal suficiente | P-09 e SPEC M6; nunca usar recibo para identificar respondente M1 | M6 | Após especificação |

## Omissões do quadro e divergências resolvidas

O PDF não enumera tabelas próprias de função, turno, grupo, questionário/pergunta, token, resposta protegida, registro de consulta, consequência ou diferenças do inventário. Elas continuam necessárias conforme as SPECs; ausência no quadro não autoriza eliminá-las. A missão acrescenta a separação de lotação/atribuições e os estados/datas cadastrais.

M1 mantém campanha → grupos, instrumento/perguntas, código único por grupo sem destinatário, resposta sem tokenId/identidade, indicadores e registro documental. Resultado agregado é uma projeção versionada da fotografia, não resposta nominal nem um atalho para expor contagem suprimida.

M2 mantém identidade do critério e versões separadas, matriz/células, avaliação, memória, consequências e decisão com justificativa. JSONB serve para configuração estruturada e snapshot da memória; empresa, grupo, versão do critério, documento e demais FKs ficam relacionais. Validação de schema, cobertura das células, atomicidade e imutabilidade continuam obrigatórias. Não substituir consequências consultáveis ou atribuições de papel por JSON opaco.

M3 mantém perigo, fonte, circunstância, agravo, grupo exposto, medidas, inventário estável, versões, diferenças, documentos e assinaturas. Ciclo é referência de empresa/estabelecimento, não implementação de agenda/reavaliação M5. Versão consolidada preserva responsável técnico designado, data, número e artefatos com hash/caminho privado; assinatura tem estado/evidência/bytes próprios e P-06 continua aberta.

O fluxograma da p.5 é contextual. Não impõe uma cadeia de implementação rígida: rascunhos continuam possíveis antes da publicação dos insumos; perigo manual de M2 não depende da biblioteca M3; M3 não recalcula; risco geral integrado não depende de questionário psicossocial para existir. Não adotar promessas de conformidade, retenção ou rastreabilidade “garantidas” pelo desenho.

Nenhum RF original foi alterado. As mudanças são registradas em ADR-13/14 e nas SPECs de suporte C0, preservando a origem de cada escolha.
