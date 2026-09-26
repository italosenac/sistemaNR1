# C0 — Estrutura organizacional mínima

## Origem documental

[M1](../../docs/fontes/M1.pdf), p.2, e [M2](../../docs/fontes/M2.pdf), p.2: “estabelecimento → setor → função → turno”. M1 p.2 informa que a população da coleta vem da Camada 0. A missão exige isolamento de empresas. Campos e permissões abaixo são [ARQ], derivados para viabilizar M1–M3; não são RFs adicionais extraídos da tabela.

## Objetivo

Definir onde estão os grupos expostos e a população esperada, sem cadastrar pessoas respondentes.

## Atores

Gestor da empresa; consultoria com vínculo autorizado; responsável técnico; leitor.

## Entradas

Empresa (nome fictício e identificador interno), estabelecimento (nome/localização sintética), setor, função, turno, grupo de exposição, população esperada inteira positiva, usuários administrativos e vínculos de acesso. Processos, ambientes e atividades descritos para o inventário. CNPJ real não é necessário para a demonstração.

### Cadastro de usuários — atualização solicitada em 2026-09-26

[MISSÃO] Cadastro com **nome completo, e-mail, senha e matrícula funcional**. Supabase Auth é responsável pela identidade, e-mail, autenticação, hash e gerenciamento de senhas. O perfil possui `usuarioId` referenciando Auth e `nomeCompleto`; não replica e-mail ou senha. A senha só transita no formulário/DTO de entrada até Auth, sem armazenamento em tabelas próprias, respostas, logs, URL ou armazenamento do navegador.

[MISSÃO] `VinculoDeAcesso` associa usuário à empresa e contém `matriculaFuncional`, papel, situação ativa e lotação opcional (`estabelecimentoId`, `setorId`, `funcaoId`, `turnoId`). Um usuário pode possuir vínculos e matrículas diferentes em empresas distintas. A matrícula não pertence ao perfil global nem aos metadados Auth.

[ARQ] Um vínculo por usuário/empresa; matrícula obrigatória, textual (preserva zeros iniciais), de 1 a 50 caracteres, única por empresa sem distinguir maiúsculas/minúsculas e sem espaços externos. Nome de 3 a 150 caracteres, e-mail válido, senha de 12 a 128 caracteres sem normalização silenciosa; a política do Supabase pode impor restrições adicionais. São decisões técnicas deste cadastro, não requisitos dos PDFs.

[ARQ] Gestor com vínculo ativo cadastra novas identidades e/ou associa uma identidade existente por seu identificador. Não há autoprovisionamento público de empresas ou concessão de papel por metadados editáveis. Associar usuário existente a outra empresa não troca nome global, e-mail ou senha. Primeiro gestor e empresa são provisionados por procedimento controlado, fora do formulário público. Novas contas não recebem confirmação de e-mail artificial; a ativação segue o procedimento controlado, sem envio de e-mail por esta execução.

[ARQ] Setor requer estabelecimento e deve pertencer a ele. Função/turno opcionais são referências da mesma empresa, sem transformar turno em propriedade universal da função. Lotação descreve o vínculo administrativo; não concede acesso a outra empresa, não produz automaticamente grupos/populações e não identifica participantes do M1.

## Processamento

Criar empresa → estabelecimentos → setores. Cadastrar funções e turnos na empresa; compor folhas por setor/função/turno. Para agregação, adotar caminho canônico empresa → estabelecimento → setor → função → turno, sem interpretar turno como propriedade universal de uma função. Células de população não se sobrepõem dentro da campanha: cada resposta pertence a uma folha. Congelar estrutura/população ao publicar campanha. Alterações posteriores criam revisão utilizada somente por campanhas novas.

## Saídas

Árvore e grupos identificáveis, população agregada, referências de escopo e permissões para M1–M3.

## Regras de negócio

- [DOC] Estrutura identifica quem existe em termos de grupos e onde trabalha; M1 recebe essa população.
- [ARQ] Não cadastrar lista nominal de empregados; usuários de gestão são pessoas autenticadas separadas das respostas.
- [ARQ] Soma de populações das folhas forma denominadores dos ancestrais. Se distribuição por função/turno for desconhecida, cadastrar um grupo setorial sem detalhamento e não disponibilizar filtros fictícios.
- [ARQ] Grupo econômico/consultoria não elimina isolamento: empresa continua sendo a fronteira de autorização.

