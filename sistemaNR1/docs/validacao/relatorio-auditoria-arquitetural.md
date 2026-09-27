# Relatório — auditoria e consolidação arquitetural

Execução: 2026-09-26 a 2026-09-27. Escopo: auditoria multiempresa e Missão A, limpeza delimitada e reconfirmação da conexão Supabase. Base Git inicial `5cfbfe8`; revisão observada no fechamento `03b42ca`, branch `italo_SDD`; raiz Git em `MVP`. Houve avanço do HEAD durante o trabalho, preservado sem reset. Nenhum commit, push, deploy ou aplicação de migração foi realizado pelo agente nesta entrega.

## 1. Repositório e fontes consultados

`git status --short` foi executado antes das alterações. Já havia arquivos rastreados modificados e entradas não rastreadas do recorte C0 anterior. Não foi feito reset ou sobrescrita desse trabalho. O comportamento funcional e o SQL anteriores foram preservados; ajustes de teste/formatação e exclusões de limpeza estão discriminados abaixo. A integridade dos RFs/PDFs/Skills foi conferida contra os hashes históricos disponíveis.

Lidos AGENTS, README, backlog, matriz, pendências, processo SDD, todos os documentos de arquitetura, relatórios/validador/manifestações de preservação, SPEC do produto, C0 e as 21 SPECs M1/M2/M3; as três Skills; fontes de autenticação, guard, DTOs, controller, serviços/portas, repositório, contratos, formulários, configuração e testes preparados. Aplicadas as Skills de revisão e validação de negócio, sem ampliar escopo para implementação.

Os quatro PDFs foram abertos com PyMuPDF 1.28.2 em ferramenta temporária: M1 (3 páginas), M2 (3), M3 (2) e arquitetura-schemas (5). As duas primeiras páginas M2 contêm imagens, também conferidas visualmente nas prévias preservadas. O novo PDF foi extraído integralmente, com manifesto próprio; os três originais e seu manifesto não foram alterados. [Compatibilidade das 18 tabelas](../arquitetura/compatibilidade-schemas.md).

## 2. Arquitetura efetivamente encontrada

E0 possui Next/Nest strict, pnpm, saúde HTTP, erros/DTO/CORS/Swagger, contratos, testes e builds. O recorte C0 anterior acrescentou login Supabase, verificação getUser, criação Auth no backend, perfil com nome, vínculos com matrícula/papel/lotação, formulário `/usuarios`, SQL não aplicado e testes locais com portas substituídas. Não existe implementação M1–M3, Storage ou prova real de RLS.

## 3. Achados e tratamento

| Achado / localização | Efeito | Tratamento nesta auditoria / próxima E1 |
| --- | --- | --- |
| `packages/contratos/src/usuarios.ts:1`, DTO/formulário e SQL: três papéis anteriores | Não representa os quatro perfis nem papéis simultâneos | Matriz/catálogo definidos; código preservado; adaptar contrato, persistência e tela conjuntamente |
| `apps/api/src/apresentacao/usuarios.dto.ts:29`, formulário e `vinculos` NOT NULL | Conta exige matrícula, incompatível com Missão A | Alvo nullable, vazio→NULL, único quando preenchido; testes antigos serão adaptados |
| SQL `perfis_usuarios` e `vinculos` | Perfil sem status/datas; lotação/papel embutidos; estrutura/grupos incompletos | Entidades, chaves, índices e transição definidos; nenhuma migração nova criada |
| `RepositorioUsuariosPostgres.exigirGestor`, RLS `tem_vinculo` | Autorização fixa em gestor; SELECT genérico por vínculo não representa trabalhador/atribuições | Capacidades por operação, status global/empresa/vínculo, concessão/revogação e testes reais no plano E1 |
| Grants/SECURITY DEFINER e contexto do pool | Revisão estática não prova privilégios efetivos nem isolamento operacional | Preservar mínimo privilégio, ampliar testes negativos e positivos em banco de teste autorizado |
| Trigger de perfil exige `nome_completo` e não reconcilia contas anteriores | Criação/associação pode falhar se metadado/perfil estiver ausente | P-14 e cenários de bootstrap/reconciliação; não contornar com acesso permissivo |
| Auth e vínculo têm commits independentes | Pode haver conta criada sem confirmação de vínculo | Preservar `CADASTRO_PARCIAL`; não afirmar rollback de commit incerto |
| PDF p.1 põe senha_hash/empresa/papel no usuário | Credencial própria e tenant global impedem o caso multiempresa | Adaptado a Auth + perfil + vínculos + atribuições + lotações |
| PDF omite entidades/regras e usa “assinatura SHA-256” | Simplificação perderia tokens, memória, versões e significado de assinatura | 18 linhas de compatibilidade, fontes originais preservadas e ADR-14 |
| Validador antigo percorre dependências e proíbe aplicação existente | Falsos erros após E0 | Reprodução: 7.998 Markdown e 16.317 erros, saída 1; validador atualizado para escopo próprio com modo histórico explícito |
| Documentos antigos ainda afirmavam ausência de código/conexão | Estado atual ambíguo | Atualizados documentos operacionais; relatórios históricos preservados como evidência de sua etapa |

