# Registro de decisões arquiteturais

Data inicial: 2026-09-26. Decisões aceitas **para a demonstração acadêmica**; não aprovam uso real. Alterações futuras registram motivo, impacto nas SPECs, autor e data, preservando histórico no controle de versão.

## ADR-01 — Stack e monólito modular

Origem [MISSÃO]. Adotar a stack explicitada em visão-geral.md e monorepositório pnpm. [ARQ] Monólito modular NestJS reduz implantação e operações para o prazo curto, mantendo fronteiras por capacidade. Domínio TypeScript puro, dependência voltada ao interior, SQL parametrizado por adaptadores e transações explícitas. ORM, versões de pacotes e biblioteca PDF serão confirmados na implementação; não criar estrutura executável nesta etapa.

## ADR-02 — Identidade administrativa separada da participação

Escopo de identidade administrativa ampliado pela ADR-13 para os quatro papéis. Separação da participação anônima permanece integralmente válida.

Origem [DOC] RF-01.1 e [MISSÃO] privacidade. [ARQ] Supabase Auth somente para usuários de gestão; participantes usam códigos aleatórios por grupo, sem destinatário cadastrado. Tokens e respostas não possuem ligação persistida entre si. Backend é o único ponto de entrada do negócio. Tradeoff: não é possível provar pessoa única por token sem criar vínculo nominal; demonstrar essa limitação, sem alegar anonimato absoluto.

## ADR-03 — Instrumento e matriz exclusivamente demonstrativos

Origem [PEND] PDFs não fornecem questionário, fórmula de probabilidade, magnitudes ou intervalos de classificação. [MISSÃO] solicita matriz demonstrativa. [ARQ] Permitir avançar com massa sintética e instrumento identificado como `questionario-demo-v1`, sem valor diagnóstico ou validação psicométrica.

Proposta de instrumento mínimo, não extraído dos PDFs: dois fatores fictícios, **sobrecarga percebida** e **ritmo percebido**; uma pergunta por fator (“Na situação fictícia apresentada, a demanda supera o tempo disponível?” e “Na situação fictícia apresentada, o ritmo dificulta a execução das tarefas?”). Respostas 1=nunca, 2=às vezes, 3=frequentemente. Ambas obrigatórias para o instrumento demo; texto aberto desativado até RF-01.4. Registrar explicitamente versão, autoria acadêmica e finalidade. Não associar média dessas respostas à probabilidade de agravo.

O responsável técnico fictício escolhe severidade e probabilidade em escalas ordinais 1–3 com justificativa. Descrições acadêmicas de magnitude: 1=menor, 2=intermediária, 3=maior; probabilidade: 1=menor, 2=intermediária, 3=maior. Não são limiares clínicos. Fórmula demo `R = S × P`; faixa baixa para R 1–2, média para R 3–4, alta para R 6–9; valores possíveis são 1, 2, 3, 4, 6 e 9.

| Severidade / Probabilidade | 1 | 2 | 3 |
| --- | --- | --- | --- |
| 1 | 1 / baixa / manter | 2 / baixa / manter | 3 / média / aprimorar |
| 2 | 2 / baixa / manter | 4 / média / aprimorar | 6 / alta / introduzir |
| 3 | 3 / média / aprimorar | 6 / alta / introduzir | 9 / alta / introduzir |

Todas as nove células possuem faixa e decisão. Cores propostas: verde, âmbar e vermelho, sempre acompanhadas de texto. O modelo é editável em versões, exige aprovação acadêmica antes do cálculo e preserva memória. Para uso real, substituir mediante validação profissional/metodológica P-01/P-02; não promover os números demo a critérios normativos.

## ADR-04 — Supressão central e divulgação conservadora

