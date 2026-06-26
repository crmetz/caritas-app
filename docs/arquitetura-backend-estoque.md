# Arquitetura Backend — Módulo de Estoque (design alvo)

> **Data:** 2026-06-09 · **Revisado:** 2026-06-15
> **Status:** design aprovado em brainstorming; pendente plano de implementação.
> **Base:** [`modelo-dominio-estoque.md`](./modelo-dominio-estoque.md) (o modelo de domínio é a fonte da verdade das entidades/relações).

> **Revisão 2026-06-15.** Acompanha a revisão do modelo de domínio (Alimento como gênero +
> `FormaMedida`, `tamanho` do pacote como coordenada de lote, novo fluxo de cestas com
> `ConfiguracaoCesta`/`LoteCesta`). Novidades de arquitetura nesta revisão: helper `MedidaHelper`
> (parse/format de unidades, no Service), resumo de estoque por gênero, e o serviço de **montagem
> em duas etapas** (`Simular`/`Confirmar`) com alocação por validade. A antiga `CestaBasica`
> (entidade/service/controller/DTOs) é **substituída** pelo fluxo de configuração + montagem.

## Contexto e objetivo

Implementar toda a arquitetura backend do módulo de Estoque (entidades, mappings, repositories,
services, DTOs, controllers, DI) e expor os endpoints, seguindo as convenções dos outros módulos
do repositório (camadas `Models → Repository → Service → WebApi`, `BaseApiController`,
`PagedResponseDto`/`ToPagedAsync`, `ErrorHandlingMiddleware`, `SelectObjectDto`) e as melhores
práticas do stack (ASP.NET Core 8/EF Core, PostgreSQL 16).

O código de estoque existente (entidades `Item`/`Estoque`/`MovimentacoesEstoque`/`Doacao`, interfaces
com tipos errados como `GetByIdItemAsync(string)`, DTOs `Item` stub) é descartável: será reescrito
para seguir o modelo aprovado.

## 0. Pré-requisito (bloqueia a implementação)

1. **Merge da `main`** (auth/Identity/JWT/`CurrentSession`) nesta branch — o módulo depende de `ICurrentSession`.
2. **Mover a interface `ICurrentSession`** para `Caritas.Models/Interfaces/Services/` (a implementação
   `CurrentSession` continua em `Caritas.Service/Session/`). Necessário para o `CaritasDbContext`
   (camada Repository) carimbar userstamps sem a Repository depender da Service.

## 1. Camadas e Injeção de Dependência

Mantém as 4 camadas. **Diferença em relação a Familia/Paroquia:** os services e repositories do
estoque são **registrados no container** e injetados por construtor (best practice idiomática;
`ICurrentSession`/`IEmailService` já seguem isso), em vez do `new` manual em cadeia.

Registros novos em `Program.cs` (todos `Scoped`):

```csharp
builder.Services.AddScoped<IItemRepository, ItemRepository>();
builder.Services.AddScoped<IEstoqueRepository, EstoqueRepository>();
builder.Services.AddScoped<IMovimentacaoRepository, MovimentacaoRepository>();
builder.Services.AddScoped<IDoadorRepository, DoadorRepository>();
builder.Services.AddScoped<IDoacaoRepository, DoacaoRepository>();
builder.Services.AddScoped<IConfiguracaoCestaRepository, ConfiguracaoCestaRepository>();
builder.Services.AddScoped<ILoteCestaRepository, LoteCestaRepository>();
builder.Services.AddScoped<IMovimentacaoCestaRepository, MovimentacaoCestaRepository>();
builder.Services.AddScoped<IEntregaRepository, EntregaRepository>();
builder.Services.AddScoped<IItemService, ItemService>();
builder.Services.AddScoped<IEstoqueService, EstoqueService>();
builder.Services.AddScoped<IMovimentacaoService, MovimentacaoService>();
builder.Services.AddScoped<IDoadorService, DoadorService>();
builder.Services.AddScoped<IDoacaoService, DoacaoService>();
builder.Services.AddScoped<IConfiguracaoCestaService, ConfiguracaoCestaService>();
builder.Services.AddScoped<IMontagemCestaService, MontagemCestaService>();
builder.Services.AddScoped<ILoteCestaService, LoteCestaService>();
builder.Services.AddScoped<IEntregaService, EntregaService>();
```

## 2. Caritas.Models — entidades e auditoria

### Base de auditoria + userstamps

