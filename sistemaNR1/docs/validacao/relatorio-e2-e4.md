# Validação da missão Design System + E2 + E3 + E4

Atualização: 2026-09-28. Exclusivamente dados fictícios. A E1 permanece **Parcialmente implementada** com as quatro pendências registradas no [relatório E1](relatorio-e1.md). Nenhuma migração E2–E4 foi aplicada ao projeto Supabase remoto.

## Checkpoint 1 — base local de M1

O usuário forneceu o [arquivo Figma Plataforma NR-1](https://www.figma.com/design/cGW4JPUdRYtAME048NAU5I/Plataforma-NR-1?node-id=46-9&t=oVW8yPOSLpWeSfFH-1). O acesso público permitiu confirmar o título e visualizar somente uma miniatura do quadro de diretrizes; ela não tem resolução suficiente para extrair tokens e componentes exatos. Foi solicitado o caminho local de um export PNG/PDF. Nenhum estilo foi atribuído falsamente ao Figma nesta etapa.

A migração [20260928000100_m1_base_coleta.sql](../../supabase/migrations/20260928000100_m1_base_coleta.sql) foi aplicada **com `supabase migration up --local --yes`** ao projeto local. Ela cria cinco tabelas privadas (`campanhas`, `grupos_campanha`, `codigos`, `respostas_protegidas` e `registros_consulta`) com FKs compostas por empresa/unidade, RLS forçado e grants mínimos. A resposta não contém identificador de Auth, matrícula, nome, e-mail, IP, hash do código nem instante preciso. O código é guardado somente como hash em tabela separada. Nenhum fluxo de publicação/envio está liberado pela migração isolada.

`node scripts/verificar-migracao-m1-local.mjs` passou com login restrito: cinco tabelas com RLS forçado, leitura direta de códigos/respostas/taxas internas negada e ausência dos campos nominais verificada. `pnpm.cmd --filter @sistemanr1/api test -- campanha.spec.ts agregacao-protegida.spec.ts` passou com **8 testes**. As regras puras cobrem campanha com período/meta/população/canal alternativo, taxa interna de 8/20 = 40%, k mínimo 7, agregação de 3+5 no ancestral e supressão do complemento em pai 10/filho 7. O typecheck do API passou. Essas provas não substituem testes transacionais, de concorrência, API ou navegador.

## Próximos checkpoints

1. Aplicar o Design System após obter export legível do Figma, com tokens, estados e componentes acessíveis.
2. Completar E2 local: snapshot e publicação de campanha, emissão/consumo atômico de códigos, canal alternativo, registro documental e fotografia agregada segura; testar concorrência, rollback e isolamento real.
3. Completar E3 local: matriz demonstrativa versionada/documentada/aprovada antes do cálculo, memória, consequências, decisão, medida mínima e AEP/AET.
4. Completar E4 local: base geral integrada, nove alíneas, consolidação imutável, diferenças e guardas de exclusão. M3 não recalcula M2.

Estados atuais: RF-01.2, RF-01.3 e RF-01.6 **Parcialmente implementados** no recorte unitário; os demais RFs permanecem pendentes. Não há conclusão de E2, E3 ou E4, conformidade legal integral ou autorização para dados reais.
