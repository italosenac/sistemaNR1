# C0-USU — Identidade, perfis e autorização multiempresa

## Origem documental

[MISSÃO] Auditoria multiempresa e Missão A de 2026-09-26. [MOD] [PDF complementar](../../docs/fontes/arquitetura-schemas.pdf), p.1, adaptado conforme [compatibilidade](../../docs/arquitetura/compatibilidade-schemas.md). [DOC] [RF-01.1](../m1-coleta/rf-01-1.spec.md) e [RF-01.3](../m1-coleta/rf-01-3.spec.md) preservam coleta não nominal. Esta SPEC é suporte técnico, não um 22º RF dos PDFs.

## Objetivo

Uma identidade por pessoa, com vínculo e matrícula independentes por empresa, quatro papéis atribuídos explicitamente, lotação coerente e acesso revogável. Conta pessoal não identifica respostas M1.

## Atores

Trabalhador, gestor SST/RH, responsável técnico e consultoria. A Missão E1 autoriza bootstrap autenticado de empresa nova e seu primeiro gestor em uma transação; não é um quinto papel funcional nem ingresso livre em empresa existente.

## Entradas

Nome completo, e-mail/senha Auth, estado do perfil, vínculos por empresa, matrícula opcional, atribuições do catálogo, lotação opcional e identificação profissional mínima quando aplicável. Matrícula vazia é NULL; CPF não é obrigatório nem público. Estado/datas/autor são controlados pelo servidor. Modelo e chaves em [identidade](../../docs/arquitetura/modelo-identidade.md).

## Processamento

Criar ou reutilizar identidade Auth; manter perfil global sem empresa/papel/lotação. Criar vínculo autorizado, com zero ou mais atribuições ativas e no máximo uma lotação atual. Conta/vínculo sem papel não obtém operações de negócio por fallback. Aplicar [matriz de permissões](../../docs/arquitetura/matriz-permissoes.md) e [isolamento](../../docs/arquitetura/isolamento-multiempresa.md) em cada solicitação. Associar conta existente não muda suas credenciais globais.

Permitir múltiplos papéis no mesmo vínculo para atividades combinadas, inclusive consultoria com gestão ou responsabilidade técnica explícita. Concessão exige outro gestor ativo da empresa, contexto validado e auditoria; primeiro gestor passa pelo procedimento controlado. Nenhum papel atribui automaticamente habilitação ou assinatura profissional.

## Saídas

Perfil próprio restrito, lista de vínculos/empresas autorizados, carteira de consultoria e projeções administrativas mínimas por empresa. Sem senha/token/hash, vínculo de outra empresa ou identidade em contratos de respostas/agregação.

## Regras de negócio

- [MISSÃO] Supabase Auth é exclusivo para autenticação/e-mail/credenciais; perfil guarda nome, status e datas. Não criar autenticação por tipo de pessoa.
- [MISSÃO] Matrícula, estado e lotação pertencem ao vínculo; matrícula preenchida é única na empresa, sem impedir contas inicialmente sem matrícula.
- [ARQ] Catálogo fechado `trabalhador`, `gestor_sst_rh`, `responsavel_tecnico`, `consultoria`; atribuições por vínculo, não papel global em metadado.
- [ARQ] Desativação do vínculo bloqueia a empresa correspondente; desativação global do perfil bloqueia todas. Gestor da empresa não administra status global de pessoas.
- [ARQ] Cadastro/alteração de lotação não altera população da campanha nem identifica destinatário de token.
- [DOC] Participação anônima M1 funciona sem conta; proibir relação direta ou indireta resposta/token ↔ perfil/vínculo/lotação/matrícula/CPF. Resposta não guarda o token utilizado.

## Regras de bloqueio

Negar identidade inválida, perfil/empresa/vínculo/atribuição inativos, capacidade ausente, papel desconhecido, autoelevação, referência de outra empresa, setor de outro estabelecimento, matrícula preenchida duplicada e exclusão que destrua histórico. Impedir remoção do último gestor ativo. Conta parcial Auth não concede vínculo por fallback. Credencial privilegiada não dispensa autorização NestJS.

## Dependências

E0, [estrutura C0](estrutura-organizacional.spec.md), Auth do projeto autorizado, migrações revisadas e testes reais de grants/RLS. Nenhuma funcionalidade M1–M6 é pré-requisito para implementar usuários. M4 pessoal, M5 e M6 continuam pendentes de especificação.

## Critérios de aceitação