- `Entity { Id }` e `AuditableEntity : Entity { CriadoEm, AtualizadoEm }` permanecem.
- Nova `FullAuditableEntity : AuditableEntity { int? CriadoPor; int? AtualizadoPor }`.
- **Auto-stamp centralizado** (mesmo padrão dos timestamps): `CaritasDbContext` passa a receber
  `ICurrentSession` no construtor; em `SaveChangesAsync`, para entradas `Added` seta
  `CriadoPor = session.UsuarioId`, para `Modified` seta `AtualizadoPor = session.UsuarioId` —
  espelhando a lógica de `CriadoEm`/`AtualizadoEm` que já existe.
- Entidades do módulo herdam `FullAuditableEntity`. `MovimentacaoEstoque` é insert-only: nunca
  sofre update, então `Atualizado*` ficam nulos por natureza (sem tratamento especial).

### Entidades (campos conforme o modelo)

- **`Item`** (abstrata, TPT): `Tipo: TipoItem` (coluna imutável), `Descricao`.
- **`Alimento : Item`**: `FormaMedida` (gênero alimentício; nome do gênero em `Descricao`).
- **`Roupa : Item`**: `Categoria, Genero?, FaixaEtaria, Tamanho?, Estacao?, Condicao?, Codigo?`.
- **`Estoque`**: `IdItem, IdParoquia, Tamanho?, Validade?, Lote?, Quantidade` (Quantidade = nº de pacotes).
- **`MovimentacaoEstoque`** (renomeada de `MovimentacoesEstoque`): `IdItem, IdParoquia, Tamanho?, Validade?, Lote?, TipoOperacao, Quantidade, OrigemTipo, OrigemId?, Observacao?` (+ `CriadoEm`/`CriadoPor`).
- **`Doador`**: `Nome, Documento?, Telefone?`.
- **`Doacao`**: `IdDoador, IdParoquia, Observacao?`.
- **`ConfiguracaoCesta`**: `Nome, IdParoquia` + coleção `ItemConfiguracaoCesta`.
- **`ItemConfiguracaoCesta`**: `IdConfiguracaoCesta, IdAlimento, Tamanho, QuantidadePacotes`.
- **`LoteCesta`**: `IdParoquia, Origem: OrigemCesta, IdConfiguracaoCesta?, IdDoador?, Quantidade, QuantidadeDisponivel, Observacao?`.

### Enums (todos `HasConversion<string>()`)

`TipoItem {Alimento,Roupa}`, `TipoOperacao {Entrada,Saida}` (corrige `Alta/Baixa`),
`OrigemMovimentacao {Doacao,CestaBasica,Ajuste,Descarte}` (`CestaBasica` → `origemId` aponta para
`LoteCesta`), `FormaMedida {Peso,Volume,Unidade}`, `OrigemCesta {Montagem,Doacao}`, `CategoriaRoupa`,
`FaixaEtaria`, `Genero`, `Estacao`, `CondicaoRoupa`.

## 3. Caritas.Repository — Mappings (um arquivo por entidade em `Mappings/`)

- **`ItemMapping`**: `UseTptMappingStrategy()`; `Tipo`/enums como string; `Descricao` `MaxLength`/`IsRequired`.
  `AlimentoMapping`: `ToTable("Alimento")`, `FormaMedida` como string, **índice único em `Descricao`**
  (nome do gênero). `RoupaMapping`: `ToTable("Roupa")` + conversões de enum + tamanhos.
- **`EstoqueMapping`**: **índice único `(IdItem, IdParoquia, Tamanho, Validade, Lote)` com `NULLS NOT DISTINCT`**
  (Postgres 16 — garante 1 linha por lote mesmo com `Tamanho`/`Validade`/`Lote` nulos); FKs → `Item`/`Paroquia`
  `OnDelete(Restrict)`; `Quantidade` default 0.
- **`MovimentacaoEstoqueMapping`**: FK → `Item` `Restrict`; índices `(OrigemTipo, OrigemId)` e
  `(IdItem, IdParoquia)`; **`OrigemId` sem FK** (polimórfico).
- **`DoacaoMapping`** (FKs → `Doador`/`Paroquia`), **`DoadorMapping`**.
- **`ConfiguracaoCestaMapping`** (FK → `Paroquia`; coleção de itens com cascade),
  **`ItemConfiguracaoCestaMapping`** (FKs → `ConfiguracaoCesta` cascade, `Item`/Alimento `Restrict`),
  **`LoteCestaMapping`** (FK → `Paroquia`; `IdConfiguracaoCesta`/`IdDoador` FKs nullable `Restrict`;
  `Origem` como string).
