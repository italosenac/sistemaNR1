# C0 — Estrutura organizacional mínima

## Origem documental

[M1](../../docs/fontes/M1.pdf), p.2, e [M2](../../docs/fontes/M2.pdf), p.2: “estabelecimento → setor → função → turno”. M1 p.2 informa que a população da coleta vem da Camada 0. A missão exige isolamento de empresas. Campos e permissões abaixo são [ARQ], derivados para viabilizar M1–M3; não são RFs adicionais extraídos da tabela.

## Objetivo

Definir onde estão os grupos expostos e a população esperada, sem cadastrar pessoas respondentes.

## Atores

Gestor SST/RH; responsável técnico; consultoria com atribuições explícitas na empresa; trabalhador no acesso restrito ao próprio perfil. Capacidades em [usuários e perfis](usuarios-perfis.spec.md).

## Entradas

Empresa e estrutura fictícias, grupos de exposição, população esperada inteira positiva, perfis e vínculos de acesso. Processos, ambientes e atividades descritos para o inventário. CNPJ real não é necessário para a demonstração.

### Estrutura consolidada — Missão A

[MISSÃO]/[MOD] Complemento do [PDF de arquitetura, p.1](../../docs/fontes/arquitetura-schemas.pdf), sem substituir a hierarquia dos PDFs originais. Todas as entidades abaixo usam UUID; filhos possuem `empresa_id` e FKs compostas, com datas UTC e estado controlados pelo servidor. Não duplicar esses cadastros em M1/M2/M3.

| Entidade | Campos conceituais e restrições |
| --- | --- |
| Empresa | id, razão social, nome fantasia, CNPJ, e-mail corporativo, telefone, status, criação/atualização. Razão social sintética obrigatória; fantasia/contatos/CNPJ opcionais no MVP, sem exigir dado real |
| Estabelecimento | id, empresa, nome, descrição, endereço opcional, caracterização inicial do ambiente, status |
| Setor | id, empresa, estabelecimento, nome, descrição, status; estabelecimento da mesma empresa |
| Função | id, empresa, nome, descrição, status; catálogo da empresa |
| Turno | id, empresa, nome, horários de início/término quando definidos, status; horários em par, admitindo turno que cruza a meia-noite; não inferir duração sem contexto temporal |
| Grupo organizacional/de exposição | id, empresa, estabelecimento, setor, função/turno opcionais, quantidade estimada de trabalhadores, status; setor do estabelecimento e demais referências da mesma empresa; partições sem sobreposição |

Status empresarial/estrutural `ativo/inativo` no modelo alvo; arquivamento preserva registros/referências. Migração de `arquivado`/`ativo` do código anterior deve preservar semântica e histórico. Datas e descrições de snapshots continuam imutáveis após publicação/consolidação. População não é contagem de usuários com login.

### Cadastro de usuários — revisão arquitetural de 2026-09-26

[MISSÃO] Cadastro com **nome completo, e-mail, senha e matrícula funcional**. Supabase Auth é responsável pela identidade, e-mail, autenticação, hash e gerenciamento de senhas. O perfil possui `id` referenciando Auth e `nomeCompleto`; não replica e-mail ou senha. A senha só transita no formulário/DTO de entrada até Auth, sem armazenamento em tabelas próprias, respostas, logs, URL ou armazenamento do navegador.

[MISSÃO] `VinculoOrganizacional` associa usuário à empresa, matrícula opcional, status e datas. Papéis ficam em `AtribuicaoPapel` e lotação opcional em `LotacaoUsuario`, ambos relacionados diretamente ao vínculo. Perfil possui status/datas e não guarda empresa global. Um usuário pode ter matrículas e papéis diferentes entre empresas e múltiplos papéis explicitamente autorizados no mesmo vínculo. A matrícula não pertence ao perfil global nem aos metadados Auth.

