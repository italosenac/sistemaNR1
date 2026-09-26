# Contratos entre módulos e API proposta

[ARQ] Contratos de dados conceituais versão `1`. Nomes em português; datas ISO 8601 com UTC, identificadores opacos e valores com unidades explícitas. Ainda não são código nem OpenAPI executável. Nenhum módulo deve ler diretamente tabelas privadas de outro.

## C0 → M1: EscopoDeCampanha

| Campo | Tipo / condição |
| --- | --- |
| empresaId, estabelecimentoId, estruturaVersao | Obrigatórios, derivados/validados no contexto autorizado |
| grupos | Lista de grupoId, setorId, funcaoId/turnoId opcionais e populaçãoEsperada positiva |
| hierarquia | Pai de cada grupo e partição disjunta dentro do escopo |
| fusoHorario | Nome IANA para apresentação; instantes persistidos UTC |

Congelar no momento de publicação. Rejeitar referências cruzadas entre empresas e grupos sobrepostos. Sem cadastro nominal de trabalhadores.

## C0 — Identidade, perfil e vínculo administrativo

Atualização solicitada em 2026-09-26; tipos implementados em [contratos de usuários](../../packages/contratos/src/usuarios.ts), sem mudar os contratos M1–M3.

| Operação implementada | Entrada / saída e autorização |
| --- | --- |
| GET /api/v1/minhas-empresas | Bearer validado no Supabase Auth; somente vínculos ativos do usuário |
| GET /api/v1/empresas/{empresaId}/usuarios/opcoes | Gestor ativo; referências de lotação da empresa |
| GET /api/v1/empresas/{empresaId}/usuarios | Gestor ativo; nome, matrícula, papel e lotação somente da empresa |
| POST /api/v1/empresas/{empresaId}/usuarios | Nome completo, e-mail, senha, matrícula, papel e lotação opcional; gestor ativo antes de criar Auth |
| POST /api/v1/empresas/{empresaId}/vinculos | usuarioId existente, matrícula, papel e lotação; não aceita nome/e-mail/senha e não altera identidade global |

`empresaId` do caminho é uma seleção sujeita a autorização, nunca uma permissão por si só. O ator vem da sessão verificada; propriedades extras de contexto no corpo são recusadas. Senha é campo somente de entrada no Swagger e é encaminhada ao Auth sem persistência própria. Saída `VinculoUsuario` não contém senha/e-mail/token. Matrícula nunca compõe o perfil global.

Auth e PostgreSQL têm commits separados. Se Auth criou identidade, mas o vínculo não foi confirmado, a API retorna `CADASTRO_PARCIAL` e o identificador recém-criado para reconciliação controlada; não remove conta automaticamente, não concede papel por metadado e não afirma que o commit do vínculo foi revertido quando seu resultado é incerto. O endpoint de vínculo permite resolver sem trocar a senha global.

Rotas preparadas dependem de migração aplicada e conexão de runtime restrita, ainda não autorizadas nesta entrega. Os testes HTTP usam portas substituídas e não comprovam RLS.

## M1 → M2: PacoteDeColetaAgregadaV1

| Campo | Tipo / semântica |
| --- | --- |
| empresaId, campanhaId, estruturaVersao | Fronteira e origem imutáveis |
| fotografiaId, versao, encerradaEm | Referência da coleta fechada e de sua divulgação |
| registroConsultaId | Obrigatório; consulta documentada |
| questionarioVersao, demonstrativo | Instrumento e natureza acadêmica |
| politicaPrivacidade | Versão, k ≥ 7, partição divulgável |
| grupos | União discriminada: publicável ou suprimido |
| indicadores | Opcional: setor, tipo, valor, unidade, fonte, período e revisão; somente dados agregados permitidos |

