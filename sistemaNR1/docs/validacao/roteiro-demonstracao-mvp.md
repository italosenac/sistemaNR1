# Roteiro do MVP acadêmico demonstrável

Estado em 2026-09-28: roteiro preparado; URLs públicas e smoke online ainda dependem da conexão dos provedores. A demonstração utiliza exclusivamente fixtures fictícias comprovadas. Não usar os dois perfis remotos de origem desconhecida.

## Apresentação de 5–8 minutos

1. **Entrada (0:00–0:40):** abrir a URL pública do frontend em `/login`. Entrar com uma das cinco contas de fixture conhecidas, com papel adequado ao roteiro. Não expor a senha em tela nem neste documento.
2. **Contexto (0:40–1:15):** selecionar a empresa fictícia vinculada. No dashboard, mostrar que campanhas, avaliações e inventários são contagens reais da API e que a ação seguinte está visível.
3. **M1, campanha (1:15–2:15):** abrir **Campanhas M1**. Mostrar rascunho, estabelecimento nomeado, grupo e fotografia da estrutura. Abrir uma campanha preparada, caso exista; a criação ao vivo fica disponível para explicar o processo.
4. **Código e questionário (2:15–3:00):** emitir um código individual para uma participação fictícia, copiar e abrir `/questionario`. Explicar que o trabalhador não precisa de conta Auth e que o código só pode ser usado uma vez. Não deixar código ainda ativo visível em screenshot ou material compartilhado.
5. **Anonimato e agregados (3:00–3:40):** mostrar que grupo com menos de sete respostas ou suprimido pela política permanece indisponível. Se a campanha preparada tiver agregado divulgável, abrir o resultado e seguir pelo CTA **Avaliar riscos em M2**. Nunca mostrar resposta individual.
6. **M2 (3:40–4:50):** mostrar a grade de severidade × probabilidade, o critério versionado e uma avaliação de agregado permitido. Explicar a escolha técnica de S e P, a consequência determinante e a memória de cálculo. A média M1 não define automaticamente a probabilidade.
7. **M3 e PDF (4:50–6:15):** abrir **Inventário M3**, mostrar a origem da avaliação, as nove alíneas, a versão consolidada, o hash e o botão **Baixar PDF privado**. Abrir o PDF baixado. Dizer expressamente “rascunho não assinado”: hash não é assinatura.
8. **Limites (6:15–7:00):** explicar que E1–E4 permanecem parcialmente implementadas; não há conformidade legal integral, custódia de 20 anos comprovada ou prontidão para produção.

## Plano B para serviço frio ou indisponível

- Se a API estiver fria, aguardar a resposta de `/health` antes de entrar. A resposta esperada é `{"status":"ok","servico":"sistemaNR1-api"}`. Não clicar repetidamente em ações de escrita.
- Se a criação ao vivo for lenta, abrir campanha, avaliação e inventário fictícios já preparados **somente se eles tiverem sido verificados no remoto**. Não afirmar que esses registros existem antes do smoke.
- Se a API continuar indisponível, usar a build local apenas como demonstração visual e declarar a falha online. As capturas locais de inspeção em `.e1/` são temporárias e não substituem evidência funcional remota.
- Não depender de envio de e-mail ou recuperação de senha no roteiro principal; o SMTP remoto permanece pendente.

As URLs definitivas serão registradas no [relatório de pré-publicação](prepublicacao-2026-09-28.md) depois do deploy e smoke. Nenhuma credencial ou código de uso único pertence a este roteiro.
