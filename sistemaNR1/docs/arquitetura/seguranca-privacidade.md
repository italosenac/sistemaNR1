# Segurança e privacidade

[MISSÃO] Exclusivamente dados fictícios, em todos os ambientes desta fase do projeto. O limite de sete respostas não garante anonimato absoluto. [ARQ] As medidas abaixo são requisitos técnicos de proteção para implementar as regras dos PDFs, não certificação LGPD ou jurídica.

## Isolamento e controle de acesso

`empresaId` pertence a todos os agregados e artefatos. Resolver empresa e vínculo ativo a partir da autenticação validada e da associação no servidor; nunca confiar em `empresaId` do corpo ou papel armazenado em metadados editáveis pelo usuário. Validar emissor, audiência, expiração e assinatura do JWT Supabase; não basta decodificar token. Toda relação entre recursos deve validar mesma empresa, inclusive referências de documento, grupo e revisão.

| Papel proposto | Permissões |
| --- | --- |
| Gestor | Estrutura, campanhas, indicadores, leitura de agregados, rascunhos e exportação autorizada |
| Responsável técnico | Critérios, avaliação, consequências, decisões, consolidação e futura assinatura dentro de atribuições verificadas |
| Leitor | Agregados e documentos explicitamente permitidos |
| Consultoria | Um dos papéis acima por vínculo de empresa; sem permissão implícita entre clientes |
| Participante | Apenas instrumento e envio com token do grupo; sem acesso administrativo |
| Processo de agregação | Leitura interna restrita de respostas para produzir projeções; não é papel navegável no produto |