Grupo publicável: `estado=publicavel`, `escopoEfetivo`, `fatorId`, `estatisticasPermitidas`, `metodoAgregacao`. Contagem exata só integra contrato se a política aprovar sua publicação; nunca necessária para revelar célula suprimida. Grupo suprimido: `estado=suprimido`, identificador de escopo e motivo genérico, **sem estatística, contagem, score, faixa, resposta ou texto individual**.

Estatísticas de demonstração: distribuição ou média das respostas fictícias do fator, conforme instrumento versionado. Não equivalem a probabilidade de agravo. M2 não tem acesso ao repositório de respostas. A expressão “dados brutos” de M2 p.3 foi conciliada com a proibição explícita de saída individual de M1 p.2; ver relatório de leitura.

Para publicar fotografia, recalcular grupos efetivos a partir dos registros originais em ambiente restrito; não somar subtotais sobrepostos. M2 bloqueia avaliação conclusiva de recorte suprimido e pode usar apenas ancestral publicável com escopo efetivo declarado. Não transferir valor do pai de volta aos filhos ocultos.

## Critérios → M2: CriterioAplicavelV1

Versão imutável, escalas/descritivos, fórmula identificada, mapeamento total de células/faixas/decisões, data de aprovação, documento/hash e natureza da aprovação. Consumidor verifica aprovação anterior ao cálculo e finalidade demonstrativa ou formal. Matriz incompleta permanece em rascunho e não pode ser retornada como aplicável.

## M2 → M3: PacoteDeAvaliacaoV1

| Campo | Conteúdo |
| --- | --- |
| empresaId, estabelecimentoId, cicloReferencia | Escopo de negócio; ciclo é apenas agrupador, sem implementar M5 |
| avaliacaoId, revisao, fechadoEm | Identidade, revisão e estado de fechamento demonstrativo |
| origens | Fotografia M1, consulta, indicadores efetivamente utilizados, critério/documento/hash |
| perigo | Descrição, fonte e circunstância, grupo efetivamente avaliado |
| consequencias | Determinante, demais possíveis agravos e magnitudes |
| condicoesTrabalho | Exigências da atividade, exposição, medidas existentes e eficácia informada |
| ergonomia | Resposta AEP/AET e referência aos resultados, sem presumir equivalência |
| preliminar | Checklist, risco evidente, medida registrada e situação |
| resultado | S, P, valor numérico, memória, faixa, decisão original/efetiva e justificativa |
| encaminhamentoFuturo | Indicação de necessidade de ação; não representa plano executado |
| finalidade, impedimentosFormais | Demonstrativo e lista de pendências de assinatura/encaminhamento |

Pré-condições: memória existente, consequências válidas, critérios aprovados antes do cálculo, preliminar sem trava de medida ausente, AEP/AET respondida, anonimato validado. M3 ainda valida a–i; pacote M2 sozinho não garante preenchimento do inventário. Mudança de S/P ocorre em nova revisão de M2, nunca dentro de M3.

## M3 → Documentos: SolicitacaoDeArtefatoV1

Entrada: empresa autorizada, inventarioVersaoId, tipo de documento, versão do template e chave de idempotência. O gerador carrega fotografia imutável e confirma integração geral, completude e política de divulgação. Saída: artefatoId, situação, hash dos bytes, data, versão, estado de assinatura e rota protegida de download. Estado sem assinatura é independente de sucesso da geração.

Exportação aberta: manifesto JSON UTF-8, dicionário de campos, itens CSV, versões, diferenças, referências dos critérios e artefatos associados com hashes. Não exportar respostas/tokens. Separar conteúdo canônico (hash imprimível) dos bytes finais do PDF (hash externo), evitando hash circular.

## Operações REST propostas

