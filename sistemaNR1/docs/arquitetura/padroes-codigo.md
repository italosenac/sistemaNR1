# Padrões permanentes de código

[MISSÃO] Adotar princípios de Código Limpo, de Robert C. Martin, com julgamento e sem métricas artificiais. Estas regras se aplicam a todo código futuro do projeto.

1. Usar nomes que revelem intenção, em português brasileiro para variáveis, funções, métodos, classes e tipos de domínio. Identificadores sem acentos por consistência técnica: `consequenciaDeterminante`, `GrupoDeExposicao`.
2. Usar camelCase para variáveis/funções e PascalCase para classes/tipos. Arquivos próprios em kebab-case; preservar convenções obrigatórias do framework.
3. Manter funções pequenas com uma responsabilidade. Extrair quando houver responsabilidades distintas; tamanho em linhas é indício de revisão, não um limite mecânico.
4. Evitar duplicação de regras. A política de supressão e as travas de consolidação têm um dono, reutilizado por tela, API e exportação.
5. Separar negócio de infraestrutura. Domínio não importa NestJS, Supabase, SQL, SDKs, HTTP ou renderer PDF.
6. Controllers validam transporte e delegam a casos de uso; não calculam risco nem decidem se grupo pode ser divulgado.
7. Preferir código autoexplicativo. Comentários devem explicar motivo ou decisão de segurança, não narrar cada instrução.
8. Evitar abreviações ambíguas, booleanos com significado incerto e números mágicos.
9. Nomear valores significativos: `QUANTIDADE_MINIMA_DE_RESPOSTAS = 7`, política versionada de retenção e limites de formulário. Não espalhar constantes de negócio em componentes.
10. Tratar erros explicitamente. Distinguir validação, autorização, conflito, supressão e indisponibilidade externa. Não usar `catch` vazio ou converter falha em sucesso/zero.
11. Isolar integrações por portas orientadas a necessidades concretas: repositório de campanha, gerador de documento, armazenamento privado, relógio. Evitar interfaces genéricas sem consumidor real.
12. Escrever testes das regras críticas: concorrência de token, anonimato, memória, bloqueios, integridade, autorização e retenção. Escolher o nível mais barato que verifica comportamento real.
13. Evitar dependências desnecessárias, heranças extensas e abstrações prematuras. Reutilizar somente o que possui semântica compartilhada.

Exemplos de verbos: `criarCampanha()`, `validarQuantidadeMinima()`, `calcularNivelDeRisco()`, `gerarMemoriaDeCalculo()`, `consolidarInventario()`, `criarNovaVersao()`. Exemplos de dados: `quantidadeDeRespostas`, `nivelDeRisco`, `criterioDeAvaliacao`, `inventarioConsolidado`.

TypeScript strict; evitar `any` e asserções que escondem estados inválidos. Usar união discriminada para resultado publicável/suprimido e documento gerado/assinado. Datas com fuso no transporte, instantes UTC na persistência e relógio injetável nos testes. Não misturar valor e unidade de indicador. Inputs externos são não confiáveis até validação.

Preservar nomes de bibliotecas/frameworks/APIs (`useEffect`, `GET`, `Controller`, `SupabaseClient`, `page.tsx`, `package.json`). Traduzir conceitos próprios, não contratos de terceiros. DTO público não deve expor entidade interna ou campo protegido por conveniência.

Revisão deve citar arquivo/linha, efeito e proposta concreta. Refatoração preserva comportamento: atualizar testes apenas quando muda uma SPEC legitimamente, nunca para esconder regressão. Usar a Skill `revisar-codigo-limpo` quando houver revisão/refatoração solicitada ou mudanças que justifiquem esse exame.
