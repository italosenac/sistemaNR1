# Relatório de leitura das fontes

Data: 2026-09-26. Os arquivos reais têm nomes **M1.pdf, M2.pdf e M3.pdf**, com letras maiúsculas; os links respeitam esses nomes para Linux. Fontes preservadas sem alteração. Hashes SHA-256 e contagem de páginas em [manifesto.json](manifesto.json).

## Cobertura integral

| Fonte | Páginas físicas lidas | Conteúdo | Conferência |
| --- | --- | --- | --- |
| [M1](../fontes/M1.pdf) | 1–3 | Tabela de 7 RFs; jornada; entradas/saídas; atores e narrativa | Texto integral e inspeção visual das 3 páginas |
| [M2](../fontes/M2.pdf) | 1–3 | Tabela de 8 RFs; dois diagramas em imagem; atores e narrativa | Texto integral e inspeção visual das 3 páginas; transcrição abaixo |
| [M3](../fontes/M3.pdf) | 1–2 | Tabela de 6 RFs; fluxo; atores e narrativa | Texto integral e inspeção visual das 2 páginas |

Transcrições automáticas: [M1](m1.md), [M2](m2.md), [M3](m3.md). Renderizações de todas as páginas em `previas/`. O espaçamento da extração não representa corretamente as colunas; a associação RF → funcionalidade → norma → bloqueio foi conferida na imagem de cada tabela.

## Diagramas e conteúdo em imagens

M1 p.1 e M2 p.1: **M1 (Dados brutos) → M2 (Critério + decisão) → M3/M4 (Inventário + ação)**.

M1 p.2 e M2 p.2: **Camada 0 · Perfis e estrutura** (estabelecimento → setor → função → turno; quem existe, onde e em que grupo) → **M1 · Coleta** (questionário anônimo + indicadores objetivos; respostas agregadas por grupo, n ≥ 7, + absenteísmo, rotatividade) → **M2 · Avaliação e nível de risco** (a régua, o motor e o mapa; nível classificado + memória de cálculo → alínea i) → **M3 · Inventário de riscos** (as nove alíneas do 1.5.7.3.2; risco alto vira ação obrigatória e rastreável) → **M4 · Plano de ação** (hierarquia de medidas do 1.4.1 g; medidas implementadas com evidência anexada) → **M5 · Ciclo e acompanhamento** (reavaliação bienal e gatilhos extraordinários; riscos e medidas consolidados) → **M6 · Comunicação** (devolutiva em linguagem acessível).

M2 p.2 acrescenta uma seta de retorno **M5 → M2**, com a legenda “o ciclo seguinte reexecuta o M2 e compara”. M2 está destacado. Essa página contém conteúdo em imagem além do título extraído; não é uma página vazia. M3 p.1: **M1 Coleta → M2 Avaliação → M3 Inventário → M4 Plano de Ação**.

## Normalização e limites de interpretação

- Os identificadores impressos `01.1` a `03.6` foram normalizados como `RF-01.1` a `RF-03.6`, sem alterar as 21 regras.
- M1 p.2 especifica saída agregada, nunca individual. “Dados brutos” em M2 p.3 e nos diagramas significa, no contrato adotado, insumos agregados ainda não classificados. Não autoriza acesso às respostas individuais.
- M2 p.3 exige critérios anteriores ao cálculo e menciona PDF assinado. RF-02.8 preserva nova assinatura após alteração; aprovação acadêmica não equivale a assinatura formal.
- M3 p.1 RF-03.6 bloqueia avanço do ciclo sem data e assinatura, além de preparar campos no PDF. Exportação demonstrativa sem assinatura é possível, mas não libera esse avanço.
- As nove alíneas não são enumeradas integralmente nos PDFs; RF-03.1 usa complemento identificado da consulta normativa. Não atribuir essa enumeração ao PDF.
- M4–M6 e referências a gatilhos futuros são contexto, não autorização para inventar suas funcionalidades. Registrar apenas decisões e bloqueios necessários em M2/M3.
- A narrativa comercial de M1/M3 afirma anonimato e segurança jurídica em termos absolutos. A missão exige explicitamente não reproduzir essas garantias: mínimo amostral não elimina reidentificação; o MVP não é certificação legal.
- Não há instrumento de questionário, algoritmo de probabilidade, escalas, limites de faixas, catálogo clínico validado ou mecanismo de assinatura especificados. As escolhas demonstrativas e pendências estão identificadas em [decisões](../arquitetura/decisoes.md) e [pendências](../pendencias.md).

## Inventário das regras de bloqueio

M1: publicação sem anonimato/token único; encerramento sem meta/taxa; exibição abaixo do mínimo; texto livre sem aviso prévio; consulta sem registro documental; publicação sem alternativa; indicador sem fonte/período.

M2: publicação de matriz com célula sem faixa; número sem memória; perigo sem consequência; decisão alterada sem justificativa; célula pequena não mascarada; risco evidente sem medida; fator ergonômico sem resposta AEP/AET; mudança de matriz sem nova assinatura.

M3: consolidação com alínea ausente; perigo sem fonte/circunstância/agravos; laudo psicossocial isolado; sobrescrita sem autor/data/diferenças; exclusão consolidada antes de 20 anos; avanço formal sem documento datado e assinado.
