# Extração — arquitetura de dados complementar

Fonte: [arquitetura-schemas.pdf](../fontes/arquitetura-schemas.pdf). Referência de modelagem, não substitui os 21 RFs.

## Página 1

```text
Arquitetura de Schemas
SaaS de Gestão de Riscos Ocupacionais (NR-1) - Especificação de Banco de Dados
Camada 0: Estrutura Organizacional e Perfis
Espinha dorsal do sistema multi-tenant. Todos os dados das camadas superiores devem ser filtrados pelo
empresa_id para garantir o isolamento com RLS (Row Level Security).
Tabela
Coluna
Tipo
Descrição / FK
empresas
id
UUID (PK)
Tenant raiz do sistema
razao_social
String
Razão social oficial
nome_fantasia
String
Nome da organização
cnpj
String
Documento legal da empresa
email
String
E-mail principal corporativo
telefone
String
Telefone de contato corporativo
estabelecimentos
id
UUID (PK)
Unidade física
nome
String
Identificação (ex: Matriz, Filial)
empresa_id
UUID (FK)
Ref: empresas.id
setores
id
UUID (PK)
Agrupamento de atividades
nome
String
Nome do setor (ex: Produção)
estabelecimento_id
UUID (FK)
Ref: estabelecimentos.id
usuarios
(Tabela Unificada)
id
UUID (PK)
Identificador único
nome_completo
String
Nome do usuário
email , senha_hash
String
Credenciais de acesso
empresa_id
UUID (FK)
Tenant de acesso (isolamento)
perfil_acesso
Enum
Trabalhador, Gestor,
Responsavel, Consultoria
setor_id , funcao_id ,
turno_id
UUID (FKs)
Vínculo com a estrutura; Null
para Administradores
registro_profissional
String
CPF/Registro (Responsável
Técnico)
status
Enum
Ativo, Inativo, Pendente
ISOLAMENTO DE TENANTS
Ao utilizar uma tabela única de `usuarios` com `empresa_id`, as políticas de segurança (RLS) no PostgreSQL podem
garantir nativamente que nenhum usuário acesse dados fora do seu escopo, fundamental para o painel de
consultorias.
Plataforma NR-1 - Modelagem de Dados
Página 1 de 5
```

## Página 2

```text
Camada M1: Coleta e Anonimato
Armazena as campanhas de pesquisa e consolida os dados mantendo o grupo anonimizado, conforme regra
de aderência (n ≥ 7).
Tabela
Coluna
Tipo
Descrição / FK
campanhas_coleta
id
UUID (PK)
Identificador da rodada
estabelecimento_id
UUID (FK)
Ref: estabelecimentos.id
taxa_adesao_meta
Decimal
Ex: 0.8 (80%)
status
Enum
Aberta, Encerrada, Tabulada
respostas_agregadas
id
UUID (PK)
Resultado por grupo exposto
campanha_id ,
setor_id
UUID (FKs)
Vínculo estrutural
n_respostas
Integer
Trava sistêmica (não consolida
se < 7)
indicadores_objetivos
tipo_indicador
Enum
Rotatividade, Absenteísmo
valor
Float
Dado importado do RH
Camada M2: Avaliação e Nível de Risco
Responsável pelo motor de cálculo. Recebe as métricas da M1 e aplica a matriz aprovada pela organização.
Tabela
Coluna
Tipo
Descrição / FK
matrizes_risco
id
UUID (PK)
Matriz base da organização
config_severidade
JSONB
Régua customizável de impactos
config_probabilidade
JSONB
Régua customizável de
frequências
perigos_biblioteca
id
UUID (PK)
Catálogo de fatores
fator , fontes
Text
Descrição estruturada
is_custom
Boolean
Padrão do sistema vs criado
riscos_avaliados
id
UUID (PK)
Risco materializado
setor_id , perigo_id
UUID (FK)
Vínculo de exposição
nivel_risco
Enum
Trivial, Tolerável, Intolerável, etc.
memoria_calculo
JSONB
Log inalterável do cálculo (S x P)
Plataforma NR-1 - Modelagem de Dados
Página 2 de 5
```

## Página 3

