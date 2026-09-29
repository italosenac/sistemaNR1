# Matriz de autorização por recurso e operação

[ARQ] Modelo alvo da auditoria, não permissões já implantadas. Padrão: negar. `G` = gestor_sst_rh; `T` = responsavel_tecnico; `C` = consultoria; `W` = trabalhador. Todo acesso empresarial exige identidade Auth válida, perfil ativo, empresa ativa, vínculo ativo e atribuição ativa na mesma empresa. Para operação fora da tabela, negar até especificação explícita.

| Recurso | Operação/capacidade | Papel autorizado | Escopo | Restrições | Etapa |
| --- | --- | --- | --- | --- | --- |
| Perfil próprio | Ler/alterar nome básico | W, G, T, C; identidade sem vínculo acessa somente o próprio perfil | Próprio usuarioId | Não alterar status, empresa, papel ou credenciais no DTO de perfil; e-mail/senha passam por Auth | E1 |
| Empresas vinculadas | Listar/selecionar | W, G, T, C | Somente vínculos ativos próprios | Metadados mínimos; seleção não concede operação adicional | E1 |
| Carteira de clientes | Listar contexto empresarial | C | Empresas explicitamente vinculadas | Nenhuma busca global; não agregar dados de clientes distintos | E1 |
| Empresa | Criar empresa nova e primeiro gestor | Identidade autenticada com perfil ativo | Somente empresa criada nesta transação | Missão E1, itens 5/9: bootstrap atômico; não aceita ID de empresa existente; não concede administração global | E1 |
| Empresa | Ler cadastro mínimo | G, T, C | Empresa do vínculo | W recebe apenas identificação mínima do próprio vínculo | E1 |
| Empresa e estrutura | Cadastrar/editar/arquivar estabelecimento, setor, função, turno, grupo; editar empresa existente | G | Empresa autorizada | Mesma empresa em todas as FKs; sem exclusão de referências; não alterar snapshots | E1 |
| Estrutura | Consultar referências | G, T | Empresa autorizada | Somente escopo necessário; C precisa de atribuição adicional para operação técnica/gestão | E1 |
| Vínculos e lotações | Cadastrar/editar/inativar; listar perfis mínimos associados | G | Empresa autorizada | Não modificar identidade global de outro usuário; não revelar vínculos/matrículas de outras empresas | E1 |
| Atribuições de papel | Conceder/revogar W, T, C para outro usuário | G | Mesmo vínculo empresarial alvo | Papel do catálogo; motivo/autor/data; não inferir habilitação profissional; ator e alvo diferentes | E1 |
| Atribuição de gestor | Conceder/revogar G para outro usuário | G | Mesma empresa | Sessão novamente verificada, auditoria; impedir remover último gestor ativo; nunca autoelevação | E1 |
| Atribuições próprias | Conceder privilégios a si mesmo | Nenhum fluxo comum | Qualquer empresa | Negar por API e persistência; primeiro gestor somente pelo provisionamento controlado | E1 |
| Identificação profissional | Ler/editar dados próprios | Identidade titular | Próprio registro | Não atribui T nem muda estado de verificação; consulta empresarial só para finalidade técnica autorizada | E1 |
| Registro profissional do responsável designado | Consultar projeção mínima | G, T | Documento/avaliação da empresa | Sem CPF público, sem exportar cadastro pessoal completo | E3–E5 |
| Campanhas/códigos/indicadores | Criar/publicar/encerrar, emitir códigos, registrar procedência | G | Uma empresa e escopo autorizado | Travas RF-01.1–7, códigos sem destinatário nominal; T pode registrar indicadores conforme RF-01.7 | E2/E6 |
| Questionário anônimo | Carregar/enviar por código | Participante anônimo; não é papel Auth | Campanha/grupo do token | Não exige login; não aceita identidade; token de uso único, sem vínculo token↔resposta | E2 |
| Agregados e consulta documentada | Consultar/exportar projeção protegida | G, T | Uma empresa | k≥7, complementos/filtros/temporalidade; C só com papel adicional da empresa | E2/E6 |
| Respostas individuais | Consulta nominal/drill-down | Nenhum papel funcional | Nenhum | Proibido também a G/T/C; processamento interno restrito somente para agregação | Nunca no MVP |
| Critérios | Editar rascunho/gerar documento/aprovar demonstração | T; G autorizado no fluxo acadêmico | Empresa e versão | Cobertura completa, aprovação anterior ao cálculo; não equivale a assinatura | E3 |
| Avaliação e preliminar | Fundamentar/calcular/decidir/validar | T; G participa do levantamento preliminar previsto | Empresa, grupo e versão | Memória, maior consequência, justificativa, AEP/AET, medida mínima; G não assume cálculo técnico por padrão | E3 |
| Inventário geral e perigos | Cadastrar conteúdo/rascunho | T; G autorizado para cadastro | Empresa/estabelecimento | Fonte/circunstância/agravos, conteúdo integrado; M3 não recalcula M2 | E4/E6 |
| Inventário consolidado | Consolidar/nova versão | T | Empresa/estabelecimento | Nove alíneas, referências, imutabilidade e diferenças | E4 |
| Documentos/histórico | Consultar/gerar PDF/exportar/download | G, T | Empresa e versão exatas | Mesma política de divulgação; objeto privado; URL temporária não é assinatura | E4/E5 |
| Assinatura formal | Verificar/assinar | T com atribuições profissionais verificadas | Versão/bytes específicos | Papel ou registro cadastrado não basta; P-06 mantém operação indisponível | Após definição técnica/jurídica |
| M4/M5/M6 | Área pessoal, ações, acompanhamento, comunicação | A definir em SPEC futura | A definir, sem eliminar tenant | Nenhuma permissão funcional é concedida por esta previsão | Fora da E1/MVP atual |