- `CaritasDbContext`: adicionar DbSets `Alimentos`, `Roupas`, `Doadores`, `ConfiguracoesCesta`,
  `LotesCesta`; renomear `MovimentacoesEstoques` → `Movimentacoes`. Mappings via
  `ApplyConfigurationsFromAssembly`.

## 4. Repositories

Interfaces em `Caritas.Models/Interfaces/` (reescrevendo os stubs), impl em `Caritas.Repository/Repositories/`, estendendo `IBaseRepository<T>`:

- **`IItemRepository`**: queries tipadas por subtipo (criar/obter/listar `Alimento` e `Roupa`).
- **`IEstoqueRepository`**: leituras paginadas/filtradas (por tipo, paróquia, busca, status de validade);
  `GetByCoordsForUpdateAsync(idItem, idParoquia, tamanho, validade, lote)` — `SELECT … FOR UPDATE` para a
  projeção; agregação para o **resumo por gênero** (`Σ(Quantidade × Tamanho)` por `Item`); leitura dos
  **lotes disponíveis** de um `(idItem, tamanho)` ordenados por validade (para a montagem).
- **`IMovimentacaoRepository`**: insert + histórico filtrado (por item, paróquia, origem). Insert-only.
- **`IDoadorRepository`/`IDoacaoRepository`**: CRUD + queries.
- **`IConfiguracaoCestaRepository`** (CRUD + itens) / **`ILoteCestaRepository`** (criar + listar controle).

> `BaseRepository` faz `SaveChanges` por chamada. Os fluxos de escrita do estoque precisam de
> atomicidade entre movimento + saldo, então **os services orquestram a transação** (ver §5); esses
> repos expõem métodos de _tracking_ que **não** commitam, usados dentro da transação do service.

## 5. Services — núcleo do módulo

- **`MovimentacaoService.RegistrarAsync`** — único caminho de escrita do saldo. Numa **transação**:
  1. `CriadoPor = session.UsuarioId`; `IdParoquia = session.ParoquiaAtualId` (erro se ausente).
  2. Insere a `MovimentacaoEstoque`.
  3. **Lock pessimista** da linha de `Estoque` dos coords via `GetByCoordsForUpdateAsync` (`FOR UPDATE`);
     se não existe, cria (o índice único `NULLS NOT DISTINCT` impede duplicatas em corrida).
  4. Aplica delta: `Entrada (+Quantidade)` / `Saida (−Quantidade)`.
  5. **Invariante:** `Saida` não pode deixar saldo < 0 → `InvalidOperationException` (422).
  6. `SaveChanges` único + commit.
- **Projeção em doação:** `DoacaoService.RegistrarAsync` cria a `Doacao` **+ N movimentações** de
  `Entrada` (uma por linha/lote do request, com `Tamanho`) na **mesma transação** (`OrigemTipo =
  Doacao`, `OrigemId = doacao.Id`). Cada linha informa o tamanho do pacote (convertido pelo
  `MedidaHelper`), validade, lote e nº de pacotes.
- **`MedidaHelper`** (classe estática em `Caritas.Service/`) — converte/format unidades, isolando a
  regra de "qual unidade usar":
  - `int ParaBase(decimal valor, string unidade)`: "1 kg" → 1000; valida unidade × `FormaMedida`
    (inválida → `ArgumentException`). Usado ao informar o **tamanho do pacote** (entrada e config).
  - `string Formatar(long totalBase, FormaMedida)`: escolhe a unidade mais legível (pt-BR):
    Peso `<1000`→"X g", `<1_000_000`→"X,Y kg", senão "X,Y t"; Volume `<1000`→"X ml", senão "X,Y L";
    Unidade → "N un".
- **`EstoqueService`**: leitura (alimentos/roupas paginados/filtrados; por id) **+
  `GetResumoAlimentosAsync`** — agrega o estoque da paróquia atual por gênero, soma
  `Σ(Quantidade × Tamanho)` (`long`) e formata via `MedidaHelper`.