| Operação | Caso de uso / RF | Acesso e trava principal |
| --- | --- | --- |
| POST /v1/empresas e /v1/estabelecimentos | C0 | Conta administrativa autorizada |
| POST /v1/campanhas | Criar rascunho RF-01.2 | Escopo da empresa |
| POST /v1/campanhas/{id}/publicacao | Ativar RF-01.1/2/6 | Janela, população, instrumento e canal alternativo |
| POST /v1/campanhas/{id}/lotes-de-codigos | Emitir códigos RF-01.1 | Limite da população; sem destinatários |
| GET /v1/participacao/questionario | Carregar instrumento público | Campanha válida; sem resposta individual |
| POST /v1/participacao/respostas | Receber RF-01.1/4/6 | Token no corpo, nunca em log; consumo atômico |
| POST /v1/campanhas/{id}/encerramento | RF-01.2/5 | Meta/taxa e registro no mesmo caso de uso |
| GET /v1/campanhas/{id}/agregados | RF-01.3 | Projeção protegida; filtros permitidos |
| POST /v1/indicadores | RF-01.7 | Fonte/período/unidade/escopo |
| POST /v1/criterios e /{id}/aprovacao-demonstrativa | RF-02.1/8 | Versão completa, documento e data |
| POST /v1/avaliacoes e /{id}/calculo | RF-02.2/3/6/7 | Todas as pré-condições aplicáveis |
| POST /v1/avaliacoes/{id}/decisao | RF-02.4 | Justificativa de override e revisão |
| GET /v1/avaliacoes/mapa | RF-02.5 | Mesma política central de anonimato |
| POST /v1/inventarios e /{id}/consolidacao | RF-03.1/3/4 | Nove alíneas, integração, travas M2 |
| POST /v1/perigos | RF-03.2 | Fonte/circunstância/agravos |
| GET /v1/inventarios/{id}/versoes | RF-03.4 | Histórico por empresa |
| POST /v1/inventarios/versoes/{id}/exportacoes | RF-03.5/6 | Fotografia íntegra e idempotência |
| GET /v1/documentos/{id}/download | RF-02.8/03.6 | Autorização por documento e empresa |

Rotas são decisões técnicas propostas e serão materializadas no Swagger na etapa de implementação. Endpoints de assinatura real e expurgo não serão habilitados enquanto suas definições estiverem pendentes. Token do link deve ficar preferencialmente no fragmento do URL, lido pelo formulário e enviado no corpo por HTTPS; `Referrer-Policy: no-referrer`, sem analytics de coleta.

## Erros, concorrência e idempotência

Envelope de erro: código estável, mensagem legível, campos faltantes quando permitido e correlationId sanitizado. Exemplos: `CAMPANHA_INCOMPLETA`, `PARTICIPACAO_INDISPONIVEL` (genérico para tokens), `CRITERIO_INCOMPLETO`, `RISCO_EVIDENTE_SEM_MEDIDA`, `INVENTARIO_INCOMPLETO`, `ASSINATURA_PENDENTE`, `REVISAO_DESATUALIZADA`.

HTTP: 400/422 para dados inválidos/regras; 401 para autenticação administrativa ausente; 403/404 para recurso sem acesso conforme política anti-enumeração; 409 para revisão/estado conflitante; 429 para limite de uso; 503 para falha transitória. Supressão é resultado de leitura tipado, não erro 500.

Consumo concorrente de token: uma gravação, demais retornam indisponibilidade sem revelar conteúdo. Nova tentativa após timeout não duplica resposta. Consolidações e geração de PDFs aceitam chave de idempotência por empresa/operação/versão; repetição retorna o recurso criado. Em falha parcial de Storage, manter tentativa pendente/falha e repetir com mesma chave, sem reabrir versão consolidada.

## Dependências sem ciclos de implementação

RF-01.2 cria rascunho antes de RF-01.1/6; sua publicação/encerramento só são concluídos depois. RF-02.1 cria matriz em rascunho; RF-02.8 gera documento e habilita aprovação; só então publicar critérios. RF-03.1 cria rascunho; RF-03.4 fornece mecanismo de versões usado na consolidação. Backlog separa esses estados sem relaxar as regras finais.
