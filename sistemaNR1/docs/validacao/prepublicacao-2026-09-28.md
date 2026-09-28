# Pré-publicação acadêmica — auditoria sem alteração remota

Data: 2026-09-28. Projeto vinculado: `sfutycdmcjsvmfrvtxam`. Escopo exclusivo: preparação da jornada fictícia M1→M2→M3→PDF. Nenhuma migração E2–E4 foi aplicada remotamente, e nenhum push, deploy, seed, envio de e-mail ou alteração de permissões foi executado nesta auditoria.

## Histórico e integridade

`supabase migration list --linked`, com telemetria desativada e saída sanitizada, confirmou `20260927000100` nas colunas local e remota. As dez versões `20260928000100` a `20260928001000` aparecem somente no lado local. O SHA-256 local da E1 é `87eb6fd542d23fdd986aeb427539b945524a4ef1bd429487f916b13c1dd25b8b`, igual ao registrado na aplicação autorizada de E1. A listagem do CLI informa versões, não um checksum remoto independente do SQL aplicado.

| Migração local pendente | SHA-256 do arquivo nesta revisão |
| --- | --- |
| `20260928000100_m1_base_coleta.sql` | `a0ee4963b07e6a6a05919fccb51db03c69514f34d706669ca63319521b4b8b21` |
| `20260928000200_m1_fluxo_transacional.sql` | `2a27a4ea29aafdc5869f74e0fad297581d7e6a6491a618f108402ebf2e7c1f39` |
| `20260928000300_m1_fotografia_agregada.sql` | `e23f23621cdfb7d82a8e04434c87d5fd72f5207da9a7b2dee36d2143ea1b29a4` |
| `20260928000400_m2_criterios_resultados.sql` | `aa3e5aa2326f959405c62e47a38ccea1d6049bf7522ff46cb63ccb43d5a69401` |
| `20260928000500_m2_validacoes.sql` | `c70bde87a568aaf57037534f3823d292f0f75217cd0cdc169bdeb4fad6bca92a` |
| `20260928000600_m2_validacao_publica_runtime.sql` | `ba250f38c332742dc696abaee89e6bc705553e33d68790a8af1a658e6c214f89` |
| `20260928000700_m2_matriz_operadores.sql` | `0ea586fc6e86fbe78a6e65b6df603a7176055f9167db0b3b5bc5d9d4b4984510` |
| `20260928000800_m2_hash_matriz.sql` | `e8b392bcc90f26a4e33a8b2d16bac0b3560e0a92b4daa4ecd39dad80a1a20ff7` |
| `20260928000900_m3_inventario_integrado.sql` | `5ed63ae35deac439aa5340b96515e064af9a16f9fc327eb70571d959549ea6a4` |
| `20260928001000_documentos_download_restrito.sql` | `1f93a7c2a346cfff1ad55fecc6081b118f79bb9969dc4f57c00f45b692177562` |

## Dependências, operações e segurança

As versões são sequenciais: M1 base→funções→fotografia; M2 critérios→validações→grant específico→correção da matriz→hash; M3 inventário→downloads privados. A E1 remota fornece `organizacao`, funções de contexto, entidades organizacionais, grupo `sistemanr1_api` e login runtime restrito. A migração `00100` adiciona duas chaves únicas compostas a `organizacao.grupos` e `organizacao.estruturas_congeladas`; essas operações exigem trava/varredura nas tabelas existentes, mas não removem dados. A migração `00400` adiciona chave única à fotografia M1; `00500` renomeia duas funções M2 para versões internas e revoga sua execução direta do runtime; `00700` substitui somente o corpo do validador M2. Não há `DROP`, `TRUNCATE`, `DELETE` de dados, criação/alteração de login ou role nas dez migrações. Cada arquivo contém um par `BEGIN`/`COMMIT`.

As nove novas tabelas empresariais usam RLS e `FORCE ROW LEVEL SECURITY`. Os schemas `coleta`, `avaliacao` e `inventario` retiram acesso de `public`, `anon` e `authenticated`; o runtime recebe `USAGE` e grants delimitados. Códigos, respostas individuais, taxas internas, fotografias agregadas e bytes de PDF não têm leitura direta pelo runtime. Funções `SECURITY DEFINER` usam `search_path=''`; operações administrativas validam empresa e papel, e o envio anônimo valida o código de uso único. A execução é concedida apenas ao grupo API nas funções necessárias; as funções de alteração interna não permanecem executáveis diretamente pelo login runtime. Os downloads revalidam o vínculo ativo. A implementação local testou isolamento multiempresa e reuso/concorrência de código. A política de agregação não resolve comparação temporal entre campanhas; o MVP permanece restrito a dados fictícios.

## Checagens locais e implantação proposta

`pnpm.cmd test:coleta:local` passou com Auth/Nest/PostgreSQL locais: coleta anônima, rollback, reuso, concorrência, agregação, M2, M3, PDF e isolamento. `node scripts/testar-m2-validacoes-local.mjs` passou para seis matrizes e grants mínimos. Build local dos contratos e da API passou; o comando de build da web passou executado a partir de `apps/web` e gerou as rotas M1–M3. `apps/api/dist/main.js` existe e passou em `node --check`. O lint da API e `git diff --check` passaram. A instalação limpa e o start dentro de Render/Vercel ainda não foram verificados.

O [plano de publicação](../arquitetura/plano-publicacao-academico.md) fixa Node 24, pnpm 12.6.0, raiz do workspace para Render, `apps/web` com pacotes compartilhados acessíveis para Vercel, CA exclusiva no backend e URLs exatas de Auth. A versão do pnpm disponível em cada provedor, os segredos/variáveis privados, a instalação limpa e o domínio final precisam ser validados antes de deploy. O backend deve manter o login PostgreSQL restrito e `rejectUnauthorized: true`; `pg_stat_ssl.ssl=false` no trecho observado pooler→PostgreSQL segue como limitação acadêmica, sem uso de dados reais.

O workspace ainda contém alterações não registradas no Git, inclusive **nove migrações novas não rastreadas** (`00200`–`01000`), código e documentação. O dry-run usa esses arquivos locais, mas os provedores não poderão recebê-los pelo repositório até que sejam revisados e registrados em commit; nenhum commit ou push foi feito nesta etapa.

## Dry-run e decisão

O dry-run remoto `supabase db push --linked --dry-run --skip-vault` terminou com código 0 e listou **exatamente `20260928000100` a `20260928001000`**, com os dez nomes de arquivo desta revisão, sem seed nem arquivo de roles. O dry-run enumera as migrações pendentes; não executa nem valida semanticamente cada instrução SQL no banco remoto. Nenhuma migração foi aplicada. A aplicação remota exige aprovação específica. Após aplicação futura, testar metadados/RLS/grants, Auth com caixa fictícia apropriada sem repetir envios agora, fluxo Next→Nest→Supabase, isolamento, revogação, agregação 6/7 e complementos, PDF/hash e rollback/concorrência. E1 permanece parcialmente implementada com suas quatro pendências próprias; E2–E4 não são prontas para dados pessoais reais ou produção.