[ARQ] Um vínculo por usuário/empresa; matrícula opcional, textual (preserva zeros iniciais), de 1 a 50 caracteres quando preenchida, única por empresa sem distinguir maiúsculas/minúsculas e sem espaços externos. Vazio vira NULL e não impede criação da conta. Nome de 3 a 150 caracteres, e-mail válido, senha de 12 a 128 caracteres sem normalização silenciosa; a política do Supabase pode impor restrições adicionais. São decisões técnicas deste cadastro, não requisitos dos PDFs. A obrigatoriedade anterior de matrícula é substituída explicitamente pela Missão A; adaptação implementada na E1.

[MISSÃO E1]/[ARQ] Cadastro público de identidade com nome/e-mail/senha/confirmação, sem matrícula. Usuário autenticado e ativo pode criar uma **nova** empresa pelo bootstrap transacional: empresa + vínculo + gestor inicial no mesmo commit. Essa autorização explícita substitui a restrição anterior de provisionamento exclusivamente interno; não permite obter privilégios numa empresa existente. Gestor SST/RH com vínculo/atribuição ativos cadastra ou associa identidades dentro da matriz, sem autoelevação. Associar conta existente não altera identidade global. E-mail não recebe confirmação artificial. CNPJ opcional é normalizado e validado, com dígitos verificadores numéricos/alfanuméricos e unicidade quando informado. Ver ADR-15 e [C0-USU](usuarios-perfis.spec.md).

[ARQ] Setor requer estabelecimento e deve pertencer a ele. Função/turno opcionais são referências da mesma empresa, sem transformar turno em propriedade universal da função. Lotação descreve o vínculo administrativo; não concede acesso a outra empresa, não produz automaticamente grupos/populações e não identifica participantes do M1.

## Processamento

Criar empresa → estabelecimentos → setores. Cadastrar funções e turnos na empresa; compor folhas por setor/função/turno. Para agregação, adotar caminho canônico empresa → estabelecimento → setor → função → turno, sem interpretar turno como propriedade universal de uma função. Células de população não se sobrepõem dentro da campanha: cada resposta pertence a uma folha. Congelar estrutura/população ao publicar campanha. Alterações posteriores criam revisão utilizada somente por campanhas novas.

## Saídas

Árvore e grupos identificáveis, população agregada, referências de escopo e permissões para M1–M3.

## Regras de negócio

- [DOC] Estrutura identifica quem existe em termos de grupos e onde trabalha; M1 recebe essa população.
- [MISSÃO] Contas de trabalhadores podem existir para acesso pessoal restrito; essa atualização substitui a restrição administrativa anterior da C0. Não cadastrar destinatários nominais de códigos nem participantes/respostas; população de grupo continua agregada, independente de contas existentes.
- [ARQ] Soma de populações das folhas forma denominadores dos ancestrais. Se distribuição por função/turno for desconhecida, cadastrar um grupo setorial sem detalhamento e não disponibilizar filtros fictícios.
- [ARQ] Grupo econômico/consultoria não elimina isolamento: empresa continua sendo a fronteira de autorização.

## Regras de bloqueio

Negar referências estruturais entre empresas, ciclos na árvore, população negativa/zero na publicação, grupos sobrepostos e exclusão física de estrutura referenciada. Permitir arquivamento e preservar descrição histórica. Negar usuário sem vínculo ativo ou permissão; múltiplos vínculos autorizados da mesma pessoa em empresas distintas são permitidos.

Negar referência de lotação de outra empresa, setor de outro estabelecimento, matrícula repetida na mesma empresa, vínculo duplicado, atribuição de papel por usuário sem gestão e alteração de identidade global ao vincular em outra empresa. Conta criada em Auth sem confirmação da gravação do vínculo não pode receber permissão por fallback: informar falha parcial sem devolver senha e permitir reconciliação controlada por identificador. Auth e transação PostgreSQL não são uma transação distribuída.

Nome/e-mail/matrícula/usuarioId/vinculoId não podem ser adicionados a respostas, tokens de participação ou contratos C0→M1→M2→M3. Não há aresta de cadastro nominal para resposta anônima.

## Dependências

Supabase Auth para identidade única dos quatro papéis; organizações e autorização. Não depende de M1–M3 para criar cadastros.

## Critérios de aceitação

