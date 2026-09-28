# Execução e contratos da Camada 0 — E1

[ARQ]/[MISSÃO E1], 2026-09-27. Implementação em Next/Nest, Supabase Auth e PostgreSQL. Resultado e limitações em [relatório E1](../validacao/relatorio-e1.md). M1–M6 continuam fora desta implementação.

## Banco e histórico

A migração inicial [20260927000100_camada_zero.sql](../../supabase/migrations/20260927000100_camada_zero.sql) cria o schema privado `organizacao` e 13 tabelas: `perfis`, `empresas`, `vinculos_organizacionais`, `atribuicoes_papel`, `lotacoes_usuario`, `identificacoes_profissionais`, `estabelecimentos`, `setores`, `funcoes`, `turnos`, `grupos`, `estruturas_congeladas` e `eventos_auditoria`. Relações em [modelo de identidade](modelo-identidade.md); matriz de capacidades em [permissões](matriz-permissoes.md).

A consulta remota confirmou ausência do schema `organizacao` e da tabela de histórico `supabase_migrations.schema_migrations`. O SQL anterior e sua suíte foram preservados em [histórico](historico/20260926000100_c0_usuarios_e_vinculos.sql) e [teste anterior](historico/usuarios_rls.sql), fora da pasta executável. Não há dados organizacionais legados para converter nesse projeto; contas Auth anteriores recebem perfil, sem atribuições por metadados. Não aplicar esta migração inicial em outro banco que já tenha o modelo anterior: nesse caso é necessária migração incremental específica.

Todas as tabelas têm RLS/FORCE RLS. `anon` não recebe acesso ao schema; `authenticated` tem SELECT sujeito às políticas, sem INSERT/UPDATE/DELETE. O schema não integra a Data API. O grupo NOLOGIN `sistemanr1_api` recebe SELECT, INSERT nas tabelas necessárias e UPDATE somente em colunas permitidas; não recebe DELETE nem alteração de status global do perfil. O login runtime deve herdar exclusivamente os privilégios necessários, sem ser proprietário, superusuário ou BYPASSRLS.

Funções SECURITY DEFINER têm `search_path=''`, objetos qualificados, EXECUTE mínimo e nenhuma entrada de ator. Elas verificam a identidade do contexto da transação, resolvem capacidades, fazem bootstrap de empresa nova, reconciliam perfil confirmado e registram auditoria. Não há função SQL arbitrária ou ingresso administrativo livre em empresa existente. Escritas empresariais bloqueiam a empresa e revalidam autorização; revogações usam a mesma ordenação. FKs compostas impedem referências entre empresas e setores de outro estabelecimento. Matrícula preenchida é única por empresa sem distinguir caixa; NULL pode repetir.

## Identidade e sessão

Cadastro público exige nome, e-mail, senha e confirmação; matrícula é posterior ao vínculo. Auth mantém credenciais; triggers criam perfil pendente e ativam somente após confirmação. Conta anterior sem perfil ou nome válido pode reconciliar o próprio cadastro após confirmar identidade. Perfil global inativo nunca é reativado por reconciliação. Gestor não controla status global de terceiros: este é um procedimento operacional segregado.

Login e recuperação utilizam Auth com chave publicável; contas criadas por gestor usam recuperação de senha/primeiro acesso para confirmar a posse do e-mail. A interface evita mensagens que confirmem a existência de contas. Configure no painel remoto Site URL e Redirect URLs para as origens autorizadas e caminhos `/auth/confirmacao` e `/atualizar-senha`, além de confirmação de e-mail, política de senha e entrega de e-mails apropriada. O arquivo `supabase/config.toml` é **local**; seus limites elevados de e-mail para Mailpit não devem ser promovidos ao serviço remoto.

Sessão em memória com renovação pelo SDK e limpeza no logout. Navegação com Link preserva a sessão; recarga completa/nova aba exige login. Não há persistência em localStorage/sessionStorage. Fragmentos de confirmação/recuperação são consumidos pelo SDK; a página também aceita token_hash verificado diretamente pelo Auth. Nenhuma senha é retornada, guardada em tabela própria ou enviada à API empresarial ao vincular conta existente.

Nest valida token por `getUser` no projeto configurado e verifica sujeito, emissor, audiência e expiração. Papéis/metadados do JWT não autorizam operações. A cada solicitação, capacidades são resolvidas pelas atribuições e vínculos ativos. Trocar empresa remonta os formulários e limpa consultas anteriores. Ocultar botões é apenas apresentação; API e RLS impõem as restrições.

## Endpoints implementados

Todas as rotas abaixo usam `/api/v1` e Bearer. O ator vem do token verificado; `usuarioId` só identifica o alvo autorizado de uma associação. POST retorna 201, PATCH/GET 200. Erros sanitizados: 400 validação, 401 autenticação, 403 capacidade/escopo, 404 registro autorizado ausente, 409 duplicidade/conflito, 503 indisponibilidade. CADASTRO_PARCIAL preserva o identificador da identidade já criada para associação posterior, sem alegar rollback do Auth.

