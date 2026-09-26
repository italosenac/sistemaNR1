# Diagnóstico do ambiente E0

Data: 2026-09-26. Diagnóstico anterior à geração do aplicativo; versões finais e resultados serão registrados após as instalações.

| Item | Estado inicial observado |
| --- | --- |
| Sistema | Windows 10.0.26100, processo/arquitetura x64 |
| PowerShell | 5.1.26100.4061 |
| Git | 2.55.0.windows.5 |
| Node.js | 24.14.1, linha LTS 24 |
| npm | 11.12.1 |
| Corepack | 0.34.6; não usado para instalar pnpm |
| pnpm | Ausente; instalado 12.6.0 via npm no prefixo do usuário |
| NestJS CLI / Supabase CLI | Ausentes; serão dependências locais |
| Disco C | Aproximadamente 65,3 GiB disponíveis no diagnóstico com `fs.statfsSync` |
| Escrita / hardlink / junction | Testados com sucesso dentro do projeto; artefatos temporários removidos |
| Caminhos longos | `LongPathsEnabled=1`; nenhuma alteração de segurança realizada |
| Manifestos/lockfiles anteriores | Nenhum em sistemaNR1 |

`git status --short --branch` estava limpo na branch `italo_SDD`, rastreando `origin/italo_SDD`; revisão inicial `351d10f`. A raiz Git existente é `C:/Users/italo/OneDrive/Documents/MVP`, e sistemaNR1 é sua subpasta. Não inicializar outro repositório ou executar comandos fora do escopo do projeto. Hashes de 59 arquivos preexistentes em [preservacao-e0.json](../validacao/preservacao-e0.json).

## PATH e comandos executados

`Get-Command` localizou Git em `C:/Program Files/Git/cmd`, Node/npm/Corepack em `C:/Program Files/nodejs` e winget em WindowsApps. O PATH já inclui `%APPDATA%/npm`, destino do pnpm. Também contém Python, VS Code e Docker Desktop; não foi reescrito. Usar `npm.cmd`/`pnpm.cmd` no PowerShell se a política local impedir wrappers `.ps1`, sem mudar essa política.

Executados: `git status --short --branch`, `git rev-parse --show-toplevel`, `git log -1`, `git --version`, `node --version`, `npm.cmd --version`, `corepack.cmd --version`, `pnpm.cmd --version`, inspeção de `$PSVersionTable`, `$env:PATH`, `Get-Command`, `Get-PSDrive`, registro de caminhos longos e teste Node de escrita/links/disco. `Get-PSDrive` não apresentou espaço livre útil no sandbox; `fs.statfsSync` forneceu o valor.

Conectividade: `npm.cmd ping --fetch-retries=0 --fetch-timeout=15000` retornou PONG; `git ls-remote https://github.com/nestjs/nest.git HEAD` retornou uma revisão. As primeiras tentativas sem elevação foram bloqueadas pela rede do sandbox, com EACCES/conexão negada; a repetição autorizada funcionou. Não houve desativação de antivírus, TLS, UAC ou política de execução.

## Compatibilidade consultada

[Next.js](https://nextjs.org/docs/app/getting-started/installation): Node ≥20.9. [NestJS](https://docs.nestjs.com/first-steps): a documentação corrente do gerador exige 24.15+ na linha 24. [pnpm](https://pnpm.io/installation): linha 12 compatível com Node 24. [Node.js](https://nodejs.org/en/about/previous-releases): linha 24 LTS. Selecionado **24.19.0**, disponível no winget, para substituir 24.14.1 e atender ao conjunto.

Metadados consultados no registro oficial npm: Next 16.3.6, NestJS core 12.1.0/CLI 12.0.7, pnpm 12.6.0 e Supabase CLI 2.118.0. TypeScript mais recente 7.0.2 não atende aos peers de ts-jest/typescript-eslint/Swagger consultados; adotar **5.9.3** compatível, sem relaxar a checagem. Versões efetivamente resolvidas ficam nos manifests e lockfile.

## OneDrive

Nenhum erro de escrita ou link foi reproduzido. Não houve processo OneDrive visível no diagnóstico; isso não comprova ausência de sincronização. `node_modules` e saídas de build serão ignorados pelo Git; `.gitignore` não configura exclusões do OneDrive. O store padrão pnpm fica em LocalAppData, fora da pasta sincronizada. Manter o projeto onde está; se houver conflito de sincronização, registrar o arquivo/erro e coordenar uma pausa de sincronização com o usuário, sem mover o projeto ou alterar segurança automaticamente.

## Instalações em andamento

`npm.cmd install --global pnpm@12.6.0 --no-fund --no-audit`: concluído, versão 12.6.0 confirmada.

`winget upgrade --id OpenJS.NodeJS.LTS --exact --version 24.19.0 --silent --accept-package-agreements --accept-source-agreements --disable-interactivity`: download e hash do MSI confirmados; o instalador solicitou elevação administrativa. Resultado final será acrescentado após confirmação da instalação.