- **CA-C0-01:** Dada empresa A, quando cadastrados estabelecimento/setor/função/turno, então formar grupo com caminho íntegro e população prevista.
- **CA-C0-02:** Dado usuário da empresa B, quando solicitar grupo de A por identificador, então negar sem expor seu conteúdo.
- **CA-C0-03:** Dada campanha publicada, quando setor muda de nome ou população, então preservar a fotografia da campanha e criar revisão futura.
- **CA-C0-04:** Dada estrutura referenciada por inventário, quando solicitada exclusão, então impedir exclusão física e permitir apenas arquivamento autorizado.
- **CA-C0-05:** Dados grupos de 8 e 12 na mesma partição, quando calculada população do setor, então resultar 20 sem contar o pai novamente.
- **CA-C0-06:** Dado gestor ativo, quando cadastra nome/e-mail/senha/matrícula válidos, então Auth gerencia e-mail/senha, o perfil guarda o nome e o vínculo guarda a matrícula; saída não contém senha.
- **CA-C0-07:** Dado usuário com matrícula 001 em A, quando autorizado seu vínculo em B com matrícula 072, então ambos coexistem sem alterar a identidade global; matrícula pode repetir entre empresas, mas não entre usuários da mesma empresa.
- **CA-C0-08:** Dada lotação opcional, quando setor pertence a outro estabelecimento ou qualquer referência pertence a outra empresa, então rejeitar antes de conceder vínculo; aceitar referências coerentes ou ausentes quando inaplicáveis.
- **CA-C0-09:** Dado token ausente/inválido, usuário sem vínculo, vínculo inativo ou ausência de atribuição ativa de gestor SST/RH, quando tenta cadastrar/vincular usuários, então negar; metadados de usuário não conferem privilégio.
- **CA-C0-10:** Dado cadastro, quando validação/Auth/persistência falham, então não expor senha, token, chave ou mensagem interna; falha após criar identidade não concede acesso por compensação permissiva.
- **CA-C0-11:** Dados perfis e vínculos nominais, quando preparada a integração M1, então manter respostas/tokens/contratos de agregação sem identidade nominal; preservar os 21 RFs de M1–M3.
- **CA-C0-12:** Dados formulários, quando preenchidos campos inválidos ou modificada empresa/estabelecimento, então orientar em PT-BR, limpar referências dependentes e nunca persistir senha no navegador.
- **CA-C0-13:** Dada empresa sintética, quando cadastrada com razão social e sem CNPJ/contatos opcionais, então aceitar e preservar status/datas, sem exigir dados reais.
- **CA-C0-14:** Dado grupo com referências de outra empresa ou setor de outro estabelecimento, quando salvo, então negar; aceitar grupo setorial sem função/turno quando não detalhados.
- **CA-C0-15:** Dada estrutura compartilhada por M1/M2/M3, quando arquivada após uso, então preservar referências e snapshots, sem duplicar cadastro ou apagar versões.
- **CA-C0-16:** Dado turno que cruza meia-noite com horários informados, quando cadastrado, então preservar ambos sem rejeitar apenas porque término é menor que início; horário isolado é inválido.

## Testes necessários

Unitários de árvore/partições; integração de autorização e persistência; E2E cadastro mínimo. Testar acesso entre empresas também por chaves relacionadas e documentos.

## Estado de implementação

**Concluído e testado no escopo acadêmico E1 com dados fictícios (2026-09-29).** Empresas, estrutura, grupos, lotação, arquivamento e snapshots foram exercitados com autorização e isolamento. A migração base e a incremental de auditoria `20260929000100` estão aplicadas no projeto remoto autorizado. O teste pós-migração confirmou gatilho e evento de snapshot em transação revertida; a matriz local cobriu 28 operações E1. Evidências e limites no [relatório E1](../../docs/validacao/relatorio-e1.md). Integração de snapshots com campanha/inventário pertence a E2/E4; esta conclusão não afirma prontidão para produção ou uso com dados reais.

## Observações

O bootstrap autenticado de empresa nova é autorizado pela Missão E1; faturamento e área pessoal M4 continuam fora do escopo. Ingresso em empresa existente ocorre por associação explícita de gestor, sem diretório público de identidades nem permissões globais.