| Método / rota relativa | Operação / autorização |
| --- | --- |
| GET/PATCH /meu-perfil | Próprio perfil/nome; consulta pode retornar JSON null para reconciliação |
| POST /meu-perfil/reconciliacao | Perfil próprio ausente/pendente, identidade confirmada |
| GET/POST /meu-perfil/registros-profissionais; PATCH /:id | Dados profissionais próprios, sempre não verificados |
| GET /minhas-empresas | Contextos mínimos dos vínculos ativos e capacidades |
| GET /meus-vinculos | Vínculos e lotações próprios permitidos |
| POST /empresas | Conta ativa cria empresa, vínculo e gestor inicial atomicamente |
| GET/PATCH /empresas/:empresaId | Ler: G/T/C; editar: G |
| GET/POST /empresas/:empresaId/estrutura/:tipo; PATCH /:id | Tipo: estabelecimentos/setores/funcoes/turnos/grupos; ler G/T, gravar G |
| GET /empresas/:empresaId/usuarios/opcoes | Referências ativas para G/T |
| GET/POST /empresas/:empresaId/usuarios | G lista ou cria identidade e vínculo |
| POST /empresas/:empresaId/vinculos | G associa conta existente por UUID; credenciais inalteradas |
| PATCH /empresas/:empresaId/vinculos/:id | G atualiza matrícula/status |
| POST /empresas/:empresaId/vinculos/:id/lotacao | G cadastra/edita lotação |
| GET/POST /empresas/:empresaId/vinculos/:id/papeis | G consulta/concede papel a outro titular |
| POST /empresas/:empresaId/vinculos/:id/papeis/:atribuicao/revogacao | G revoga papel, com motivo, preservando último gestor |
| GET/POST /empresas/:empresaId/estruturas-congeladas | Ler G/T; congelar G; revisões imutáveis de grupos/população |

G = gestor SST/RH, T = responsável técnico, C = consultoria. Trabalhador usa perfil/contextos próprios, sem diretórios empresariais. Consultoria isolada vê carteira e empresa mínima; precisa de G/T explícitos para gestão/técnica. `/health` continua público; `/api/docs` expõe Swagger Bearer somente em desenvolvimento. Não há endpoints M1–M6.

## Páginas

Públicas: `/`, `/cadastro`, `/login`, `/recuperar-senha`, `/confirmar-email`, `/auth/confirmacao`, `/atualizar-senha` (salvar exige sessão de recuperação).

Protegidas: `/dashboard`, `/meu-perfil`, `/meus-vinculos`, `/empresas`, `/empresas/nova`, `/empresas/editar`, `/usuarios`, `/vinculos`, `/matriculas`, `/papeis`, `/lotacoes`, `/estabelecimentos`, `/setores`, `/funcoes`, `/turnos`, `/grupos`, `/consultoria`. Acesso e navegação dependem das capacidades na empresa selecionada.

## Ambiente local de integração

Docker Desktop e CLI já instalados. Portas isoladas: API Supabase 55321, PostgreSQL 55322, Mailpit 55324, Next 3200, Nest 3201. O projeto Docker `sistemaNR1` não interfere em outros projetos. Serviços não usados pela E1 (Storage/Realtime/Studio etc.) podem ficar parados.

Após iniciar o Supabase local e aplicar a migração **local** em banco de testes, executar:

```powershell
pnpm.cmd preparar:integracao
pnpm.cmd test:rls
pnpm.cmd test:integracao
```

O preparador consulta o CLI sem imprimir valores, verifica host/portas locais, cria/renova o login restrito de testes e grava `.e1/ambiente.local.json`, ignorado pelo Git. Não edita os ambientes remotos existentes. Se o banco local ainda estiver vazio, use `pnpm.cmd exec supabase migration up --local` após iniciar o projeto local. Não usar reset remoto.

Playwright inicia Next/Nest com as variáveis locais corretas, injeta somente variáveis públicas no Next e usa Auth/PostgreSQL reais. Dados são exclusivamente fictícios; e-mails ficam no Mailpit. Traces, vídeos e screenshots dessa suíte ficam desligados para não registrar tokens/senhas. A suíte SQL prepara fixtures com administrador, mas executa as verificações de acesso como `sistemanr1_api` e `authenticated`, em transação revertida. As integrações HTTP preservam dados sintéticos locais para inspeção/reexecução com identificadores únicos.

## Preparação remota sujeita à aprovação

Projeto autorizado: `sfutycdmcjsvmfrvtxam`. Usuário confirmou revogação da chave antiga; a substituta permanece no backend. Nenhuma migração remota faz parte dos testes locais.

O usuário aprovou a migração em 2026-09-27. Histórico, checksum e dry-run foram reconfirmados; `20260927000100_camada_zero.sql` foi aplicada e a leitura posterior encontrou 13 tabelas, 34 políticas, 23 gatilhos e histórico registrado. O login runtime restrito foi provisionado e auditado sem SUPERUSER/BYPASSRLS/propriedade. A primeira tentativa de conexão do driver PostgreSQL com `verify-full` falhou; a execução foi interrompida conforme instrução do usuário. `DATABASE_URL` ainda não foi configurada no Nest e não há testes remotos de usuários/RLS executados. Ver [relatório E1](../validacao/relatorio-e1.md). Não repetir migração nem relaxar TLS.

Atualização 2026-09-28: após validação da CA oficial e autorização acadêmica específica, `DATABASE_URL` e `DATABASE_CA_CERT_PATH` foram configurados somente no ambiente privado do Nest. Cinco cenários remotos com fixtures fictícias e um teste RLS negativo revertido passaram. `pg_stat_ssl.ssl = false` no backend permanece registrado; TLS não está comprovado de ponta a ponta. Cadastro público e entrega de e-mail remoto ainda não têm evidência suficiente para concluir E1. Não repetir a migração nem iniciar E2–E4.