- **CA-USU-01:** Dada pessoa com conta Auth, quando autorizada em A e B, então manter um perfil e dois vínculos com matrículas/papéis próprios, sem duplicar credenciais.
- **CA-USU-02:** Dadas duas contas sem matrícula em A, quando criadas, então aceitar; ao preencher a mesma matrícula em ambas, rejeitar a segunda; aceitar a mesma em B.
- **CA-USU-03:** Dado vínculo de A, quando lotação referencia estabelecimento/setor/função/turno de B ou setor de outro estabelecimento, então negar por API e banco; aceitar ausência de lotação.
- **CA-USU-04:** Dada pessoa gestora em A e técnica em B, quando tenta gerenciar vínculos em B, então negar; papéis de A não valem em B.
- **CA-USU-05:** Dada consultoria vinculada a A/B, quando abre carteira, então listar somente A/B; conhecer ID de C não permite consultar conteúdo nem adicionar vínculo a C.
- **CA-USU-06:** Dado trabalhador, técnico ou consultoria sem gestão, quando tenta atribuir G a si ou a terceiro, então negar; gestor também não usa fluxo comum para autoatribuição.
- **CA-USU-07:** Dado gestor ativo e outro usuário na mesma empresa, quando concede papel permitido, então registrar autor/data/motivo; papel desconhecido, alvo/atribuição de outra empresa ou último gestor removido são recusados.
- **CA-USU-08:** Dado JWT ainda válido, quando vínculo A é inativado, então próxima operação A falha e B continua conforme suas atribuições; perfil global inativo bloqueia ambos.
- **CA-USU-09:** Dados papéis simultâneos autorizados, quando consultadas capacidades, então unir somente operações da matriz; nenhuma combinação libera resposta individual, empresa alheia ou assinatura formal sem validação.
- **CA-USU-10:** Dado token adulterado, expirado, com audiência/emissor errados ou de outro projeto, quando enviado à API, então negar sem expor detalhes; metadados editáveis não elevam papel.
- **CA-USU-11:** Dado trabalhador autenticado em área pessoal, quando responde a M1, então usar fluxo sem identidade, sem enviar sessão nominal, usuario_id, perfil_id, matrícula, CPF, vinculo_organizacional_id ou lotacao_usuario_id; token não permite reconstruir pessoa/resposta.
- **CA-USU-12:** Dado responsável técnico com registro opcional, quando cadastrado, então não exigir CPF indiscriminadamente nem marcar habilitação ou assinatura como verificada.
- **CA-USU-13:** Dada conta sem vínculo, quando consulta perfil próprio, então permitir apenas seus dados básicos após ativação; não listar empresas alheias nem editar estado/atribuições pelo DTO pessoal.
- **CA-USU-14:** Dada concessão/revogação concorrente, quando confirmada a revogação, então operações posteriores são negadas; conexão reutilizada entre empresas não conserva contexto anterior.
- **CA-USU-15:** Dada falha após criar Auth ou perfil legado incompleto, quando cadastro é reconciliado, então não duplicar conta, apagar histórico, devolver credenciais ou conceder acesso permissivo.
- **CA-USU-16:** Dados frontend, exemplos e logs, quando inspecionados, então não conter segredo de backend/senha; arquivos locais de ambiente permanecem fora do Git.

## Testes necessários

Unitários de capacidades/concessão; HTTP de token/DTO/ator; integração real com duas empresas, quatro papéis, combinações, NULL/duplicidade de matrícula, FKs, grants/RLS, revogação e pool; E2E de perfil, carteira, troca de contexto e cadastro; futura integração negativa com M1. Pares positivos acompanham negações. Não afirmar RLS com mocks ou conexão constante.

CA-USU-11 tem verificação estrutural/contratual na E1 e jornada de coleta na E2. A E1 pode encerrar seu escopo quando seus critérios e banco forem comprovados, deixando explicitamente pendente essa integração futura; não implementar M1 apenas para concluir a C0. Mesma distinção vale para snapshots C0: testar a capacidade de congelar/preservar estrutura, sem construir campanhas ou inventários antecipadamente.

## Estado de implementação

**Parcialmente implementado.** A Missão E1 implementa identidade Auth, perfil global, vínculos/matrículas opcionais, quatro papéis, lotação separada, empresas e estrutura. Migração consolidada aplicada somente no Supabase local; autorização/RLS, Auth e navegação estão em validação real. Aplicação/configuração remota e seus testes dependem da aprovação específica exigida na seção 12 do prompt. Evidências e critérios em [relatório E1](../../docs/validacao/relatorio-e1.md). M1–M6 permanecem fora desta implementação.

## Observações

Esta revisão substitui as decisões anteriores de cadastro exclusivamente administrativo, matrícula obrigatória e um papel por vínculo; não modifica os 21 RFs. `leitor` antigo precisa de revisão explícita, não equivalência automática. Área pessoal M4 é apenas possibilidade futura e jamais justifica identificar resposta anônima. ADR-13/14 registram origem, compatibilidade e limites.