Origem [DOC] RF-01.3/02.5. [ARQ] k≥7, agregação hierárquica, supressão complementar e partições fixas. Filtros de função/turno somente sobre combinações previamente verificadas. Resultados dos fatores após encerramento; painel de adesão durante coleta usa intervalos e proteção do complemento. Nenhuma exportação contorna a política. Tradeoff: filtros podem ficar indisponíveis em grupos pequenos. Política exata em segurança-privacidade.md.

## ADR-05 — Critérios e inventários como fotografias imutáveis

Origem [DOC] RF-02.8/03.4/03.5. [ARQ] Novas versões em vez de atualização do consolidado. Resultado guarda critério e agregado de origem. M3 copia a avaliação e não recalcula. Diferenças semânticas usam IDs estáveis. PDF é artefato de uma versão, não documento editável em seu lugar. Auditoria acompanha autor/data/motivo sem dados de respondentes.

## ADR-06 — Documento gerado, aprovação e assinatura são estados distintos

Origem [DOC] M2 p.3 e RF-03.6; [MISSÃO] não declarar assinatura inexistente. [ARQ] Aprovação acadêmica permite cálculo demonstrativo e emissão de PDF marcado como demonstrativo/sem assinatura formal. Não libera avanço formal do ciclo. Critério alterado exige nova aprovação acadêmica e, no fluxo formal futuro, nova assinatura. Assinatura real permanece P-06; o primeiro MVP não simula estado formalmente assinado.

Hash SHA-256 do conteúdo canônico pode aparecer no PDF. Hash dos bytes finais fica em metadados externos, evitando autorreferência impossível. Evidência assinada deve vincular versão e bytes; adicionar uma imagem de assinatura ou nome não muda automaticamente o estado para verificado.

## ADR-07 — Inventário geral mínimo, sem inventar M4–M6

Origem [DOC] RF-03.3. [ARQ] Cadastro estruturado manual de base geral sintética com riscos de outras categorias, combinado aos psicossociais no mesmo inventário. Um anexo/link isolado não atende à integração pretendida. Não implementar importador genérico nem motor de avaliação para todos os riscos.

Risco evidente tem registro mínimo de medida em M2; necessidade de ação é saída sinalizada. Não construir plano de ação, cronogramas completos, reavaliação ou comunicação. Se medida imediata não for possível, registrar pendência e bloquear avanço formal até resolução do encaminhamento adequado.

## ADR-08 — Retenção e hospedagem

Origem [DOC] 20 anos e exportação aberta; [MISSÃO] preferência por serviços gratuitos. [ARQ] Política conservadora provisória conta 20 anos civis da consolidação por versão, preserva referências e não oferece expurgo no MVP. Bloqueio de exclusão e exportação entram cedo; prova operacional de preservação, restauração e custódia depende de infraestrutura futura. Não afirmar que planos gratuitos garantem décadas de retenção. Revalidar termos/cotas antes do deploy conforme fontes em visão-geral.md.

## ADR-09 — MCP apenas como ferramenta de desenvolvimento

Origem [MISSÃO]. [ARQ] Planejar servidores existentes e ferramentas locais; não criar servidor próprio ou dependência de MCP no runtime da aplicação. Integrações externas precisam de escopo autorizado e configuração efetiva; esta fase não conectou contas. Consultas de schema não incluem respostas individuais. Acesso a credenciais nunca é necessário nos relatórios.

## ADR-10 — Nove alíneas e divergências documentais explícitas

Origem [DOC] RF-03.1 referencia nove alíneas sem transcrevê-las. [NORMA] Consulta complementa sua enumeração na SPEC. [ARQ] Validação diferenciada para ausência declarada, inaplicabilidade fundamentada e dado obrigatório faltante; somente o último sempre bloqueia por incompletude, e a aplicabilidade normativa real exige P-04. Não preencher com texto genérico para passar nas travas. “Dados brutos” de M2 é interpretado como insumo agregado não classificado, preservando proibição individual expressa em M1.

## ADR-11 — Fundação E0, versões e execução local

