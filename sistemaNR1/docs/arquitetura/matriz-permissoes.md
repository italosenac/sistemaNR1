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

Papéis simultâneos unem apenas as operações expressas acima. Restrições negativas e estado inativo sempre prevalecem. Permissão de consultar agregado não concede gerenciamento de identidade, assinatura, leitura individual ou acesso entre empresas.

Referências a “leitor autorizado” nos RFs originais descrevem capacidade de leitura, não um quinto papel funcional a implementar. O `leitor` do código antigo é compatibilidade pendente, não deve ser migrado automaticamente para um papel mais poderoso. A [SPEC de usuários](../../specs/camada-0/usuarios-perfis.spec.md) contém os cenários de aceitação e o [isolamento](isolamento-multiempresa.md) define enforcement e revogação.