## Regras de bloqueio

Negar vínculos entre empresas, ciclos na árvore, população negativa/zero na publicação, grupos sobrepostos e exclusão física de estrutura referenciada. Permitir arquivamento e preservar descrição histórica. Negar usuário sem vínculo ativo ou permissão.

Negar referência de lotação de outra empresa, setor de outro estabelecimento, matrícula repetida na mesma empresa, vínculo duplicado, atribuição de papel por usuário sem gestão e alteração de identidade global ao vincular em outra empresa. Conta criada em Auth sem confirmação da gravação do vínculo não pode receber permissão por fallback: informar falha parcial sem devolver senha e permitir reconciliação controlada por identificador. Auth e transação PostgreSQL não são uma transação distribuída.

Nome/e-mail/matrícula/usuarioId/vinculoId não podem ser adicionados a respostas, tokens de participação ou contratos C0→M1→M2→M3. Não há aresta de cadastro nominal para resposta anônima.

## Dependências

Supabase Auth para usuários de gestão; organizações e autorização. Não depende de M1–M3 para criar cadastros.

## Critérios de aceitação

- **CA-C0-01:** Dada empresa A, quando cadastrados estabelecimento/setor/função/turno, então formar grupo com caminho íntegro e população prevista.
- **CA-C0-02:** Dado usuário da empresa B, quando solicitar grupo de A por identificador, então negar sem expor seu conteúdo.
- **CA-C0-03:** Dada campanha publicada, quando setor muda de nome ou população, então preservar a fotografia da campanha e criar revisão futura.
- **CA-C0-04:** Dada estrutura referenciada por inventário, quando solicitada exclusão, então impedir exclusão física e permitir apenas arquivamento autorizado.
- **CA-C0-05:** Dados grupos de 8 e 12 na mesma partição, quando calculada população do setor, então resultar 20 sem contar o pai novamente.
- **CA-C0-06:** Dado gestor ativo, quando cadastra nome/e-mail/senha/matrícula válidos, então Auth gerencia e-mail/senha, o perfil guarda o nome e o vínculo guarda a matrícula; saída não contém senha.
- **CA-C0-07:** Dado usuário com matrícula 001 em A, quando autorizado seu vínculo em B com matrícula 072, então ambos coexistem sem alterar a identidade global; matrícula pode repetir entre empresas, mas não entre usuários da mesma empresa.
- **CA-C0-08:** Dada lotação opcional, quando setor pertence a outro estabelecimento ou qualquer referência pertence a outra empresa, então rejeitar antes de conceder vínculo; aceitar referências coerentes ou ausentes quando inaplicáveis.
- **CA-C0-09:** Dado token ausente/inválido, usuário sem vínculo, vínculo inativo ou papel leitor/técnico, quando tenta cadastrar/vincular usuários, então negar; metadados de usuário não conferem privilégio.
- **CA-C0-10:** Dado cadastro, quando validação/Auth/persistência falham, então não expor senha, token, chave ou mensagem interna; falha após criar identidade não concede acesso por compensação permissiva.
- **CA-C0-11:** Dados perfis e vínculos nominais, quando preparada a integração M1, então manter respostas/tokens/contratos de agregação sem identidade nominal; preservar os 21 RFs de M1–M3.
- **CA-C0-12:** Dados formulários, quando preenchidos campos inválidos ou modificada empresa/estabelecimento, então orientar em PT-BR, limpar referências dependentes e nunca persistir senha no navegador.

## Testes necessários

Unitários de árvore/partições; integração de autorização e persistência; E2E cadastro mínimo. Testar acesso entre empresas também por chaves relacionadas e documentos.

## Estado de implementação

**Parcialmente implementado — recorte de usuários/perfis/vínculos autorizado em 2026-09-26.** CA-C0-01 a CA-C0-05 mantidos; atualização não conclui E1 inteiro. Migração preparada sem aplicação, conforme restrição do usuário. Código/DTOs/formulários e testes locais em [evidências](../../docs/evidencias/c0-usuarios.md). Evidência de persistência/RLS depende de autorização para aplicar e executar testes no banco de teste.

## Observações

Autoprovisionamento público de empresas, faturamento, convites por e-mail e gestão nominal de empregados estão fora do escopo. A primeira conta administrativa será criada por procedimento controlado da futura demonstração.