Privilégio mínimo no banco e RLS por empresa como defesa adicional. Proposta: backend transacional usa papel restrito, sem dono/BYPASSRLS, com contexto local à transação configurado somente depois da validação da sessão/vínculo; a conexão do pool não retém contexto de outro pedido. Data API não expõe schema de respostas/tokens. Navegador não acessa tabelas de negócio; Supabase Auth continua sendo a integração pública de autenticação. A [documentação Supabase](https://supabase.com/docs/guides/database/secure-data) explica RLS e a necessidade de proteger chaves privilegiadas; nosso desenho também exige testes da aplicação, pois RLS não neutraliza uma credencial que a ignora.

Testar via dois usuários de empresas diferentes, acesso por identificador conhecido, chaves relacionadas, SQL sob papel restrito e download de objeto. Chaves de serviço/segredos nunca entram em `NEXT_PUBLIC_*`, Git, exemplos, logs, relatórios ou prompts. Não usar `service_role` como atalho para acesso geral. Migrações usam credencial separada, ausente do runtime.

## Coleta e tokens

Tokens opacos com entropia criptográfica suficiente (proposta: 32 bytes aleatórios), apenas hash persistido, vínculo a campanha/grupo, expiração e consumo único. QR/link é individual por código; não existe lista nominal de destinatários. Token em fragmento evita envio em URL HTTP; frontend envia somente no corpo por HTTPS, sem analytics ou scripts externos no formulário. Aplicar `no-referrer`, não cachear conteúdo sensível e apagar token da apresentação após recebimento.

Transação única verifica estado/janela e consome token juntamente com inserção da resposta; concorrência não pode criar duas respostas. A tabela de respostas não guarda hash/tokenId, usuário, sessão, IP ou instante preciso; a tabela de tokens não guarda respostaId. Logs de borda, hospedagem e observabilidade podem correlacionar requisições: configurar minimização e retenção específica antes de qualquer uso real. Limitação de requisições deve evitar identificadores persistentes no dado de pesquisa; não criar fingerprint do trabalhador.

Não prometer uma pessoa/uma resposta: código único assegura uma resposta por código. Distribuição física, observação por operador e texto livre são riscos residuais. Canal alternativo usa mesmos códigos/transação e coleta neutra. No MVP toda essa operação é simulada.

## Política de divulgação e prevenção de cruzamentos

1. Congelar estrutura e população da campanha; folhas disjuntas. Registrar `k` na versão, com mínimo absoluto 7 e sem redução para fotografia já divulgada.
2. Gerar estatísticas por fator com denominador válido daquele fator/recorte. Questionário com itens ausentes não aumenta artificialmente o n de um fator.
3. Agregar folhas pequenas ao ancestral dentro do mesmo escopo. Nunca publicar filho oculto junto de valor que o reconstrói. Recalcular união de respostas sem duplicidade.
4. Antes de publicar, verificar o **conjunto** de células e marginais, não apenas cada célula. Se pai=10 e filho visível=7 deixam complemento=3, suprimir também o filho ou o total. Preferir publicar apenas o pai seguro.
5. MVP disponibiliza fotografias imutáveis e **uma família de partições compatíveis** por campanha. Função/turno filtram somente essas partições autorizadas. Não oferecer cubo arbitrário, negação de filtros, intervalos livres ou múltiplas decomposições que permitam obter interseções pequenas. Denegar consulta quando proteção não puder ser demonstrada.
6. Evitar ataques temporais: resultado dos fatores só é publicado após encerramento; correção cria nova fotografia e só pode ser divulgada após avaliar diferenças com todas as divulgações anteriores. Se diferenças pequenas puderem ser inferidas, manter a nova fotografia restrita. Não expor feed de novas respostas.
7. Durante coleta, acompanhamento da adesão usa janelas discretas, partições seguras e intervalos amplos de percentual (proposta: faixas de 20 pontos percentuais), sem contagem exata ou data de cada resposta. Exigir proteção tanto de respondentes quanto do complemento de não respondentes. Agregar/suprimir quando necessário; zero e total não são exceções automáticas.
8. O registro documental guarda meta/numerador/denominador/taxa para processamento interno; a projeção ao gestor/exportação passa pela mesma regra. Taxa exata final só é exibida em recorte aprovado. Nunca reconstruir n oculto a partir de taxa e população.

Todos os canais usam a mesma porta `obterAgregadoPublicavel`: painel, mapa, API, CSV, PDF, exportação aberta e futuras integrações. Valor suprimido não sai no payload, HTML, atributo acessível, tooltip, cache, erro ou log. Estados devem explicar ausência de dado sem sugerir risco zero. Política conservadora pode deixar filtros indisponíveis; aceitável diante da proteção prioritária.

## Texto livre e indicadores

Aviso precede campo; campo é opcional e desativado na primeira demonstração. Não exportar comentários individuais. Síntese de comentários reais depende de processo específico ainda não definido; não construir acesso indireto à íntegra pelo painel administrativo. Indicadores de denúncias são contagens agregadas com fonte/período, jamais relatos nominativos. Valores sensíveis pequenos também passam por revisão de divulgação.

## Documentos, auditoria e retenção

Buckets privados; chaves de objeto incluem empresa e versão imutáveis. Backend autoriza cada download e usa proxy protegido ou URL de curta validade. URL assinada de Storage é autorização de download, **não assinatura do responsável técnico**. Sanitizar conteúdo na geração do PDF e impedir busca de URLs fornecidas pelo usuário pelo renderer.

Auditar ações administrativas, decisões manuais, critérios, consolidações, tentativas negadas e exportações. Não auditar conteúdo individual, tokens ou vínculo entre operador e resposta. Trilhas são append-only para papéis comuns; administração de infraestrutura requer segregação operacional futura.

Proibir alteração/exclusão de consolidado na API e reforçar no banco; não usar apenas soft-delete como garantia. Histórico inclui snapshots, diffs, matrizes usadas, documentos e hashes. Política provisória: mínimo de 20 anos civis da consolidação, sem expurgo no MVP e sem cascata de exclusão da empresa. Validar marco e normatizações específicas antes da produção. Respostas/tokens têm política separada pendente, com minimização; não guardá-los automaticamente por 20 anos.

Backup não substitui histórico; histórico não substitui backup. Para produção futura: cópias externas controladas, exportação aberta, verificação de integridade, restauração de banco **e objetos**, governança de credenciais, orçamento e plano de continuidade. Planos gratuitos não fundamentam promessa de guarda por décadas.

## Verificação necessária na implementação

Casos negativos de fronteira entre empresas, JWT adulterado/expirado, token concorrente, rollback, partições sobrepostas, complemento pequeno, diferença temporal, texto livre e download indevido. Validar logs de frontend/API/provedor com massa sintética. Revisão de privacidade, base legal, titulares, retenção de respostas e governança profissional são pendências anteriores a dados reais.