## 4. Modelo consolidado e permissões

Supabase Auth exclusivo → perfil global com nome/status/datas → vínculos por empresa com matrícula opcional → atribuições de quatro papéis e lotação dependentes do vínculo. Identificação profissional opcional/restrita, sem CPF indiscriminado. Lotação não depende do papel. Uma identidade pode ser gestora em A e técnica em B ou ter atribuições combinadas explicitamente na mesma empresa.

Consultoria possui carteira derivada somente de vínculos ativos. O papel isolado não concede gestão/atuação técnica: exige atribuições adicionais na empresa. Trabalhador lê seu perfil e não precisa de conta para responder M1. Autorização de empresa/estado/capacidade é aplicada no Nest e reforçada por RLS/grants; revogação não depende de esperar expiração do JWT. [Modelo de identidade](../arquitetura/modelo-identidade.md), [matriz](../arquitetura/matriz-permissoes.md) e [isolamento](../arquitetura/isolamento-multiempresa.md).

## 5. Preservação de M1–M3 e propostas futuras

Os 21 RFs não foram alterados. M1 mantém campanha/grupos/instrumento/perguntas/token/resposta/indicadores/registro de consulta e fotografia agregada versionada. Sem login nominal, destinatário do código, resposta↔token ou ligação a perfil/vínculo/lotação; k≥7 e proteções complementares permanecem.

M2 mantém critério/versão/matriz/células/avaliação/memória/consequências/decisão/justificativa. JSONB é seletivo para configuração e snapshot, sem substituir FKs/validação/imutabilidade. M3 mantém nove alíneas, perigo/fonte/circunstância/agravo/grupo/medida, integração geral, inventário/versões/diferenças, responsável e artefatos privados. Hash não é assinatura; M3 não recalcula M2.

CicloReferencia é dependência conceitual futura, opcional e da mesma empresa/estabelecimento; nenhuma tabela/automação M5 na E1. M4 Ação/Evidência e área pessoal, M5 Aferição e M6 Comunicado/Recibo permanecem propostas com pendências. Não foram especificados agenda, histórico pessoal, planos individualizados ou vínculo com respostas anônimas.

## 6. Arquivos alterados e limpeza

Criados: `specs/camada-0/usuarios-perfis.spec.md`; `docs/arquitetura/modelo-identidade.md`, `matriz-permissoes.md`, `isolamento-multiempresa.md`, `compatibilidade-schemas.md`; extração e manifesto do PDF complementar; este relatório.

Atualizados: README; SPEC produto/C0 estrutura; modelo de domínio, contratos, decisões (ADR-13/14), segurança, visão geral e integrações MCP; backlog, matriz, pendências, processo SDD; validador documental; relatório de conexão. AGENTS e Skills preservados. A E1 anterior continua descrita em sua evidência histórica, não foi substituída por uma alegação de implementação do alvo novo.

Dois ajustes mínimos no código existente: `tests/fundacao.spec.ts` passou a esperar o título `SISNR1`, já presente na página versionada, mantendo as demais verificações; `apps/web/src/app/layout.tsx` recebeu somente a quebra de linha exigida pelo Prettier, sem alterar o texto ou comportamento. Nenhum contrato, DTO, formulário de usuários, regra de negócio ou SQL foi modificado por esta auditoria.

Removidos nove arquivos comprovadamente dispensáveis: `hello.txt` (somente “hello world”, sem uso funcional), `apps/web/public/{file,globe,next,vercel,window}.svg` (assets do scaffold sem referência) e `.gitkeep` em `apps/api/src/aplicacao`, `apps/api/src/dominio` e `supabase/migrations` (pastas já preenchidas). A referência histórica a hello no manifesto E0 foi mantida; a exclusão é desta auditoria. Não foram removidos fontes, extrações, capturas de evidência, arquivos de ambiente, lockfile, dependências, instruções geradas do Next ou implementação C0.