Origem [MISSÃO 02] e [ARQ], 2026-09-26. Versões exatas nos manifests e pnpm-lock.yaml: Node 24.19.0 LTS, pnpm 12.6.0, Next 16.3.6, Nest 12.1.0, TypeScript 5.9.3. TypeScript 7 disponível no registro não satisfazia os peers consultados; manter 5.9.3 com strict. Nest 12 instalado é ESM: API usa `type: module`, NodeNext e imports relativos com extensão `.js`. Jest usa ts-jest ESM e a opção Node `--experimental-vm-modules`. A tentativa CommonJS foi rejeitada por TypeScript/Jest e corrigida, sem desativar verificações. [Jest ESM](https://jestjs.io/docs/ecmascript-modules), [ts-jest ESM](https://kulshekhar.github.io/ts-jest/docs/guides/esm-support).

O prefixo vigente da API é **/api/v1**, conforme pedido explícito da Missão 02; o `/v1` proposto anteriormente nos contratos documentais recebe `/api`. A rota técnica **GET /health** é excluída do prefixo e Swagger fica em `/api/docs` somente em desenvolvimento. Não há rotas de negócio publicadas. Saúde verifica o processo HTTP, sem afirmar conexão com banco/Auth/Storage. [Prefixo Nest](https://docs.nestjs.com/faq/global-prefix).

As quatro camadas ficam diretamente em `apps/api/src` em E0; domínio e aplicação permanecem reservados. A organização futura por capacidade da visão geral continua válida quando os módulos forem implementados. Não criar módulos vazios ou serviços genéricos. Contratos compilam antes dos consumidores, usando pnpm workspaces sem Turborepo. O único contrato compartilhado é `RespostaDeSaude`.

Next foi criado pelo CLI oficial dentro de `apps/web`; o arquivo workspace secundário do scaffold foi removido para manter uma única raiz. shadcn foi inicializado no aplicativo existente com `--no-monorepo`; componentes gerados usam Base UI. Fontes do sistema evitam downloads no build. SDKs Supabase e bibliotecas de formulários foram preparados por exigência da missão, sem clientes autenticados/formulários antecipados. [Next](https://nextjs.org/docs/app/getting-started/installation), [shadcn](https://ui.shadcn.com/docs/installation/next).

## ADR-12 — Identidade global e matrícula por empresa

Histórico do recorte anterior. Obrigatoriedade de matrícula, papel único e lotação embutida são substituídos no modelo alvo pela ADR-13; código e SQL anteriores permanecem preservados até E1 autorizada.

[MISSÃO] Atualização do cadastro solicitada em 2026-09-26. Nome completo no perfil referenciado por Auth; e-mail/senha sob gerenciamento Supabase Auth; matrícula no vínculo organizacional com empresa e lotação opcional. [ARQ] Um vínculo por usuário/empresa, matrícula textual de até 50 caracteres, única por empresa sem distinguir maiúsculas, preservando zeros iniciais. Nome de 3–150 caracteres, senha de 12–128 e política adicional do provedor. Não são critérios normativos nem alterações aos RFs dos PDFs.

Cadastro administrado por gestor ativo. Conta existente pode ganhar vínculo/matrícula em outra empresa por identificador sem alterar suas credenciais. Nova identidade não recebe `email_confirm=true` artificialmente; confirmação/ativação é procedimento controlado antes do uso. Primeiro gestor e empresas não são criados publicamente. A interface `/usuarios` possui login, seleção de empresa e dois fluxos separados.

Auth Admin usa segredo apenas no servidor e apenas para identidade. Dados próprios permanecem no schema privado `organizacao`, com driver pg 8.23.0 e papel restrito. Transações usam o mesmo cliente e contexto local, conforme [node-postgres](https://node-postgres.com/features/transactions). Autenticação consulta [getUser](https://supabase.com/docs/reference/javascript/auth-getuser); criação usa [createUser](https://supabase.com/docs/reference/javascript/auth-admin-createuser). Nome é copiado para perfil por trigger de criação; permissões nunca vêm de metadados editáveis. Senha não é persistida no aplicativo.

Falha após criar Auth pode deixar uma identidade sem vínculo confirmado; retorna identificador para reconciliação, sem apagamento automático ou concessão permissiva. Essa fronteira é explícita, pois não há transação distribuída entre os dois acessos. Migração e testes SQL ficam somente preparados por proibição expressa de aplicação. E1 permanece parcial até validação real de banco/RLS e critérios C0 restantes.

## ADR-13 — Quatro papéis, identidade única e atribuições por vínculo

2026-09-26, [MISSÃO]/[ARQ]. A tabela unificada de usuários do PDF complementar p.1 mistura credenciais, empresa única e papel global. Adotar Supabase Auth + Perfil + Vínculos Organizacionais + Atribuições + Lotações. Auth gerencia e-mail/senha; perfil guarda nome/status/datas sem tenant global. Vínculo tem matrícula opcional e estado por empresa. Atribuições permitem múltiplos papéis no mesmo vínculo quando explicitamente concedidos; lotação depende do vínculo, não do papel. Isso atende pessoa gestora em A/técnica em B e consultoria sem duplicar conta nem abrir clientes alheios.

Catálogo de quatro papéis e matriz por operação substituem enum `gestor/tecnico/leitor` do recorte anterior. `leitor` não tem migração automática segura: revisar os vínculos antes de conceder capacidade nova. Matrícula vazia vira NULL, única somente quando preenchida. Identificação profissional é opcional e restrita; CPF não é público/obrigatório. Gestor não controla perfil global de terceiro. Concessão/revogação exige auditoria e não permite autoelevação ou eliminação do último gestor.

Rejeitadas: autenticação por tipo de pessoa, hash próprio, tenant único no perfil, consultoria global, papel de JWT editável, worker nominal como origem da resposta. Conta pessoal pode existir sem alterar M1. Custo da escolha: joins e testes de revogação/grants/estado mais rigorosos; justificado pelo isolamento e acesso por cliente. [Modelo](modelo-identidade.md), [matriz](matriz-permissoes.md), [SPEC C0-USU](../../specs/camada-0/usuarios-perfis.spec.md). A auditoria altera documentação, não aplica a transição funcional ou SQL.

## ADR-14 — Referência complementar, JSONB seletivo e ciclos conceituais

2026-09-26, [MOD]/[ARQ]/[FUT]. PDF de schemas lido em cinco páginas, com 18 tabelas confrontadas em [compatibilidade](compatibilidade-schemas.md). Os 21 RFs continuam fonte funcional; omissões no quadro não removem entidades/travas. M1 mantém respostas protegidas, códigos sem pessoa e fotografias agregadas com k≥7, complementos/filtros. M2 pode usar JSONB validado em configuração versionada e memória, preservando FKs e entidades consultáveis relacionais; não importar enum de faixas nem recalcular histórico. M3 mantém nove alíneas, integração geral, versões/diferenças, responsável e artefatos privados; SHA-256 não é assinatura.

CicloReferencia contém empresa/estabelecimento, início, encerramento previsto e status para futura associação opcional do inventário. Não calcular vencimento de 2/3 anos por inferência do PDF nem implementar máquina M5 na E1. Ação/evidência, aferição, comunicado/recibo e área pessoal são propostas futuras. Auditoria administrativa necessária à autorização/histórico pode existir sem implementar M5. Nenhum dado nominal desses futuros módulos será ligado a respostas M1.

Impacto explícito: C0 estrutura/cadastro e SPEC do produto atualizados; CA-C0-09 revisto, CA-C0-13–16 e CA-USU-01–16 acrescentados. Os 21 arquivos de RF e PDFs originais são preservados. Backlog E1 separa adaptação do recorte, migrações revisadas, autorização e prova real; M1–M3 e ciclo funcional não entram na E1.
