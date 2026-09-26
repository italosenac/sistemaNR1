# C0 — Estrutura organizacional mínima

## Origem documental

[M1](../../docs/fontes/M1.pdf), p.2, e [M2](../../docs/fontes/M2.pdf), p.2: “estabelecimento → setor → função → turno”. M1 p.2 informa que a população da coleta vem da Camada 0. A missão exige isolamento de empresas. Campos e permissões abaixo são [ARQ], derivados para viabilizar M1–M3; não são RFs adicionais extraídos da tabela.

## Objetivo

Definir onde estão os grupos expostos e a população esperada, sem cadastrar pessoas respondentes.

## Atores

Gestor da empresa; consultoria com vínculo autorizado; responsável técnico; leitor.

## Entradas

Empresa (nome fictício e identificador interno), estabelecimento (nome/localização sintética), setor, função, turno, grupo de exposição, população esperada inteira positiva, usuários administrativos e vínculos de acesso. Processos, ambientes e atividades descritos para o inventário. CNPJ real não é necessário para a demonstração.

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

## Dependências

Supabase Auth para usuários de gestão; organizações e autorização. Não depende de M1–M3 para criar cadastros.

## Critérios de aceitação

- **CA-C0-01:** Dada empresa A, quando cadastrados estabelecimento/setor/função/turno, então formar grupo com caminho íntegro e população prevista.
- **CA-C0-02:** Dado usuário da empresa B, quando solicitar grupo de A por identificador, então negar sem expor seu conteúdo.
- **CA-C0-03:** Dada campanha publicada, quando setor muda de nome ou população, então preservar a fotografia da campanha e criar revisão futura.
- **CA-C0-04:** Dada estrutura referenciada por inventário, quando solicitada exclusão, então impedir exclusão física e permitir apenas arquivamento autorizado.
- **CA-C0-05:** Dados grupos de 8 e 12 na mesma partição, quando calculada população do setor, então resultar 20 sem contar o pai novamente.

## Testes necessários

Unitários de árvore/partições; integração de autorização e persistência; E2E cadastro mínimo. Testar acesso entre empresas também por chaves relacionadas e documentos.

## Estado de implementação

**Pendente.** Nenhum teste funcional executado.

## Observações

Autoprovisionamento público de empresas, faturamento, convites por e-mail e gestão nominal de empregados estão fora do escopo. A primeira conta administrativa será criada por procedimento controlado da futura demonstração.