### Cobertura operacional E1 — 2026-09-29

Esta tabela registra **evidência da política acima**, sem criar permissões novas. `G/T/C/W` têm os significados definidos no início. `N` = `tests/integracao/matriz-e1.spec.ts` (três testes novos, Auth/Nest/PostgreSQL locais); `B` = `tests/integracao/camada-zero.spec.ts`; `S` = `supabase/tests/camada-zero.sql`; `U` = `tests/usuarios.spec.ts`. “Próprio” exige identidade Auth e perfil ativo; toda operação empresarial exige empresa, vínculo e papel ativos no mesmo tenant. A API não expõe endpoint de auditoria: sua consulta E1 é interna, protegida por RLS.

| # | Operação / endpoint ou ação | Permitido; negado | Condição de empresa | Prova local | Lacuna E1 |
| --- | --- | --- | --- | --- | --- |
| 01 | Ler perfil, `GET /meu-perfil` | Próprio W/G/T/C; outro negado por ID fixo no servidor | Independente de vínculo; só o titular | N, B, S | — |
| 02 | Editar perfil, `PATCH /meu-perfil` | Próprio W/G/T/C; status/papel por DTO negados | Só o titular | N, B | — |
| 03 | Ler/editar identificação profissional, `GET/POST/PATCH /meu-perfil/registros-profissionais` | Titular; outro não lê nem edita | Registro global ligado a `usuario_id`, sem concessão de T | N, S | Verificação oficial de conselho fora da E1 |
| 04 | Listar empresas e vínculos próprios, `GET /minhas-empresas`, `/meus-vinculos` | Próprio W/G/T/C; contas sem vínculo recebem lista vazia | Apenas vínculos ativos próprios | N, B | — |
| 05 | Listar usuários/vínculos da empresa, `GET /empresas/:id/usuarios` | G; W/T/C negados | Empresa do gestor ativo | N, B | — |
| 06 | Criar/associar vínculo, `POST /empresas/:id/usuarios` ou `/vinculos` | G; W/T/C negados | Alvo e empresa autorizados; sem alterar Auth existente | N, B, U | E-mail público remoto é dependência separada |
| 07 | Editar matrícula, `PATCH /empresas/:id/vinculos/:id` | G; W/T/C negados | Matrícula única por empresa; vínculo do tenant | N, B, S | — |
| 08 | Conceder papel, `POST /empresas/:id/vinculos/:id/papeis` | G para outro titular; W/T/C negados | Alvo da mesma empresa; motivo obrigatório | N, B, S | — |
| 09 | Revogar papel, `POST .../papeis/:atribuicao/revogacao` | G para outro titular; W/T/C negados | Atribuição ativa do mesmo vínculo/tenant | N, B | — |
| 10 | Inativar vínculo, `PATCH /empresas/:id/vinculos/:id` | G; W/T/C negados | Revogação imediata só na empresa alvo | B, S | — |
| 11 | Preservar último gestor em revogação concorrente | Nenhum papel pode remover o último G ativo | Empresa alvo bloqueada durante escrita | B, S | — |
| 12 | Impedir autoelevação por API e banco | Ninguém no fluxo comum, inclusive G | Ator diferente do titular alvo | N, B, S | — |
| 13 | Listar estrutura, `GET /empresas/:id/estrutura/:tipo` | G/T; W/C sem outro papel negados | Somente empresa com vínculo/papel ativo | N, B, S | — |
| 14 | Criar/editar/arquivar estabelecimento, `POST/PATCH .../estrutura/estabelecimentos` | G; W/T/C negados | Empresa do recurso e ator | N, B | — |
| 15 | Criar/editar/arquivar setor, `POST/PATCH .../estrutura/setores` | G; W/T/C negados | Estabelecimento da mesma empresa | N, B, S | — |
| 16 | Criar/editar/arquivar função, `POST/PATCH .../estrutura/funcoes` | G; W/T/C negados | Catálogo da empresa | N, B, S | — |
| 17 | Criar/editar/arquivar turno, `POST/PATCH .../estrutura/turnos` | G; W/T/C negados | Empresa própria; horário em par | N, B, S | — |
| 18 | Criar/editar/arquivar grupo, `POST/PATCH .../estrutura/grupos` | G; W/T/C negados | Setor/unidade coerentes, função/turno do tenant; sem sobreposição | N, B, S | — |
| 19 | Gerenciar lotação, `POST /empresas/:id/vinculos/:id/lotacao` | G; W/T/C negados | Vínculo e todas as referências do mesmo tenant | N, B, S | — |
| 20 | Congelar/ler snapshot, `POST/GET /empresas/:id/estruturas-congeladas` | G cria; G/T leem; W/C negados | Empresa e estabelecimento autorizados; histórico imutável | N, B, S | Integração futura com campanha/inventário fora da E1 |
| 21 | Consultar auditoria interna, `SELECT organizacao.eventos_auditoria` | G; W/T/C sem gestão veem zero | RLS filtra `empresa_id` por capacidade | N, S | Sem endpoint de auditoria, não exigido pela SPEC E1 |
| 22 | Negar auditoria a papel sem capacidade, mesmo `SELECT` | W/T/C negados | Nenhuma linha de empresa alheia | N, S | — |
| 23 | Consultoria em carteira vinculada, `GET /minhas-empresas`, `/empresas/:id` | C lê contexto mínimo; não ganha gestão/estrutura | Só empresa explicitamente vinculada | N, B | — |
| 24 | Consultoria fora da carteira, `GET /empresas/:id` | C negada | ID conhecido de empresa sem vínculo não autoriza | N, B | — |
| 25 | Referência cross-tenant por ID conhecido em API/SQL | G/T/C/W negados fora de capacidade própria | FK composta, RLS e verificação da API | N, B, S | — |
| 26 | Troca de empresa no navegador | Papéis da nova empresa apenas | Estado e consultas da empresa anterior descartados | B, U | — |
| 27 | Bootstrap, `POST /empresas` | Qualquer identidade Auth com perfil ativo | Cria **nova** empresa e primeiro G numa transação | N, B, S | — |
| 28 | Negar bootstrap indevido, mesmo endpoint | Perfil pendente/inativo ou token inválido negado | Não aceita empresa existente nem papel por metadados | B, S | — |

**Cobertura operacional local: 28/28 operações E1 acima**, com testes negativos na API e/ou no PostgreSQL. Os testes `N` passaram 3/3 com código 0 em 2026-09-29. A cobertura não comprova envio de e-mail remoto, nem aplica a migração incremental de auditoria ao projeto remoto. Registros profissionais são globais: seus eventos de auditoria não têm `empresa_id` no modelo atual, e criação pelo Auth pode ter ator de sistema nulo.

Papéis simultâneos unem apenas as operações expressas acima. Restrições negativas e estado inativo sempre prevalecem. Permissão de consultar agregado não concede gerenciamento de identidade, assinatura, leitura individual ou acesso entre empresas.

Referências a “leitor autorizado” nos RFs originais descrevem capacidade de leitura, não um quinto papel funcional a implementar. O `leitor` do código antigo é compatibilidade pendente, não deve ser migrado automaticamente para um papel mais poderoso. A [SPEC de usuários](../../specs/camada-0/usuarios-perfis.spec.md) contém os cenários de aceitação e o [isolamento](isolamento-multiempresa.md) define enforcement e revogação.
