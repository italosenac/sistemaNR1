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
| P-08 | Regiões/termos/cotas, domínio e autorização de deploy; titular do projeto | Projeto Supabase indicado/vinculado, ambientes locais ignorados; desenvolvimento local | Publicação online não autorizada; conexão de gestão não valida runtime/RLS |
| P-09 | Base legal, acessos de titulares, papéis profissionais, política de logs e riscos residuais; responsável pela organização/privacidade | Dados fictícios, privacidade conservadora e sem promessa legal | Qualquer uso com dados reais |
| P-10 | Especificações M4/M5/M6; dono do produto e fontes futuras | Só referências contextuais e impedimentos necessários em M2/M3 | Implementação desses módulos |
| P-11 | Biblioteca PDF e compatibilidade dos artefatos futuros; implementação técnica | Runtime/versões resolvidos em E0, manifests e lockfile fixados | Renderer/PDF e validação de documentos ainda dependem E5 |
| P-12 | Área pessoal de apoio ao trabalhador no M4; produto/privacidade | Somente identidade/perfil restrito em C0 | Não implementar agenda, histórico individual ou planos personalizados; nunca vincular a respostas M1 |
| P-13 | Transição dos três papéis antigos, inclusive `leitor`; responsável do projeto | Modelo de quatro papéis com atribuições explícitas | Revisar vínculos antes de migrar; não converter `leitor` em papel com mais poderes; E1 aguarda novo prompt/permissão |
| P-14 | Bootstrap, ativação e reconciliação de contas/perfis; implementação/titular | Auth sem confirmação artificial e falha parcial explícita | Definir fluxo controlado da primeira empresa/gestor e ativação; não enviar e-mail nem criar usuários remotos nesta auditoria |
| P-15 | Aplicação de migração revisada, login restrito/TLS/grants/RLS e testes reais; titular/implementação | SQL anterior preservado, sem execução; conexão constante sanitizada | Persistência/isolamento não comprovados; aplicar somente após autorização específica em teste |
| P-16 | CicloReferencia e posterior máquina M5, eficácia/recibos M6; produto/técnico/jurídico | Dependência conceitual de empresa/estabelecimento/versão, sem automação | Não fixar prazo de 2/3 anos nem efeito legal de IP/leitura pelo PDF complementar; aguardar SPECs e validação |

## Riscos que merecem validação dirigida

Reidentificação por complementos, consultas repetidas e metadados de infraestrutura; dois envios simultâneos com mesmo token; acesso entre empresas por referência aninhada ou PDF; perda de arquivos em hospedagem efêmera; assinatura falsa por simples upload; destruição em cascata; perda de vínculos na exportação aberta; matriz editada alterando resultado antigo. As SPECs contêm testes negativos relacionados.

A autenticação administrativa não pode contaminar a coleta anônima. A promessa de mínimo sete não cobre texto livre nem observação física de distribuição. Retenção documental não implica reter cada resposta. Gratuidade é preferência acadêmica, não garantia de preço, disponibilidade ou preservação futura.

## Divergências tratadas

Dados brutos de M2 interpretados como agregados não classificados, conforme proibição explícita de M1. Aprovação acadêmica separada de assinatura. Campos a–i complementados por consulta normativa e etiquetados. Regras mais específicas do produto preservadas sem apresentá-las como texto literal da NR-1. Ver [verificação normativa](conformidade/verificacao-nr1.md) e [relatório de leitura](extracao/relatorio-leitura.md).

Missão A: tabela única do novo PDF adaptada a Auth/perfil/vínculos/atribuições/lotação; matrícula obrigatória do recorte anterior tornou-se opcional no alvo. CPF indiscriminado, credenciais próprias, papel/empresa globais e “assinatura SHA-256” não foram adotados. As 18 tabelas estão rastreadas na [compatibilidade](arquitetura/compatibilidade-schemas.md). M4–M6 continuam propostas futuras, sem SPEC funcional completa.
