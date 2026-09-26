# Pendências, hipóteses e riscos

Data: 2026-09-26. Estas pendências não impedem iniciar a estrutura técnica Next.js/NestJS nem os cenários demonstrativos explicitamente definidos. Impedem afirmar prontidão de produção ou avançar etapas formais dependentes.

| ID | Lacuna / responsável pela decisão | Solução demonstrativa explícita | Bloqueio real |
| --- | --- | --- | --- |
| P-01 | Instrumento de coleta, fatores, itens, escalas, licença e validação; responsável técnico/metodológico | Questionário demo-v1 de ADR-03 com respostas sintéticas | Questionário real e interpretação psicométrica |
| P-02 | Método de probabilidade/severidade, critérios, faixas e integração de indicadores; responsável técnico | S/P 1–3 fundamentados por técnico fictício, R=S×P e tabela demo | Avaliação real, inferência clínica ou uso científico dos limiares |
| P-03 | Governança de comentários, revisão, retenção de respostas e risco de identificação; privacidade/produto | Texto desativado inicialmente; RF-01.4 exige aviso quando ativado; sem leitura individual por gestor | Tratamento real de texto e dados pessoais |
| P-04 | Aplicabilidade a–i, AEP/AET/NR-17, agravos, medidas e conteúdo do inventário geral; profissional habilitado | Base geral e resultados ergonômicos sintéticos completos | Declaração de adequação normativa ou inventário real |
| P-05 | Encaminhamento quando medida imediata não é possível; responsável SST e futuros requisitos M4 | Registro mínimo de medida/pendência em M2, sem implementar plano de ação | Avanço formal nessa situação; módulo M4 |
| P-06 | Modalidade de assinatura, verificação, identidade/atribuição e validade do documento digital; técnico/jurídico | PDF com data/campos/hash e aprovação acadêmica distinta; sem assinatura formal | RF-02.8/03.6 completos e avanço formal do ciclo |
| P-07 | Marco exato de retenção, regras específicas, custódia, backup/restauração de objetos e banco; jurídico/operação | Sem expurgo; guarda provisória mínima por versão; exportação aberta planejada | Garantia operacional de 20 anos e produção |
| P-08 | Contas, regiões, termos/cotas, segredo seguro, domínio e autorização de deploy; titular do projeto | Desenvolvimento local primeiro | Publicação online; nenhuma conta configurada |
| P-09 | Base legal, acessos de titulares, papéis profissionais, política de logs e riscos residuais; responsável pela organização/privacidade | Dados fictícios, privacidade conservadora e sem promessa legal | Qualquer uso com dados reais |
| P-10 | Especificações M4/M5/M6; dono do produto e fontes futuras | Só referências contextuais e impedimentos necessários em M2/M3 | Implementação desses módulos |
| P-11 | Versões exatas, biblioteca PDF e compatibilidade do runtime; implementação técnica | Stack mandatória preservada e adaptadores propostos | Resolver em E0/E5 antes de fixar dependências; não bloqueia documentação |

## Riscos que merecem validação dirigida

Reidentificação por complementos, consultas repetidas e metadados de infraestrutura; dois envios simultâneos com mesmo token; acesso entre empresas por referência aninhada ou PDF; perda de arquivos em hospedagem efêmera; assinatura falsa por simples upload; destruição em cascata; perda de vínculos na exportação aberta; matriz editada alterando resultado antigo. As SPECs contêm testes negativos relacionados.

A autenticação administrativa não pode contaminar a coleta anônima. A promessa de mínimo sete não cobre texto livre nem observação física de distribuição. Retenção documental não implica reter cada resposta. Gratuidade é preferência acadêmica, não garantia de preço, disponibilidade ou preservação futura.

## Divergências tratadas

Dados brutos de M2 interpretados como agregados não classificados, conforme proibição explícita de M1. Aprovação acadêmica separada de assinatura. Campos a–i complementados por consulta normativa e etiquetados. Regras mais específicas do produto preservadas sem apresentá-las como texto literal da NR-1. Ver [verificação normativa](conformidade/verificacao-nr1.md) e [relatório de leitura](extracao/relatorio-leitura.md).