```text
Camada M3: Inventário de Riscos
O cofre legal do sistema. Salva versões imutáveis para comprovação fiscal (retenção de 20 anos) com os
campos das nove alíneas.
Tabela
Coluna
Tipo
Descrição / FK
inventarios_versoes
id
UUID (PK)
Documento legal consolidado
estabelecimento_id
UUID (FK)
Emitido por unidade
(1.5.3.1.1.1)
ciclo_id
UUID (FK)
Ref: ciclos.id
hash_documento
String
Assinatura SHA-256 do PDF
gerado
responsavel_tecnico_id
UUID (FK)
Usuário com registro
profissional
arquivo_pdf_url
String
Caminho do arquivo no storage
Camada M4: Planos de Ação
Transforma o risco avaliado em medidas mitigadoras com priorização baseada na hierarquia normativa.
Tabela
Coluna
Tipo
Descrição / FK
acoes
id
UUID (PK)
Ação preventiva/corretiva
risco_avaliado_id
UUID (FK)
Rastreabilidade obrigatória
frente
Enum
RH, Liderança, SST, Trabalhador
responsavel_id
UUID (FK)
Ref: usuarios.id
status
Enum
Planejada, Em Andamento,
Implementada
evidencias
id
UUID (PK)
Anexos e comprovantes
acao_id
UUID (FK)
Ref: acoes.id
arquivo_url
String
Fotos, atas, comunicados
Plataforma NR-1 - Modelagem de Dados
Página 3 de 5
```

## Página 4

```text
Camada M5: Ciclo, Acompanhamento e Auditoria
A máquina de estados da aplicação. Controla os prazos, os gatilhos extraordinários de reavaliação e a aferição
de eficácia.
Tabela
Coluna
Tipo
Descrição / FK
ciclos
id
UUID (PK)
Janela de vigência do PGR
estabelecimento_id
UUID (FK)
Unidade afetada
data_vencimento
Date
Calculado (2 ou 3 anos)
afericoes_eficacia
id
UUID (PK)
Registro "antes x depois"
acao_id
UUID (FK)
Ação monitorada
resultado
Enum
Eficaz (encerra) / Ineficaz
(reabre)
trilha_auditoria
id
UUID (PK)
"Quem fez o que e quando"
usuario_id
UUID (FK)
Ref: usuarios.id
diff_json
JSONB
Log inalterável da alteração
Camada M6: Comunicação
Transparência. Traduz a linguagem técnica para formato acessível aos colaboradores e gera os recibos legais
de ciência do risco.
Tabela
Coluna
Tipo
Descrição / FK
comunicados
id
UUID (PK)
Mensagem simplificada
inventario_versao_id
UUID (FK)
Amarrado ao PGR vigente
setor_id
UUID (FK)
Destino do comunicado
texto_devolutiva
Text
Resumo acessível dos riscos
(alínea c)
recibos_ciencia
id
UUID (PK)
Assinatura ou registro de leitura
comunicado_id
UUID (FK)
Referência ao comunicado
usuario_id
UUID (FK)
Trabalhador que visualizou
ip_origem /
data_leitura
String / Date
Evidência legal de acesso
Plataforma NR-1 - Modelagem de Dados
Página 4 de 5
```

## Página 5

```text
Fluxograma de Interação Arquitetural (M0-M6)
Representação do fluxo de dados e orquestração entre as tabelas do sistema. O ciclo flui linearmente, mas os
resultados de eficácia (M5) criam laços de retroalimentação.
M0 - Perfil & Estrutura
Isolamento / RLS
M1 - Coleta de Dados
Respostas Agregadas (n≥7)
M2 - Avaliação de Risco
Matriz S x P + Classificação
M3 - Inventário (PDF)
Retenção Legal & Assinatura
M4 - Plano de Ação
Medidas por Hierarquia
M5 - Acompanhamento
Aferição e Eficácia
Se Ineficaz: Reavalia Risco
M6 - Comunicação
Geração de Devolutivas
Registro de Ciência
Acesso ao Trabalhador
O fluxo garante a rastreabilidade total: nenhum risco é gerado sem coleta prévia, nenhuma medida nasce órfã de um risco, e toda
medida implementada gera retenção legal contínua.
Plataforma NR-1 - Modelagem de Dados
Página 5 de 5
```
