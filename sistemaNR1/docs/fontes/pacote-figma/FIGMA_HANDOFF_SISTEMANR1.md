# Handoff do Figma para o Codex — sistemaNR1

> Documento de referência para anexar ao chat do Codex no VS Code. Extraído por leitura do Figma conectado em 28/09/2026. **Não é um arquivo `.fig` nativo**, nem uma implementação concluída. Consolida as páginas/nós efetivamente acessíveis, os valores observados, a biblioteca de componentes e os ajustes necessários para respeitar as SPECs do sistemaNR1.

## 1. Origem e escopo verificado

- **Projeto no Figma:** [Plataforma NR-1](https://www.figma.com/design/cGW4JPUdRYtAME048NAU5I/Plataforma-NR-1?node-id=46-9)
- **File key:** `cGW4JPUdRYtAME048NAU5I`
- **Nó fornecido:** `46:9`, apenas o título da capa. A inspeção prosseguiu para a estrutura real do arquivo e para seus componentes.
- **Páginas efetivamente retornadas pela conexão:** `0:1` — 00 Cover & Guidelines; `3:247` — 03 Components / Core; `3:249` — 05 Components / Feedback & Security.
- A capa **descreve** outras seções (Foundations, Variables & Tokens, Data & Forms, Patterns, Desktop/Mobile Templates, Role Flows, Motion, Accessibility e Handoff), mas elas **não constavam da listagem de páginas acessíveis**. Não assumir que esses layouts estejam disponíveis ou prontos.
- Componentes referenciados em outras páginas podem ser expostos como instâncias dentro das três páginas acessíveis. Citar o nó real ao consultar detalhes.

### Nós de referência para pedir ao Figma MCP no Codex

| Nó | Nome observado | Link para o Figma |
|---|---|---|
| `46:2` | Cover, visão geral da linguagem visual | [Capa](https://www.figma.com/design/cGW4JPUdRYtAME048NAU5I/Plataforma-NR-1?node-id=46-2) |
| `46:131` | Guidelines, princípios de UX | [Diretrizes](https://www.figma.com/design/cGW4JPUdRYtAME048NAU5I/Plataforma-NR-1?node-id=46-131) |
| `7:184` | Button/Primary, tamanhos e estados | [Botão primário](https://www.figma.com/design/cGW4JPUdRYtAME048NAU5I/Plataforma-NR-1?node-id=7-184) |
| `7:366` | Button/Secondary | [Botão secundário](https://www.figma.com/design/cGW4JPUdRYtAME048NAU5I/Plataforma-NR-1?node-id=7-366) |
| `8:389` | Input/Field, validações | [Campo](https://www.figma.com/design/cGW4JPUdRYtAME048NAU5I/Plataforma-NR-1?node-id=8-389) |
| `12:377` | Navigation/Sidebar Item | [Menu lateral](https://www.figma.com/design/cGW4JPUdRYtAME048NAU5I/Plataforma-NR-1?node-id=12-377) |
| `15:355` | Card/Metric | [Card de métricas](https://www.figma.com/design/cGW4JPUdRYtAME048NAU5I/Plataforma-NR-1?node-id=15-355) |
| `10:170` | Badge/Risk | [Classes de risco](https://www.figma.com/design/cGW4JPUdRYtAME048NAU5I/Plataforma-NR-1?node-id=10-170) |
| `10:274` | Badge/Context | [Contextos](https://www.figma.com/design/cGW4JPUdRYtAME048NAU5I/Plataforma-NR-1?node-id=10-274) |
| `11:528` | Security/Anonymity Banner | [Banner de anonimato](https://www.figma.com/design/cGW4JPUdRYtAME048NAU5I/Plataforma-NR-1?node-id=11-528) |
| `11:278` | Alert/Inline | [Alertas](https://www.figma.com/design/cGW4JPUdRYtAME048NAU5I/Plataforma-NR-1?node-id=11-278) |
| `17:701` | Overlay/Modal | [Modal](https://www.figma.com/design/cGW4JPUdRYtAME048NAU5I/Plataforma-NR-1?node-id=17-701) |

## 2. Diretrizes do próprio Figma

A página Guidelines define estes princípios (texto de referência condensado):

1. **Confiável antes de bonito:** dar prioridade à clareza de dados de SST, privacidade, anonimato e auditoria. Não deixar a decoração competir com as informações.
2. **Sério, humano e tecnológico:** interface acolhedora, linguagem direta, sem juridiquês e sem atribuir culpa ao usuário.
3. **Filas, não módulos:** pessoas com funções técnicas devem começar pelo que necessita de ação (decidir, agir, aguardar e acompanhar).
4. **Privacidade visível:** mostrar o selo de anonimato na coleta e explicar bloqueios de resultados por amostra insuficiente.
5. **Mobile reorganiza, não encolhe:** usar cartões, listas, bottom sheets e uma ação principal por bloco quando em campo.
6. **Cor tem significado:** distinguir níveis de risco ocupacional de erros ou estados do software; sempre complementar cores com texto e ícones.

**Evitar, conforme o Figma:** glassmorphism excessivo, sombras pesadas, gradientes decorativos, excesso de bordas, estética hospitalar fria, linguagem de jogo, cores de risco como decoração, placeholders no lugar de labels e ações críticas representadas apenas por ícones.

A capa especifica **tema claro**, **Inter Variable**, **Lucide** e a intenção **WCAG 2.1 AA**. A conformidade de acessibilidade da implementação ainda precisa ser testada; a indicação no Figma não comprova conformidade do produto.

## 3. Design tokens confirmados

Valores abaixo foram obtidos das definições retornadas pelo Figma para a capa e badges. O arquivo `design-tokens-figma.css` que acompanha este handoff contém a versão importável dos valores.

### Cores — fundação

| Token | Valor | Finalidade |
|---|---|---|
| `--color-bg-canvas` | `#F6F7F8` | Fundo do aplicativo |
| `--color-bg-surface` | `#FFFFFF` | Superfícies e cards |
| `--color-bg-brand` | `#2563EB` | Azul principal |
| `--color-text-primary` | `#111827` | Conteúdo primário |
| `--color-text-secondary` | `#4B5563` | Conteúdo secundário |
| `--color-text-tertiary` | `#6B7280` | Conteúdo terciário |
| `--color-text-brand` | `#1D4ED8` | Texto de marca |
| `--color-border-subtle` | `#E5E7EB` | Bordas discretas |
| `--color-border-strong` | `#CBD5E1` | Bordas reforçadas |
| `--color-bg-privacy` | `#EEF2FF` | Fundo de privacidade |
| `--color-text-privacy` | `#4338CA` | Texto de privacidade |
| `--color-border-privacy` | `#E0E7FF` | Borda de privacidade |
| `--color-bg-audit` | `#F5F3FF` | Fundo de auditoria |
| `--color-text-audit` | `#6D28D9` | Texto de auditoria |
| `--color-bg-success` | `#ECFDF3` | Sucesso |
| `--color-text-success` | `#116A47` | Texto de sucesso |

### Cores — risco ocupacional (não confundir com status do aplicativo)

| Nível visual do Figma | Fundo | Texto | Contorno sólido |
|---|---|---|---|
| Baixo | `#ECFDF3` | `#116A47` | `#116A47` |
| Moderado | `#ECFEFF` | `#0E7490` | `#0E7490` |
| Alto | `#FFF4ED` | `#9A3412` | `#C2410C` |
| Crítico | `#FEF2F2` | `#991B1B` | `#B91C1C` |

**Observação:** as classificações e células reais de risco devem ser definidas pelo motor e pelos critérios versionados de M2. O componente visual `Badge/Risk` não autoriza impor quatro classificações fixas às regras configuráveis da empresa.

### Tipografia, dimensões e elevação observadas

- Família: **Inter** (a capa menciona Inter Variable; não incluir arquivos de fonte sem licença ou necessidade).
- `Label/S`: 12px, line-height 16px, peso 500.
- `Label/M`: 14px, line-height 20px, peso 500.
- `Body/S`: 12px, line-height 18px, peso 400.
- `Body/M`: 14px, line-height 20px, peso 400.
- `Heading/H3`: 20px, line-height 28px, peso 600.
- `Data/L`: 28px, line-height 34px, peso 600, valor numérico com dígitos tabulares na aplicação.
- `--radius-lg`: 16px; sombra do primeiro nível: discreta, em torno de `rgba(17,24,39,.06)`.
- **Fallbacks observados no código dos componentes (não confundidos com variáveis globais publicadas):** raio de controle 10px; altura dos botões S=32px, M=40px e L=48px; marca em hover `#1D4ED8` e pressionado `#1E40AF`; campos podem sinalizar foco com `#2563EB`, erro com `#DC2626` e sucesso com `#168B5B`.

## 4. Biblioteca de componentes observada

### Componentes Core (página `3:247`)

- Botões: `Button/Primary`, `Secondary`, `Ghost`, `Destructive`, `Link`, `Icon Only`.
- Botão primário: tamanhos **S/M/L**, estados **Default/Hover/Pressed/Focus/Disabled/Loading**, ícones opcionais.
- Campos: `Input/Field`, `Input/Textarea`, `Input/OTP`.
- `Input/Field`: tamanhos **M/L**; estados **Default, Hover, Focus, Filled, Error, Warning, Success, Disabled, Read-only**; rótulo visível e texto auxiliar.
- Controles: Checkbox, Radio e Switch.
- Navegação: Sidebar Item, Top Tab, Segmented Control, Breadcrumb, Bottom Nav, Pagination e Stepper.
- Sidebar Item: **Default/Hover/Active/Focus/Disabled**, com modo recolhido e badge opcional.
- Cards: Metric, Action, Queue Item, Risk, Campaign, Measure, Worker Task, Notification, Organization, Evidence, Document, Training e Feedback.
- Sobreposições: Modal e Confirmation Modal.

### Feedback & Security (página `3:249`)

- Badges de status: Neutral, Brand, Success, Warning, Danger, Info, Privacy e Audit.
- Badges de risco: Low, Moderate, High e Critical; estilos **Subtle/Solid** e tamanhos **S/M**.
- Badges de contexto: Anonymity, Identified, Due date, Overdue, Synced, Saved on device, Sending, Offline, Sync failed, Audit, Read-only, Tenant context, Break-glass e Stale.
- `Security/Anonymity Banner`: estados **Collapsed, Expanded, Threshold blocked**. Não animar indicadores de privacidade.
- Alert/Inline: Info, Warning, Error, Success, Privacy e Restricted; também há Banner/Persistent e Toast.
- Há exemplos de componentes de break-glass e sincronização offline no design; **não implementar privilégios emergenciais nem offline funcional sem SPEC, backend e testes apropriados**.

## 5. Diferenças obrigatórias entre Figma e sistemaNR1

**As SPECs e a implementação real prevalecem sobre os textos demonstrativos do Figma.**

| Exemplo no Figma | Regra efetiva do sistemaNR1 | Ação no código |
|---|---|---|
| Banner de coleta: “5 pessoas ou mais” | **Mínimo de 7 respostas por grupo**, configurável somente para cima. | Corrigir todos os textos; impor bloqueio/mascaramento também no Nest e no banco, não apenas no componente. |
| Capa: “8 perfis” | **4 papéis na E1:** trabalhador, gestor SST/RH, responsável técnico e consultoria. | Não criar perfis adicionais, acessos ou telas fictícias a partir da capa. |
| Capa: “66 user stories” | **21 RFs originais detalhados:** M1 (7), M2 (8), M3 (6). | Não ampliar escopo automaticamente. |
| Mockups de métricas e riscos | Os valores devem derivar de dados agregados autorizados e avaliações técnicas M2. | Nunca apresentar números ou resultados de demonstração como dados reais. |
| Badge de documento/status “Signed” | Hash SHA-256 não é assinatura. | Mostrar “Rascunho não assinado” até existir assinatura real verificável. |

## 6. Aplicação no repositório existente

**Stack conhecida da E1:** Next.js 16, React 19, TypeScript strict, Tailwind, shadcn/ui; backend NestJS 12 e Supabase. Verificar o código atual antes de editar — este documento é um handoff, não uma captura dos arquivos locais de hoje.

1. Ler `AGENTS.md`, README, arquitetura, relatório E1 e as SPECs pertinentes. Respeitar os arquivos que já existem, o estado do Git e as Skills locais.
2. Mapear os tokens deste arquivo aos tokens **semânticos existentes** de shadcn/ui/Tailwind; evitar múltiplas fontes de verdade. O CSS anexo é referência de integração, **não** deve ser importado sem verificar conflitos e a versão Tailwind instalada.
3. Criar ou reutilizar os componentes básicos antes das telas M1–M3, mantendo suas props, acessibilidade e comportamentos nativos. Componentes Figma retornam exemplos JSX visuais, **não** backend funcional.
4. Adaptar primeiro o layout global, login, dashboard, seleção de empresa e navegação existentes sem alterar guards nem modelos de autorização.
5. Nas novas telas: M1 campanha/questionário/banner de anonimato; M2 matriz/memória/mapa de calor; M3 inventário/tabelas/versões/PDF.
6. Responsividade: sidebar desktop, navegação apropriada ao celular, reagrupamento de cards e tabelas legíveis; não reduzir uma página desktop proporcionalmente.
7. Verificar contraste, foco visível, teclado, estados de erro e mensagens em PT-BR. Cor de risco deve vir acompanhada de nome e/ou ícone.
8. **Não tocar migrações remotas** sem autorização explícita; o design nunca pode afrouxar RLS, regras de anonimato ou permissões.

### Mapeamento sugerido (confirmar a estrutura real antes de criar arquivos)

| Peça Figma | Base provável | Uso no produto |
|---|---|---|
| Botões/inputs/dialogs | shadcn/ui já instalado | Formulários e confirmações |
| `Navigation/Sidebar Item` | Sidebar/navegação atual | Contexto empresarial e tarefas |
| `Card/Metric` | `Card` existente | Adesão e indicadores agregados M1 |
| `Badge/Risk` | `Badge` especializado | Riscos classificados M2 |
| `Security/Anonymity Banner` | Componente específico acessível | Pesquisa pública M1 (limiar 7) |
| `Card/Document` + status | Cards + tabela | Inventários M3 |

## 7. Como anexar ao chat do VS Code

**Mais simples:** anexe `FIGMA_HANDOFF_SISTEMANR1.md` ao chat do Codex/VS Code ou coloque o arquivo dentro de `docs/design-system/` do repositório e faça referência explícita a ele na solicitação.

**Com CSS e inventário:** descompacte `FIGMA_SISTEMANR1_PACOTE.zip` em uma pasta de referências do projeto. Leia `PROMPT_PARA_CODEX.txt` e use-o como mensagem inicial. O CSS e o JSON que acompanham o Markdown são materiais de trabalho, não código já instalado.

Se o Codex tiver acesso ao Figma MCP, dê preferência às consultas dos nós específicos listados acima para obter screenshots e assets oficiais. Referências a URLs temporárias retornadas pelo MCP não devem permanecer no código final: baixar os assets necessários para o repositório. Este pacote **não inclui uma exportação `.fig` nem screenshots oficiais**; as imagens do MCP estavam disponíveis por URLs temporárias que não puderam ser transferidas para o ambiente de geração do pacote. Isso não impede o uso deste Markdown para implementação.

**Escopo técnico:** o Design System foi documentado com base nas três páginas acessíveis e em consultas focalizadas dos componentes indicados. Qualquer nova página publicada no Figma deverá ser inspecionada antes de alegar fidelidade visual a ela.
