# Isolamento multiempresa e revogação

[ARQ] Modelo implementado em E1, com migração somente local e validação remota pendente. Empresa é a fronteira. Perfil é global; cada operação empresarial seleciona e valida um vínculo. Não usar empresa única em perfil, cargo global no JWT ou consultoria como superusuário.

## Caminho de autorização

1. Nest recebe Bearer, verifica identidade no Supabase Auth do projeto configurado; falha fecha o acesso. O adaptador atual usa `getUser(token)` e exige audiência `authenticated`, sem confiar em mera decodificação ou `getSession` no navegador. Testar assinatura, emissor, audiência, expiração e token de outro projeto por meio do provedor. [Referência de getUser](https://supabase.com/docs/reference/javascript/auth-getuser).
2. Resolver usuário verificado e status do perfil; empresa do caminho é seleção não confiável. Buscar empresa/vínculo/atribuições ativos no servidor a cada operação, sem confiar em metadados editáveis ou em papéis desatualizados no JWT.
3. Aplicar capacidade da [matriz](matriz-permissoes.md) e restrições do recurso. Buscar recurso já limitado à empresa; validar todos os pais, grupos, documentos, versões e objetos. Não aceitar ator/empresa privilegiados do corpo.
4. Abrir transação na conexão restrita e estabelecer contexto de usuário local à transação, com parâmetros. RLS verifica vínculo/atribuição e estado. Um `empresaId` enviado pelo cliente nunca é suficiente para autorizar consulta.
5. Em escrita sensível, serializar/revalidar autorização e revogação antes da confirmação. E1 deve testar revogação concorrente: operação após revogação confirmada é negada; operações em andamento seguem ordenação transacional explícita, não continuam autorizadas apenas pelo token antigo.
6. Commit/rollback no mesmo cliente; erro de rollback descarta conexão. Nunca compartilhar contexto entre requisições do pool. Registrar evento administrativo sanitizado sem corpo de senha, token ou resposta.

## Privilégios e políticas implementadas

Navegador acessa Auth com chave publicável. Nest usa segredo exclusivamente para operações controladas de identidade, após autorização. Dados empresariais usam login PostgreSQL NOSUPERUSER/NOBYPASSRLS, sem propriedade de tabelas nem associação a papéis administrativos, com TLS validado. Login/credencial de migração é segregado e não integra o runtime.

Grants determinam as operações possíveis; RLS limita linhas. `service_role`, superusuário e funções SECURITY DEFINER exigem cuidado porque podem contornar RLS; FORCE RLS não transforma uma credencial privilegiada em proteção suficiente. A API mantém autorização própria mesmo quando um adaptador tem privilégio elevado. [RLS e grants no Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security).

| Conjunto | Política alvo |
| --- | --- |
| Perfil | Titular lê/edita somente campos pessoais permitidos; gestor consulta projeção mínima apenas dos vínculos ativos da empresa; estado global não é controlado pelo usuário nem por gestor de outra empresa |
| Empresa/estrutura/grupos | SELECT e operações de escrita separados por capacidade; checar perfil, empresa, vínculo e papel ativos; pai/filho na mesma empresa |
| Vínculo/lotação | Próprio contexto mínimo ou gestão autorizada; não expor vínculos de outras empresas; INSERT/UPDATE revalidam ator, alvo e relações; status auditado |
| Atribuições | Concessão/revogação somente pelo caso de uso autorizado; negar autoatribuição; catálogo fechado e proibição de remover último gestor; mesma proteção no banco |
| Dados profissionais | Titular e projeções estritamente necessárias ao documento técnico; sem listagem pública |
| Campanha/avaliação/inventário/artefatos futuros | Escopo de empresa e versão em todas as relações; grants e RLS por operação; proteção de negócio aplicada antes da serialização |
| Respostas/tokens futuros | Schema privado, fora da Data API e do papel administrativo comum; rotina restrita de participação/agregação; nunca JOIN com pessoas |

Revogar grants padrões indevidos de `public`, `anon` e `authenticated`; proteger também funções, views e futuras tabelas. Funções SECURITY DEFINER devem ter `search_path` fixo, objetos qualificados, proprietário segregado, EXECUTE mínimo e resultado estreito. Não criar função de escrita arbitrária que aceite usuário/empresa como prova de autorização. A política deve considerar todos os caminhos, inclusive acesso direto ao banco sob o login restrito.

A migração E1 substitui as permissões amplas do recorte anterior por capacidades explícitas e SELECT restrito do trabalhador. Grants de escrita no schema privado são exclusivos do grupo runtime; `authenticated` não pode promover usuários e o schema não é exposto na Data API. A suíte SQL executa os pares permitir/negar sob papéis comuns. Evidências atuais no [relatório E1](../validacao/relatorio-e1.md). A documentação oficial recomenda testar triggers de perfil porque sua falha afeta criação de contas. [Gestão de usuários](https://supabase.com/docs/guides/auth/managing-user-data).

## Revogação e consulta da carteira

Vínculo inativo bloqueia somente a respectiva empresa; atribuição revogada retira sua capacidade, mantendo outras atribuições válidas. Empresa inativa bloqueia todos os seus acessos. Perfil global inativo bloqueia acesso autenticado empresarial em todas as empresas. O controle de status global é operacional segregado; gestor de A não pode desativar a pessoa em B. Encerrar sessão melhora a experiência, mas não substitui autorização corrente no banco.

Consultoria recebe apenas empresas retornadas por seus próprios vínculos ativos. Troca de cliente limpa contexto, dados e caches da interface; cache e idempotência incluem empresa. Downloads voltam a verificar a autorização; URLs eventualmente assinadas devem ter validade curta e a revogação não promete invalidar imediatamente URL já emitida — optar por proxy autorizado quando a revogação imediata for requisito.

## Verificação negativa exigida na E1

Testar token inválido/expirado/de outro projeto; metadado falso de gestor; usuário sem vínculo; vínculo/atribuição/perfil/empresa inativos; ID conhecido de outra empresa; lote com referência cruzada; consultoria tentando cliente não contratado; autoelevação; concessão por trabalhador/técnico; revogação concorrente; remoção do último gestor; pool reutilizado entre A/B; acesso direto com grants incorretos; cadastro com matrícula duplicada; múltiplas matrículas NULL; perfil existente sem dados completos; falha parcial de Auth; logs sanitizados.

Usar positivos equivalentes para evitar que “negar tudo” passe por isolamento. Banco de teste real é necessário para SQL, constraints, RLS, grants e transações. Mocks/SELECT 1 não são essa evidência. Os casos estão normalizados em [usuários e perfis](../../specs/camada-0/usuarios-perfis.spec.md); coleta M1 continua sem login, mesmo se a pessoa já estiver autenticada em outra área.