- **`ConfiguracaoCestaService`**: CRUD de templates de cesta (nome + linhas alimento/tamanho/qtd).
- **`MontagemCestaService`** (núcleo do fluxo, em duas etapas):
  - `SimularAsync(idConfig, quantidade)` — para cada linha da config, `necessário =
    quantidadePacotes × quantidade`; lê os lotes de `(idItem, tamanho)` da paróquia ordenados por
    validade mais próxima, **alerta os vencidos**, aloca FIFO até cobrir e reporta faltantes.
    **Não** altera estado.
  - `ConfirmarAsync(dto)` — recebe as alocações (eventualmente editadas). Numa transação: cria o
    `LoteCesta` (`Origem = Montagem`, `QuantidadeDisponivel = Quantidade`) e, por alocação, chama
    `MovimentacaoService.AplicarMovimentoAsync` (`Saida`, com `Tamanho`, `OrigemTipo = CestaBasica`,
    `OrigemId = LoteCesta.Id`) — a invariante de saldo rejeita o excesso (422) e reverte tudo.
- **`LoteCestaService`**: listagem do controle de cestas, `GetDisponiveisSelectAsync` (lotes com saldo
  > 0, para o picker de Entrega) e `RegistrarBaixaAsync` — baixa avulsa de cestas (`Transferida`/
  `Descartada`/`Outro`); **rejeita** `Motivo=Entregue` (entrega à família é via `EntregaService`).
  O registro de cesta fechada recebida vive em `DoacaoService` (`Doacao` único de entrada).
- **`EntregaService`**: registro único de **saída a uma `Familia`** (doação de saída). `RegistrarAsync`,
  numa transação, cria a `Entrega` (header com `IdFamilia` validada na paróquia) e, por linha, debita o
  ledger correspondente referenciando `Entrega.Id`: alimentos/roupas via
  `MovimentacaoService.AplicarMovimentoAsync` (`Saida`, `OrigemTipo = Entrega`); cestas via
  `MovimentacaoCesta` (`Motivo = Entregue`, `IdEntrega`) decrementando `LoteCesta.QuantidadeDisponivel`.
  Exige ≥1 linha; invariantes de saldo revertem tudo. `GetPagedAsync` lista por paróquia com resumo
  (Σ cestas, nº de itens) sem N+1.
- **`ItemService`**: CRUD de `Alimento` (gênero + `FormaMedida`) / `Roupa`. **`DoadorService`**: CRUD.
- Mappers DTO↔Entity como métodos de extensão estáticos em `Caritas.Service/Mappers/` (padrão `ParoquiaMapper`).

### Concorrência e integridade

Prioridade máxima em integridade (trade-offs aceitos): **lock pessimista (`FOR UPDATE`)** na linha de
`Estoque` durante a aplicação do delta serializa movimentos concorrentes do mesmo lote; o **índice
único `NULLS NOT DISTINCT`** garante uma única linha de saldo por `(item, paróquia, validade, lote)`,
inclusive com nulos. A transação cobre movimento + saldo (e + entidade, em doação/cesta).

## 6. DTOs (`Caritas.Models/DTOs/`)

- **Item:** `AlimentoCreateDto`/`UpdateDto` (`descricao` = nome do gênero + `formaMedida`),
  `AlimentoResponseDto`; `RoupaCreateDto`/`UpdateDto`/`ResponseDto`.
- **Estoque:** `EstoqueAlimentoResponseDto`/`EstoqueRoupaResponseDto` (campos do item + `tamanho`
  (+ formatado) + `validade`/`lote`/`quantidade`); DTO de filtro. **`ResumoTipoAlimentoDto`**
  (`idAlimento, nome, formaMedida, totalBase, textoFormatado`).
- **Movimentacao:** `LinhaMovimentacaoDto` ganha o **tamanho** do pacote (`valor` + `unidade`);
  `MovimentacaoCreateDto` (`idItem, tamanho?, validade?, lote?, tipoOperacao, quantidade,
  origemTipo, origemId?, observacao?`); `MovimentacaoResponseDto`.
- **Doacao:** `DoacaoCreateDto { idDoador, itens: [{ idItem, tamanho, validade?, lote?, quantidade }], observacao? }` + `DoacaoResponseDto`.
- **ConfiguracaoCesta:** `ConfiguracaoCestaCreateDto`/`UpdateDto` (`nome` + linhas `{ idAlimento, tamanho(valor/unidade), quantidadePacotes }`) + `ResponseDto`.
- **Montagem:** `MontagemSimularDto { idConfiguracaoCesta, quantidade }` → `MontagemPropostaDto { quantidade, linhas[] }` (`PropostaLinhaDto { idAlimento, nomeAlimento, tamanho, tamanhoFormatado, pacotesNecessarios, alocacoes[], pacotesFaltantes }`, `AlocacaoDto { validade, lote, qtdPacotes, vencido }`); `MontagemConfirmarDto { idConfiguracaoCesta, quantidade, alocacoes[] }` (`AlocacaoConfirmadaDto { idAlimento, tamanho, validade, lote, qtdPacotes }`).
- **LoteCesta:** `CestaBaixaCreateDto { motivo, quantidade, observacao? }` (sem `Entregue`) +
  `LoteCestaResponseDto` (controle) + `LoteCestaSelectDto { idLote, label, disponivel }`.
