---
name: revisar-codigo-limpo
description: Revisar ou refatorar código do sistemaNR1 quanto a nomenclatura, responsabilidades, duplicação e separação de camadas. Usar em revisão de código ou refatoração, preservando regras das SPECs e repetindo testes após alterações.
---

# Revisar código limpo

Ler [padrões de código](../../../docs/arquitetura/padroes-codigo.md), [visão de arquitetura](../../../docs/arquitetura/visao-geral.md) e a SPEC afetada. Identificar se a tarefa pede só revisão ou também refatoração. Se não houver código, informar esse limite; não iniciar implementação para ter algo a revisar.

## Foco da análise

- Nomes revelam intenção e usam português brasileiro nos conceitos próprios? Preservar nomes de frameworks, APIs, arquivos obrigatórios e contratos externos.
- Funções misturam responsabilidades ou possuem fluxos difíceis de verificar? Tamanho é sinal para análise, não motivo automático de extração.
- Regras como mínimo de respostas, aprovação, memória e consolidação estão duplicadas em controllers/componentes/adaptadores?
- Domínio depende de SQL, SDK Supabase, NestJS, HTTP ou PDF? Controllers contêm cálculo ou decisão de negócio? Casos de uso têm fronteiras transacionais claras?
- Há números mágicos, abreviações ambíguas, erros engolidos, `any` que esconde estados ou abstrações sem necessidade concreta?
- Interfaces externas isolam a necessidade da aplicação sem criar uma camada genérica desnecessária?

## Revisão e refatoração

Produzir achados com arquivo/linha, responsabilidade problemática, efeito e proposta pequena que preserve comportamento. Não tratar preferência estética como defeito de negócio. Priorizar clareza onde mudanças podem quebrar privacidade, autorização, transações ou histórico.

Se refatoração estiver autorizada, manter contratos e critérios de aceitação, verificar testes de referência disponíveis e realizar a mudança delimitada. Executar novamente os testes relevantes após alterações; ampliar verificação somente quando dependências/risco justificarem. Não alterar teste para esconder mudança de comportamento: mudança funcional exige SPEC/decisão explícita.

Não criar teste que apenas espelhe estrutura interna ou imponha limite arbitrário de linhas. Registrar comandos e resultados reais; se não executados, dizer isso. Se descobrir divergência funcional, apontar RF e trava correspondente, sem ampliar o escopo silenciosamente.

## Resultado esperado

Revisão com achados acionáveis ou refatoração delimitada com evidência de preservação do comportamento. Referenciar pendências concretas. Esta Skill não autoriza alterar regras, publicar, enviar mensagens, acessar respostas individuais ou executar operações destrutivas.