## 7. Validação e conexão

Comandos executados nesta auditoria, sobre a revisão indicada e as alterações locais descritas. Validação documental e testes existentes não comprovam implementação do novo modelo de quatro papéis.

| Comando / conferência | Resultado e alcance |
| --- | --- |
| `python docs/validacao/validar-documentacao.py` | APROVADO, saída 0; 21 RFs, 13 seções por SPEC, 87 critérios RF e 32 C0, 62 Markdown; referências locais, fontes e quatro papéis verificados |
| Exercício do validador em cópia temporária | Sete cenários aprovados: projeto válido; dependências ignoradas; link quebrado detectado; RF ausente detectado; PDF alterado detectado; papel consultoria ausente detectado; modo documental inicial rejeita scaffold. Cópia temporária removida |
| SHA-256 contra `preservacao-e0.json` | 27 arquivos idênticos: 21 SPECs RF, três PDFs originais e três Skills; nenhuma divergência |
| `pnpm.cmd typecheck` | Saída 0 |
| `pnpm.cmd lint` | Saída 0 |
| `pnpm.cmd test` | Saída 0 na repetição após ajustar a expectativa do título; 44 testes Jest (quatro suítes) e 13 Playwright aprovados |
| `pnpm.cmd build` | Saída 0; contratos, NestJS e Next.js construídos |
| `pnpm.cmd format:check` | Saída 0 após ajuste de espaçamento no layout |
| `git diff --check` | Saída 0 |
| Ambientes locais e Git | Variáveis necessárias presentes; URLs correspondem ao projeto autorizado; publicáveis coincidem; nova chave secreta somente no backend; ambientes e metadados locais do vínculo ignorados, ambientes não rastreados |
| Busca pela chave secreta atual | Zero ocorrências nos arquivos versionáveis e nos 155 artefatos de frontend examinados; nenhum valor exibido |
| Supabase CLI 2.118.0 | Sessão existente autenticada; projeto autorizado encontrado e ativo; vínculo reconfirmado com saída 0 |
| `supabase db query --linked "SELECT 1 AS conexao_ok" --output json` | Saída 0; constante confirmada, sem consulta a dados de negócio |
| HTTP Auth / Data API | Auth com chave publicável: 200; Data API com chave de backend: 200; raiz da Data API com chave publicável: 401, sem ampliar permissões nem inferir causa |

A primeira execução dos testes encontrou somente a expectativa antiga `SistemaNR1`, enquanto a página já exibia `SISNR1`; os outros 56 testes passaram. A correção alinhou o teste ao conteúdo existente e a suíte completa foi repetida. O primeiro `format:check` apontou apenas a quebra de linha do layout, corrigida e verificada novamente. Typecheck, lint, teste e build precederam esse último ajuste exclusivamente de espaçamento.

O CLI foi executado pelo entrypoint instalado, capturando stdout/stderr e emitindo somente indicadores sanitizados. A conexão remota foi reconfirmada em 2026-09-27; detalhes e limites em [conexão Supabase](conexao-supabase.md). A autenticação já disponível foi reutilizada, sem novo token/login interativo.

**Limites:** `DATABASE_URL` de runtime permanece ausente. O sucesso via CLI/Management API e das consultas HTTP não comprova conexão PostgreSQL restrita da aplicação, persistência, RLS, grants, isolamento transacional, Storage ou jornada de login do produto. Não foram executadas suítes SQL nem aplicadas migrações, seeds, criação de usuários ou alterações no banco remoto. Os 57 testes existentes validam o recorte anterior; a matriz nova exige os testes reais planejados para E1.

## 8. Riscos e preparação da E1

Arquitetura e SPECs preparadas para orientar a E1 revisada. Implementação permanece **Parcialmente implementado**, porque código/SQL anteriores divergem do alvo e banco/RLS não foram validados. Mudanças de contrato `papel`→atribuições, matrícula opcional, novas chaves/estados e extração de lotação exigem atualização coordenada. A migração antiga não deve ser aplicada como se atendesse a Missão A.

P-12–16 registram área pessoal futura, conversão de `leitor`, bootstrap/ativação, banco restrito/RLS e ciclo/M5/M6. P-06/P-09 continuam restringindo assinatura e uso de dados reais. Próxima execução depende de **novo prompt E1 e permissão do usuário**, solicitados após encerrar esta auditoria e conferir Supabase. A proibição de aplicar migrações permanece vigente.