- **Entrega:** `EntregaCreateDto { idFamilia, itens: LinhaMovimentacaoDto[], cestas: [{ idLoteCesta, quantidade }], observacao? }` + `EntregaListItemDto { idFamilia, nomeFamilia, qtdCestas, qtdItens, ... }` + `EntregaResponseDto`.
- **Doador:** CRUD DTOs. **`SelectObjectDto`** para dropdowns (itens/alimentos/doadores).
- **`IdParoquia` nunca entra nos DTOs** — vem de `ICurrentSession.ParoquiaAtualId` (header `X-Paroquia-Id`).

## 7. Controllers (`Caritas.WebApi/Controllers/`) — todos `[Authorize]`

| Método/Rota | Ação |
|-------------|------|
| `POST /api/itens/alimentos` · `PUT /api/itens/alimentos/{id}` | cria/edita Alimento |
| `POST /api/itens/roupas` · `PUT /api/itens/roupas/{id}` | cria/edita Roupa |
| `GET /api/itens/{id}` · `DELETE /api/itens/{id}` · `GET /api/itens/select?tipo=` | obter/excluir/dropdown |
| `GET /api/estoque/alimentos` · `GET /api/estoque/roupas` | listagem paginada+filtrada (projeção) |
| `GET /api/estoque/alimentos/resumo` | total por gênero, na unidade mais legível |
| `GET /api/estoque/{id}` | saldo por id |
| `POST /api/movimentacoes` | registra movimento (Ajuste/Descarte manual) → aplica projeção |
| `GET /api/movimentacoes` | histórico filtrado |
| `POST /api/doadores` · `PUT` · `GET` · `DELETE` | CRUD Doador |
| `POST /api/doacoes` · `GET /api/doacoes` | registra doação (gera movimentações Entrada) / lista |
| `GET/POST/PUT/DELETE /api/configuracoes-cesta` | CRUD de templates de cesta |
| `POST /api/montagens-cesta/simular` | propõe pacotes/validades para montar N cestas |
| `POST /api/montagens-cesta` | confirma a montagem (gera Saídas + cria LoteCesta) |
| `POST /api/doacoes/cestas` | registra cesta fechada recebida (gera `Doacao` + `LoteCesta`) |
| `GET /api/lotes-cesta` · `GET /api/lotes-cesta/select` · `POST /api/lotes-cesta/{id}/baixas` | controle de cestas / lotes disponíveis / baixa avulsa (sem `Entregue`) |
| `GET /api/entregas` · `POST /api/entregas` | lista / registra entrega (doação de saída) a uma família |

Controllers injetam as interfaces de service. `BaseApiController` (com `[ApiController]`/rota) é mantido.

## 8. Validação e erros

DataAnnotations nos DTOs + checagem de `ModelState` → 400. Services lançam
`KeyNotFoundException` (404), `ArgumentException` (400) e `InvalidOperationException` (422, ex.: saldo
insuficiente, paróquia atual ausente) e **confiam no `ErrorHandlingMiddleware`** — sem `try/catch`
por action (mais limpo que o padrão atual de Paroquia/Usuario).

## 9. Integração auth/sessão

`[Authorize]` em todos os endpoints. `CriadoPor`/`AtualizadoPor` saem de `ICurrentSession.UsuarioId`
(via auto-stamp no DbContext). `IdParoquia` de operações sai de `ICurrentSession.ParoquiaAtualId`
(header `X-Paroquia-Id`); ausência → 422.

## Fora de escopo

- Testes automatizados (decisão atual: sem testes).
- Modelagem interna de `Paroquia`, `Usuario` (referenciados por id/FK).
- Job de reconciliação/recálculo do `Estoque` a partir do ledger.
- Endpoints de relatórios/consultas analíticas sobre movimentações.
- **Distribuição da cesta à família** (baixa de `LoteCesta.QuantidadeDisponivel`) — próxima iteração.
