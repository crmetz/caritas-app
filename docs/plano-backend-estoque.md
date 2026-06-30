# Estoque Backend Module — Implementation Plan

> **⚠️ Plano da entrega anterior — parcialmente superado (2026-06-15).** Este plano construiu o
> módulo de estoque conforme o design original. Novas necessidades da Cáritas revisaram o modelo:
> `Alimento` passou a ser um **gênero** + `FormaMedida`; o **tamanho do pacote** virou coordenada
> de lote em `Estoque`/`Movimentacao`; e a `CestaBasica` foi **substituída** pelo fluxo
> `ConfiguracaoCesta` + `LoteCesta` (montagem de N cestas em duas etapas). As partes deste plano que
> tocam `Alimento`, chave do `Estoque`, `LinhaMovimentacaoDto` e `CestaBasica` estão **superadas** —
> consulte as revisões 2026-06-15 em [`modelo-dominio-estoque.md`](./modelo-dominio-estoque.md) e
> [`arquitetura-backend-estoque.md`](./arquitetura-backend-estoque.md). Mantido como histórico; não
> reescrito tarefa a tarefa.

> **⚠️ Revisões posteriores (2026-06-22) — também superam partes deste plano.** As doações de
> **entrada** foram unificadas em `Doacao` (mono-tipo `Itens`/`CestasFechadas`; `LoteCesta.IdDoador` →
> `IdDoacao`) e as **saídas a uma `Familia`** passaram a ser registradas pela entidade `Entrega`
> (`EntregaService`/`EntregaRepository`/`EntregasController`; `MovimentacaoCesta.IdEntrega`;
> `OrigemMovimentacao.Entrega`), tornando `Entrega` a fonte única de tudo que sai para famílias. As
> tarefas deste plano que tocam `DoacaoService`, `LoteCesta` e a baixa de cestas estão **superadas** —
> consulte [`design-doacoes-e-entrega-cesta-familia.md`](./design-doacoes-e-entrega-cesta-familia.md)
> e as revisões 2026-06-22 nos docs de modelo e arquitetura.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the full backend of the Estoque module (entities, EF mappings, repositories, services, DTOs, controllers, DI) following the approved domain model and the repo's conventions.

**Architecture:** Layered `Models → Repository → Service → WebApi`. `MovimentacaoEstoque` is an append-only ledger and the only stock write path; `Estoque` is a maintained projection updated inside a transaction with a pessimistic `FOR UPDATE` lock. Userstamps are auto-stamped in `CaritasDbContext` via `ICurrentSession`, mirroring timestamps. Services/repositories are registered in DI (not the legacy `new`-chain). No automated tests (per decision).

**Tech Stack:** ASP.NET Core 8, EF Core 9 (Npgsql), PostgreSQL 16, code-first migrations.

**Specs:** [`arquitetura-backend-estoque.md`](./arquitetura-backend-estoque.md) · [`modelo-dominio-estoque.md`](./modelo-dominio-estoque.md)

**Conventions to mirror:** file-scoped namespaces; `BaseRepository<T>`/`IBaseRepository<T>`; `PagedResponseDto<T>` + `QueryableExtensions.ToPagedAsync`; `IEntityTypeConfiguration<T>` mappings auto-applied via `ApplyConfigurationsFromAssembly`; static extension mappers in `Caritas.Service/Mappers/`; `SelectObjectDto` for dropdowns; throw `KeyNotFoundException`/`ArgumentException`/`InvalidOperationException` and let `ErrorHandlingMiddleware` translate them.

**Per-task verification:** all code steps end with `dotnet build` from `backend/`. Expected: `Build succeeded`. Commit after each green build.

---

## File Structure

**Created:**
- `Caritas.Models/Common/FullAuditableEntity.cs`
- `Caritas.Models/Enums/{OrigemMovimentacao,CategoriaRoupa,FaixaEtaria,Genero,Estacao,CondicaoRoupa}.cs`
- `Caritas.Models/Entities/{Alimento,Roupa,MovimentacaoEstoque,Doador,CestaBasica}.cs`
- `Caritas.Models/DTOs/Item/{AlimentoCreateDto,AlimentoUpdateDto,AlimentoResponseDto,RoupaCreateDto,RoupaUpdateDto,RoupaResponseDto}.cs`
- `Caritas.Models/DTOs/Estoque/{EstoqueAlimentoResponseDto,EstoqueRoupaResponseDto}.cs`
- `Caritas.Models/DTOs/Movimentacao/{MovimentacaoCreateDto,MovimentacaoResponseDto,LinhaMovimentacaoDto}.cs`
- `Caritas.Models/DTOs/Doador/{DoadorCreateDto,DoadorUpdateDto,DoadorResponseDto}.cs`
- `Caritas.Models/DTOs/Doacao/{DoacaoCreateDto,DoacaoResponseDto}.cs`
- `Caritas.Models/DTOs/CestaBasica/{CestaBasicaCreateDto,CestaBasicaResponseDto}.cs`
- `Caritas.Models/Interfaces/Services/{IItemService,IEstoqueService,IMovimentacaoService,IDoadorService,IDoacaoService,ICestaBasicaService}.cs`
- `Caritas.Repository/Mappings/{ItemMapping,AlimentoMapping,RoupaMapping,EstoqueMapping,MovimentacaoEstoqueMapping,DoadorMapping,DoacaoMapping,CestaBasicaMapping}.cs`
- `Caritas.Repository/Repositories/{ItemRepository,EstoqueRepository,MovimentacaoRepository,DoadorRepository,DoacaoRepository,CestaBasicaRepository}.cs`
- `Caritas.Service/{ItemService,EstoqueService,MovimentacaoService,DoadorService,DoacaoService,CestaBasicaService}.cs`
- `Caritas.Service/Mappers/{ItemMapper,EstoqueMapper,MovimentacaoMapper,DoadorMapper,DoacaoMapper,CestaBasicaMapper}.cs`
- `Caritas.WebApi/Controllers/{ItensController,EstoqueController,MovimentacoesController,DoadoresController,DoacoesController,CestasBasicasController}.cs`

**Modified:**
- `Caritas.Models/Entities/{Item,Estoque,Doacao}.cs` (rewritten to the model)
- `Caritas.Models/Enums/TipoOperacao.cs` (`Alta/Baixa` → `Entrada/Saida`)
- `Caritas.Models/Interfaces/{IItemRepository,IEstoqueRepository,IMovimentacoesEstoqueRepository→IMovimentacaoRepository,IDoacaoRepository}.cs` (rewritten)
- `Caritas.Repository/Context/CaritasDbContext.cs` (DbSets, `ICurrentSession`, userstamp stamping)
- `Caritas.WebApi/Program.cs` (DI registrations)

**Deleted:**
- `Caritas.Models/Entities/{ItemMeta,MovimentacoesEstoque}.cs`
- `Caritas.Models/DTOs/Item/{CreateItemDto,ItemDto,UpdateItemDto}.cs` (stubs)

---

## Phase 0 — Prerequisite: auth/session

### Task 0.1: Merge `main` and relocate `ICurrentSession`

**Files:**
- Move: `Caritas.Service/Session/ICurrentSession.cs` → `Caritas.Models/Interfaces/Services/ICurrentSession.cs`
- Modify: `Caritas.Service/Session/CurrentSession.cs` (namespace import)

- [ ] **Step 1: Merge `main` into the branch**

```bash
cd /home/gabriel/code/lixo/caritas-app
git checkout feat/estoque-crud
git merge origin/main
```

Resolve conflicts favouring `main` for auth infra (`Program.cs`, Identity, `CurrentSession`, `CaritasDbContext` Identity config) while **keeping the estoque entities/DbSets and the two doc files** from this branch. After resolving:

```bash
git add -A && git commit --no-edit
dotnet build backend
```
Expected: `Build succeeded`.

- [ ] **Step 2: Move the `ICurrentSession` interface into `Caritas.Models`**

Create `Caritas.Models/Interfaces/Services/ICurrentSession.cs`:

```csharp
namespace Caritas.Models.Interfaces.Services;

public interface ICurrentSession
{
    int? UsuarioId { get; }
    int? ParoquiaAtualId { get; }
    bool IsAuthenticated { get; }
}
```

Delete the old `Caritas.Service/Session/ICurrentSession.cs`. Update `CurrentSession.cs` to implement the moved interface (add `using Caritas.Models.Interfaces.Services;`, keep the class body). Fix any `using Caritas.Service.Session;` that referenced the interface across the solution (the implementation registration in `Program.cs` keeps `using Caritas.Service.Session;`).

- [ ] **Step 3: Build**

Run: `dotnet build backend`
Expected: `Build succeeded`.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor: move ICurrentSession interface to Caritas.Models for layering"
```

---

## Phase 1 — Models: entities, base, enums

### Task 1.1: `FullAuditableEntity`

**Files:** Create `Caritas.Models/Common/FullAuditableEntity.cs`

- [ ] **Step 1: Create the base class**

```csharp
namespace Caritas.Models.Common;

// Adiciona userstamps sobre os timestamps de AuditableEntity.
// Carimbados automaticamente no CaritasDbContext.SaveChangesAsync via ICurrentSession.
public class FullAuditableEntity : AuditableEntity
{
    public int? CriadoPor { get; set; }
    public int? AtualizadoPor { get; set; }
}
```

- [ ] **Step 2: Build, then commit**

```bash
dotnet build backend          # Build succeeded
git add -A && git commit -m "feat: add FullAuditableEntity (userstamps base)"
```

### Task 1.2: Enums

**Files:**
- Modify: `Caritas.Models/Enums/TipoOperacao.cs`
- Create: `OrigemMovimentacao.cs`, `CategoriaRoupa.cs`, `FaixaEtaria.cs`, `Genero.cs`, `Estacao.cs`, `CondicaoRoupa.cs`

- [ ] **Step 1: Rewrite `TipoOperacao.cs`**

```csharp
using System.Text.Json.Serialization;

namespace Caritas.Models.Enums;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum TipoOperacao
{
    Entrada,
    Saida,
}
```

- [ ] **Step 2: Create the new enums** (one file each, all with `[JsonConverter(typeof(JsonStringEnumConverter))]`)

```csharp
// OrigemMovimentacao.cs
using System.Text.Json.Serialization;
namespace Caritas.Models.Enums;
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum OrigemMovimentacao { Doacao, CestaBasica, Ajuste, Descarte }
```
```csharp
// CategoriaRoupa.cs
using System.Text.Json.Serialization;
namespace Caritas.Models.Enums;
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum CategoriaRoupa { Calca, Calcado, Acessorio, Camisa, Casaco, Outro }
```
```csharp
// FaixaEtaria.cs
using System.Text.Json.Serialization;
namespace Caritas.Models.Enums;
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum FaixaEtaria { Bebe, Infantil, Adolescente, Adulto, Idoso }
```
```csharp
// Genero.cs
using System.Text.Json.Serialization;
namespace Caritas.Models.Enums;
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum Genero { Masculino, Feminino, Unissex }
```
```csharp
// Estacao.cs
using System.Text.Json.Serialization;
namespace Caritas.Models.Enums;
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum Estacao { Inverno, Verao }
```
```csharp
// CondicaoRoupa.cs
using System.Text.Json.Serialization;
namespace Caritas.Models.Enums;
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum CondicaoRoupa { Novo, Usado }
```

- [ ] **Step 3: Build, then commit**

```bash
dotnet build backend          # Build succeeded
git add -A && git commit -m "feat: estoque enums (TipoOperacao Entrada/Saida + roupa/origem enums)"
```

### Task 1.3: Item hierarchy (TPT)

**Files:**
- Modify: `Caritas.Models/Entities/Item.cs`
- Create: `Alimento.cs`, `Roupa.cs`
- Delete: `Caritas.Models/Entities/ItemMeta.cs`

- [ ] **Step 1: Rewrite `Item.cs` (abstract supertype)**

```csharp
using Caritas.Models.Common;
using Caritas.Models.Enums;

namespace Caritas.Models.Entities;

public abstract class Item : FullAuditableEntity
{
    public TipoItem Tipo { get; protected set; }
    public string Descricao { get; set; } = string.Empty;
}
```

- [ ] **Step 2: Create `Alimento.cs` and `Roupa.cs`** (set `Tipo` in the constructor to avoid drift)

```csharp
// Alimento.cs
using Caritas.Models.Enums;
namespace Caritas.Models.Entities;

public class Alimento : Item
{
    public Alimento() { Tipo = TipoItem.Alimento; }
    // Embalagem/quantidade descritos em Descricao (ex.: "Feijão Tio João 1kg").
}
```
```csharp
// Roupa.cs
using Caritas.Models.Enums;
namespace Caritas.Models.Entities;

public class Roupa : Item
{
    public Roupa() { Tipo = TipoItem.Roupa; }

    public CategoriaRoupa Categoria { get; set; }
    public Genero? Genero { get; set; }
    public FaixaEtaria FaixaEtaria { get; set; }
    public string? Tamanho { get; set; }   // "GG", "P", "46"... por isso string
    public Estacao? Estacao { get; set; }
    public CondicaoRoupa? Condicao { get; set; }
    public string? Codigo { get; set; }
}
```

- [ ] **Step 3: Delete `ItemMeta.cs`**

```bash
git rm backend/Caritas.Models/Entities/ItemMeta.cs
```

- [ ] **Step 4: Build, then commit**

```bash
dotnet build backend          # Build succeeded
git add -A && git commit -m "feat: Item TPT hierarchy (Item/Alimento/Roupa), drop ItemMeta"
```

### Task 1.4: `Estoque` and `MovimentacaoEstoque`

**Files:**
- Modify: `Caritas.Models/Entities/Estoque.cs`
- Create: `Caritas.Models/Entities/MovimentacaoEstoque.cs`
- Delete: `Caritas.Models/Entities/MovimentacoesEstoque.cs`

- [ ] **Step 1: Rewrite `Estoque.cs`**

```csharp
using Caritas.Models.Common;

namespace Caritas.Models.Entities;

// Saldo projetado do ledger. Unicidade (IdItem, IdParoquia, Validade, Lote).
public class Estoque : FullAuditableEntity
{
    public int IdItem { get; set; }
    public int IdParoquia { get; set; }
    public DateOnly? Validade { get; set; }
    public string? Lote { get; set; }
    public int Quantidade { get; set; }

    public Item Item { get; set; } = null!;
    public Paroquia Paroquia { get; set; } = null!;
}
```

- [ ] **Step 2: Create `MovimentacaoEstoque.cs`** (append-only ledger)

```csharp
using Caritas.Models.Common;
using Caritas.Models.Enums;

namespace Caritas.Models.Entities;

public class MovimentacaoEstoque : FullAuditableEntity
{
    public int IdItem { get; set; }
    public int IdParoquia { get; set; }
    public DateOnly? Validade { get; set; }
    public string? Lote { get; set; }
    public TipoOperacao TipoOperacao { get; set; }
    public int Quantidade { get; set; }              // sempre > 0; o sinal vem de TipoOperacao
    public OrigemMovimentacao OrigemTipo { get; set; }
    public int? OrigemId { get; set; }               // ref. polimórfica, sem FK
    public string? Observacao { get; set; }

    public Item Item { get; set; } = null!;
}
```

- [ ] **Step 3: Delete `MovimentacoesEstoque.cs`**

```bash
git rm backend/Caritas.Models/Entities/MovimentacoesEstoque.cs
```

- [ ] **Step 4: Build, then commit**

```bash
dotnet build backend          # Build succeeded (repository ainda não atualizado; ver Task 3.1 para DbSet)
git add -A && git commit -m "feat: Estoque (projeção) + MovimentacaoEstoque (ledger)"
```

> Note: if `CaritasDbContext` references the old `MovimentacoesEstoque` DbSet, this build breaks. It's fixed in Task 3.1. If the worker runs tasks strictly in order, temporarily comment the old DbSet line; Task 3.1 rewrites it.

### Task 1.5: `Doador`, `Doacao`, `CestaBasica`

**Files:**
- Create: `Doador.cs`, `CestaBasica.cs`
- Modify: `Doacao.cs`

- [ ] **Step 1: Create `Doador.cs`**

```csharp
using Caritas.Models.Common;
namespace Caritas.Models.Entities;

public class Doador : FullAuditableEntity
{
    public string Nome { get; set; } = string.Empty;
    public string? Documento { get; set; }   // CPF/CNPJ
    public string? Telefone { get; set; }
}
```

- [ ] **Step 2: Rewrite `Doacao.cs` (entrada)**

```csharp
using Caritas.Models.Common;
namespace Caritas.Models.Entities;

// Causa de movimentação (entrada). Conteúdo = suas MovimentacaoEstoque (origemTipo=Doacao).
public class Doacao : FullAuditableEntity
{
    public int IdDoador { get; set; }
    public int IdParoquia { get; set; }
    public string? Observacao { get; set; }

    public Doador Doador { get; set; } = null!;
    public Paroquia Paroquia { get; set; } = null!;
}
```

- [ ] **Step 3: Create `CestaBasica.cs` (saída)**

```csharp
using Caritas.Models.Common;
namespace Caritas.Models.Entities;

// Causa de movimentação (saída). Conteúdo = suas MovimentacaoEstoque (origemTipo=CestaBasica).
public class CestaBasica : FullAuditableEntity
{
    public int IdParoquia { get; set; }
    public int? IdBeneficiario { get; set; }   // FK nullable -> beneficiarios (outro módulo)
    public string? Observacao { get; set; }

    public Paroquia Paroquia { get; set; } = null!;
}
```

> `IdBeneficiario` has no EF navigation because the `Beneficiario` entity isn't in our model yet. The DB-level FK is added in Task 3.4 only if the `beneficiarios` table exists post-merge; otherwise it stays a plain nullable column with a TODO.

- [ ] **Step 4: Build, then commit**

```bash
dotnet build backend          # Build succeeded
git add -A && git commit -m "feat: Doador, Doacao (entrada), CestaBasica (saída) entities"
```

---

## Phase 2 — DTOs

### Task 2.1: Item DTOs (replace stubs)

**Files:** Delete `CreateItemDto.cs`, `ItemDto.cs`, `UpdateItemDto.cs`. Create the six below in `Caritas.Models/DTOs/Item/`.

- [ ] **Step 1: Delete stubs**

```bash
git rm backend/Caritas.Models/DTOs/Item/CreateItemDto.cs backend/Caritas.Models/DTOs/Item/ItemDto.cs backend/Caritas.Models/DTOs/Item/UpdateItemDto.cs
```

- [ ] **Step 2: Create Alimento DTOs**

```csharp
// AlimentoCreateDto.cs
using System.ComponentModel.DataAnnotations;
namespace Caritas.Models.DTOs.Item;
public class AlimentoCreateDto
{
    [Required, MaxLength(200)]
    public string Descricao { get; set; } = string.Empty;
}
```
```csharp
// AlimentoUpdateDto.cs
using System.ComponentModel.DataAnnotations;
namespace Caritas.Models.DTOs.Item;
public class AlimentoUpdateDto
{
    [Required, MaxLength(200)]
    public string Descricao { get; set; } = string.Empty;
}
```
```csharp
// AlimentoResponseDto.cs
namespace Caritas.Models.DTOs.Item;
public class AlimentoResponseDto
{
    public int Id { get; set; }
    public string Descricao { get; set; } = string.Empty;
    public DateTime CriadoEm { get; set; }
    public DateTime AtualizadoEm { get; set; }
}
```

- [ ] **Step 3: Create Roupa DTOs**

```csharp
// RoupaCreateDto.cs
using System.ComponentModel.DataAnnotations;
using Caritas.Models.Enums;
namespace Caritas.Models.DTOs.Item;
public class RoupaCreateDto
{
    [Required, MaxLength(200)] public string Descricao { get; set; } = string.Empty;
    [Required] public CategoriaRoupa Categoria { get; set; }
    [Required] public FaixaEtaria FaixaEtaria { get; set; }
    public Genero? Genero { get; set; }
    [MaxLength(10)] public string? Tamanho { get; set; }
    public Estacao? Estacao { get; set; }
    public CondicaoRoupa? Condicao { get; set; }
    [MaxLength(50)] public string? Codigo { get; set; }
}
```
```csharp
// RoupaUpdateDto.cs  (mesmos campos de RoupaCreateDto)
using System.ComponentModel.DataAnnotations;
using Caritas.Models.Enums;
namespace Caritas.Models.DTOs.Item;
public class RoupaUpdateDto
{
    [Required, MaxLength(200)] public string Descricao { get; set; } = string.Empty;
    [Required] public CategoriaRoupa Categoria { get; set; }
    [Required] public FaixaEtaria FaixaEtaria { get; set; }
    public Genero? Genero { get; set; }
    [MaxLength(10)] public string? Tamanho { get; set; }
    public Estacao? Estacao { get; set; }
    public CondicaoRoupa? Condicao { get; set; }
    [MaxLength(50)] public string? Codigo { get; set; }
}
```
```csharp
// RoupaResponseDto.cs
using Caritas.Models.Enums;
namespace Caritas.Models.DTOs.Item;
public class RoupaResponseDto
{
    public int Id { get; set; }
    public string Descricao { get; set; } = string.Empty;
    public CategoriaRoupa Categoria { get; set; }
    public FaixaEtaria FaixaEtaria { get; set; }
    public Genero? Genero { get; set; }
    public string? Tamanho { get; set; }
    public Estacao? Estacao { get; set; }
    public CondicaoRoupa? Condicao { get; set; }
    public string? Codigo { get; set; }
    public DateTime CriadoEm { get; set; }
    public DateTime AtualizadoEm { get; set; }
}
```

- [ ] **Step 4: Build, then commit**

```bash
dotnet build backend          # Build succeeded
git add -A && git commit -m "feat: Item DTOs (Alimento/Roupa create/update/response), drop stubs"
```

### Task 2.2: Estoque + Movimentacao DTOs

**Files:** Create in `DTOs/Estoque/` and `DTOs/Movimentacao/`.

- [ ] **Step 1: Estoque response DTOs**

```csharp
// DTOs/Estoque/EstoqueAlimentoResponseDto.cs
namespace Caritas.Models.DTOs.Estoque;
public class EstoqueAlimentoResponseDto
{
    public int Id { get; set; }
    public int IdItem { get; set; }
    public string Descricao { get; set; } = string.Empty;
    public DateOnly? Validade { get; set; }
    public string? Lote { get; set; }
    public int Quantidade { get; set; }
}
```
```csharp
// DTOs/Estoque/EstoqueRoupaResponseDto.cs
using Caritas.Models.Enums;
namespace Caritas.Models.DTOs.Estoque;
public class EstoqueRoupaResponseDto
{
    public int Id { get; set; }
    public int IdItem { get; set; }
    public string Descricao { get; set; } = string.Empty;
    public CategoriaRoupa Categoria { get; set; }
    public string? Tamanho { get; set; }
    public CondicaoRoupa? Condicao { get; set; }
    public string? Lote { get; set; }
    public int Quantidade { get; set; }
}
```

- [ ] **Step 2: Movimentacao DTOs**

```csharp
// DTOs/Movimentacao/LinhaMovimentacaoDto.cs  (linha de doação/cesta)
using System.ComponentModel.DataAnnotations;
namespace Caritas.Models.DTOs.Movimentacao;
public class LinhaMovimentacaoDto
{
    [Required] public int IdItem { get; set; }
    public DateOnly? Validade { get; set; }
    [MaxLength(50)] public string? Lote { get; set; }
    [Range(1, int.MaxValue)] public int Quantidade { get; set; }
}
```
```csharp
// DTOs/Movimentacao/MovimentacaoCreateDto.cs  (ajuste/descarte manual)
using System.ComponentModel.DataAnnotations;
using Caritas.Models.Enums;
namespace Caritas.Models.DTOs.Movimentacao;
public class MovimentacaoCreateDto
{
    [Required] public int IdItem { get; set; }
    public DateOnly? Validade { get; set; }
    [MaxLength(50)] public string? Lote { get; set; }
    [Required] public TipoOperacao TipoOperacao { get; set; }
    [Range(1, int.MaxValue)] public int Quantidade { get; set; }
    [Required] public OrigemMovimentacao OrigemTipo { get; set; }
    public int? OrigemId { get; set; }
    [MaxLength(500)] public string? Observacao { get; set; }
}
```
```csharp
// DTOs/Movimentacao/MovimentacaoResponseDto.cs
using Caritas.Models.Enums;
namespace Caritas.Models.DTOs.Movimentacao;
public class MovimentacaoResponseDto
{
    public int Id { get; set; }
    public int IdItem { get; set; }
    public int IdParoquia { get; set; }
    public DateOnly? Validade { get; set; }
    public string? Lote { get; set; }
    public TipoOperacao TipoOperacao { get; set; }
    public int Quantidade { get; set; }
    public OrigemMovimentacao OrigemTipo { get; set; }
    public int? OrigemId { get; set; }
    public string? Observacao { get; set; }
    public DateTime CriadoEm { get; set; }
    public int? CriadoPor { get; set; }
}
```

- [ ] **Step 3: Build, then commit**

```bash
dotnet build backend          # Build succeeded
git add -A && git commit -m "feat: Estoque + Movimentacao DTOs"
```

### Task 2.3: Doador / Doacao / CestaBasica DTOs

**Files:** Create in `DTOs/Doador/`, `DTOs/Doacao/`, `DTOs/CestaBasica/`.

- [ ] **Step 1: Doador DTOs**

```csharp
// DTOs/Doador/DoadorCreateDto.cs
using System.ComponentModel.DataAnnotations;
namespace Caritas.Models.DTOs.Doador;
public class DoadorCreateDto
{
    [Required, MaxLength(150)] public string Nome { get; set; } = string.Empty;
    [MaxLength(20)] public string? Documento { get; set; }
    [MaxLength(20)] public string? Telefone { get; set; }
}
```
```csharp
// DTOs/Doador/DoadorUpdateDto.cs
using System.ComponentModel.DataAnnotations;
namespace Caritas.Models.DTOs.Doador;
public class DoadorUpdateDto
{
    [Required, MaxLength(150)] public string Nome { get; set; } = string.Empty;
    [MaxLength(20)] public string? Documento { get; set; }
    [MaxLength(20)] public string? Telefone { get; set; }
}
```
```csharp
// DTOs/Doador/DoadorResponseDto.cs
namespace Caritas.Models.DTOs.Doador;
public class DoadorResponseDto
{
    public int Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string? Documento { get; set; }
    public string? Telefone { get; set; }
}
```

- [ ] **Step 2: Doacao DTOs**

```csharp
// DTOs/Doacao/DoacaoCreateDto.cs
using System.ComponentModel.DataAnnotations;
using Caritas.Models.DTOs.Movimentacao;
namespace Caritas.Models.DTOs.Doacao;
public class DoacaoCreateDto
{
    [Required] public int IdDoador { get; set; }
    [MaxLength(500)] public string? Observacao { get; set; }
    [Required, MinLength(1)] public List<LinhaMovimentacaoDto> Itens { get; set; } = [];
}
```
```csharp
// DTOs/Doacao/DoacaoResponseDto.cs
namespace Caritas.Models.DTOs.Doacao;
public class DoacaoResponseDto
{
    public int Id { get; set; }
    public int IdDoador { get; set; }
    public int IdParoquia { get; set; }
    public string? Observacao { get; set; }
    public DateTime CriadoEm { get; set; }
}
```

- [ ] **Step 3: CestaBasica DTOs**

```csharp
// DTOs/CestaBasica/CestaBasicaCreateDto.cs
using System.ComponentModel.DataAnnotations;
using Caritas.Models.DTOs.Movimentacao;
namespace Caritas.Models.DTOs.CestaBasica;
public class CestaBasicaCreateDto
{
    public int? IdBeneficiario { get; set; }
    [MaxLength(500)] public string? Observacao { get; set; }
    [Required, MinLength(1)] public List<LinhaMovimentacaoDto> Itens { get; set; } = [];
}
```
```csharp
// DTOs/CestaBasica/CestaBasicaResponseDto.cs
namespace Caritas.Models.DTOs.CestaBasica;
public class CestaBasicaResponseDto
{
    public int Id { get; set; }
    public int IdParoquia { get; set; }
    public int? IdBeneficiario { get; set; }
    public string? Observacao { get; set; }
    public DateTime CriadoEm { get; set; }
}
```

- [ ] **Step 4: Build, then commit**

```bash
dotnet build backend          # Build succeeded
git add -A && git commit -m "feat: Doador/Doacao/CestaBasica DTOs"
```

---

## Phase 3 — Repository / EF

### Task 3.1: `CaritasDbContext` (DbSets + userstamp stamping)

**Files:** Modify `Caritas.Repository/Context/CaritasDbContext.cs`

- [ ] **Step 1: Update DbSets, inject `ICurrentSession`, stamp userstamps**

Replace the estoque DbSets and add userstamp logic (keep all existing non-estoque DbSets and the existing `OnModelCreating` body):

```csharp
using System.Reflection;
using Caritas.Models.Common;
using Caritas.Models.Entities;
using Caritas.Models.Interfaces.Services;
using Microsoft.EntityFrameworkCore;

namespace Caritas.Repository.Context;

public class CaritasDbContext(DbContextOptions<CaritasDbContext> options, ICurrentSession currentSession)
    : DbContext(options)
{
    // ... manter DbSets existentes (Familias, Pessoas, Usuarios, Paroquias, Enderecos,
    //     UsuarioParoquias, Perfis, Permissoes, PerfilPermissoes) ...

    public DbSet<Item> Items => Set<Item>();
    public DbSet<Alimento> Alimentos => Set<Alimento>();
    public DbSet<Roupa> Roupas => Set<Roupa>();
    public DbSet<Estoque> Estoques => Set<Estoque>();
    public DbSet<MovimentacaoEstoque> Movimentacoes => Set<MovimentacaoEstoque>();
    public DbSet<Doador> Doadores => Set<Doador>();
    public DbSet<Doacao> Doacoes => Set<Doacao>();
    public DbSet<CestaBasica> CestasBasicas => Set<CestaBasica>();

    // OnModelCreating: manter o corpo existente (ApplyConfigurationsFromAssembly + configs de Perfil/Usuario).

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var agora = DateTime.UtcNow;
        var usuarioId = currentSession.UsuarioId;

        foreach (var entry in ChangeTracker.Entries<AuditableEntity>())
        {
            if (entry.State == EntityState.Added) entry.Entity.CriadoEm = agora;
            if (entry.State == EntityState.Modified) entry.Entity.AtualizadoEm = agora;
        }

        foreach (var entry in ChangeTracker.Entries<FullAuditableEntity>())
        {
            if (entry.State == EntityState.Added) entry.Entity.CriadoPor = usuarioId;
            if (entry.State == EntityState.Modified) entry.Entity.AtualizadoPor = usuarioId;
        }

        return base.SaveChangesAsync(cancellationToken);
    }
}
```

Remove the old `public DbSet<MovimentacoesEstoque> MovimentacoesEstoques => ...;` line.

- [ ] **Step 2: Build, then commit**

```bash
dotnet build backend          # Build succeeded
git add -A && git commit -m "feat: DbContext estoque DbSets + userstamp auto-stamp via ICurrentSession"
```

> `dotnet ef` resolves `ICurrentSession` through the WebApi host; with no HTTP context it returns null ids — safe at design time.

### Task 3.2: Item TPT mappings

**Files:** Create `ItemMapping.cs`, `AlimentoMapping.cs`, `RoupaMapping.cs` in `Caritas.Repository/Mappings/`

- [ ] **Step 1: `ItemMapping.cs`**

```csharp
using Caritas.Models.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Caritas.Repository.Mappings;

public class ItemMapping : IEntityTypeConfiguration<Item>
{
    public void Configure(EntityTypeBuilder<Item> b)
    {
        b.UseTptMappingStrategy();
        b.ToTable("Item");
        b.HasKey(i => i.Id);
        b.Property(i => i.Tipo).HasConversion<string>().HasMaxLength(20).IsRequired();
        b.Property(i => i.Descricao).HasMaxLength(200).IsRequired();
    }
}
```

- [ ] **Step 2: `AlimentoMapping.cs` and `RoupaMapping.cs`**

```csharp
// AlimentoMapping.cs
using Caritas.Models.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
namespace Caritas.Repository.Mappings;
public class AlimentoMapping : IEntityTypeConfiguration<Alimento>
{
    public void Configure(EntityTypeBuilder<Alimento> b) => b.ToTable("Alimento");
}
```
```csharp
// RoupaMapping.cs
using Caritas.Models.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
namespace Caritas.Repository.Mappings;
public class RoupaMapping : IEntityTypeConfiguration<Roupa>
{
    public void Configure(EntityTypeBuilder<Roupa> b)
    {
        b.ToTable("Roupa");
        b.Property(r => r.Categoria).HasConversion<string>().HasMaxLength(30).IsRequired();
        b.Property(r => r.FaixaEtaria).HasConversion<string>().HasMaxLength(20).IsRequired();
        b.Property(r => r.Genero).HasConversion<string>().HasMaxLength(20);
        b.Property(r => r.Estacao).HasConversion<string>().HasMaxLength(20);
        b.Property(r => r.Condicao).HasConversion<string>().HasMaxLength(20);
        b.Property(r => r.Tamanho).HasMaxLength(10);
        b.Property(r => r.Codigo).HasMaxLength(50);
    }
}
```

- [ ] **Step 3: Build, then commit**

```bash
dotnet build backend          # Build succeeded
git add -A && git commit -m "feat: Item/Alimento/Roupa EF mappings (TPT)"
```

### Task 3.3: Estoque + Movimentacao mappings

**Files:** Create `EstoqueMapping.cs`, `MovimentacaoEstoqueMapping.cs`

- [ ] **Step 1: `EstoqueMapping.cs`** (unique index with `NULLS NOT DISTINCT`)

```csharp
using Caritas.Models.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Caritas.Repository.Mappings;

public class EstoqueMapping : IEntityTypeConfiguration<Estoque>
{
    public void Configure(EntityTypeBuilder<Estoque> b)
    {
        b.ToTable("Estoque");
        b.HasKey(e => e.Id);
        b.Property(e => e.Lote).HasMaxLength(50);
        b.Property(e => e.Quantidade).HasDefaultValue(0);

        b.HasIndex(e => new { e.IdItem, e.IdParoquia, e.Validade, e.Lote })
            .IsUnique()
            .AreNullsDistinct(false);   // Npgsql 9 / PG16: NULLS NOT DISTINCT

        b.HasOne(e => e.Item).WithMany().HasForeignKey(e => e.IdItem).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(e => e.Paroquia).WithMany().HasForeignKey(e => e.IdParoquia).OnDelete(DeleteBehavior.Restrict);
    }
}
```

> If `AreNullsDistinct` isn't available in the installed Npgsql provider, remove that line and instead hand-edit the migration to `migrationBuilder.Sql("CREATE UNIQUE INDEX \"IX_Estoque_coords\" ON \"Estoque\" (\"IdItem\",\"IdParoquia\",\"Validade\",\"Lote\") NULLS NOT DISTINCT;")` (and drop the default index in `Down`).

- [ ] **Step 2: `MovimentacaoEstoqueMapping.cs`**

```csharp
using Caritas.Models.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Caritas.Repository.Mappings;

public class MovimentacaoEstoqueMapping : IEntityTypeConfiguration<MovimentacaoEstoque>
{
    public void Configure(EntityTypeBuilder<MovimentacaoEstoque> b)
    {
        b.ToTable("MovimentacaoEstoque");
        b.HasKey(m => m.Id);
        b.Property(m => m.TipoOperacao).HasConversion<string>().HasMaxLength(10).IsRequired();
        b.Property(m => m.OrigemTipo).HasConversion<string>().HasMaxLength(20).IsRequired();
        b.Property(m => m.Lote).HasMaxLength(50);
        b.Property(m => m.Observacao).HasMaxLength(500);

        b.HasIndex(m => new { m.OrigemTipo, m.OrigemId });
        b.HasIndex(m => new { m.IdItem, m.IdParoquia });

        b.HasOne(m => m.Item).WithMany().HasForeignKey(m => m.IdItem).OnDelete(DeleteBehavior.Restrict);
        b.HasOne<Paroquia>().WithMany().HasForeignKey(m => m.IdParoquia).OnDelete(DeleteBehavior.Restrict);
        // OrigemId: sem FK (polimórfico).
    }
}
```

- [ ] **Step 3: Build, then commit**

```bash
dotnet build backend          # Build succeeded
git add -A && git commit -m "feat: Estoque (unique NULLS NOT DISTINCT) + Movimentacao mappings"
```

### Task 3.4: Doador / Doacao / CestaBasica mappings

**Files:** Create `DoadorMapping.cs`, `DoacaoMapping.cs`, `CestaBasicaMapping.cs`

- [ ] **Step 1: Create the three mappings**

```csharp
// DoadorMapping.cs
using Caritas.Models.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
namespace Caritas.Repository.Mappings;
public class DoadorMapping : IEntityTypeConfiguration<Doador>
{
    public void Configure(EntityTypeBuilder<Doador> b)
    {
        b.ToTable("Doador");
        b.HasKey(d => d.Id);
        b.Property(d => d.Nome).HasMaxLength(150).IsRequired();
        b.Property(d => d.Documento).HasMaxLength(20);
        b.Property(d => d.Telefone).HasMaxLength(20);
    }
}
```
```csharp
// DoacaoMapping.cs
using Caritas.Models.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
namespace Caritas.Repository.Mappings;
public class DoacaoMapping : IEntityTypeConfiguration<Doacao>
{
    public void Configure(EntityTypeBuilder<Doacao> b)
    {
        b.ToTable("Doacao");
        b.HasKey(d => d.Id);
        b.Property(d => d.Observacao).HasMaxLength(500);
        b.HasOne(d => d.Doador).WithMany().HasForeignKey(d => d.IdDoador).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(d => d.Paroquia).WithMany().HasForeignKey(d => d.IdParoquia).OnDelete(DeleteBehavior.Restrict);
    }
}
```
```csharp
// CestaBasicaMapping.cs
using Caritas.Models.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
namespace Caritas.Repository.Mappings;
public class CestaBasicaMapping : IEntityTypeConfiguration<CestaBasica>
{
    public void Configure(EntityTypeBuilder<CestaBasica> b)
    {
        b.ToTable("CestaBasica");
        b.HasKey(c => c.Id);
        b.Property(c => c.Observacao).HasMaxLength(500);
        b.HasOne(c => c.Paroquia).WithMany().HasForeignKey(c => c.IdParoquia).OnDelete(DeleteBehavior.Restrict);
        b.Property(c => c.IdBeneficiario);
        // TODO: quando a tabela "beneficiarios" existir, adicionar FK nullable em migration manual.
    }
}
```

- [ ] **Step 2: Build, then commit**

```bash
dotnet build backend          # Build succeeded
git add -A && git commit -m "feat: Doador/Doacao/CestaBasica EF mappings"
```

### Task 3.5: Repository interfaces

**Files:** Rewrite `IItemRepository.cs`, `IEstoqueRepository.cs`; rename `IMovimentacoesEstoqueRepository.cs` → `IMovimentacaoRepository.cs`; rewrite `IDoacaoRepository.cs`; create `IDoadorRepository.cs`, `ICestaBasicaRepository.cs` in `Caritas.Models/Interfaces/`.

- [ ] **Step 1: Item / Estoque / Movimentacao interfaces**

```csharp
// IItemRepository.cs
using Caritas.Models.DTOs.Pagination;
using Caritas.Models.Entities;
using Caritas.Models.Enums;
namespace Caritas.Models.Interfaces;
public interface IItemRepository : IBaseRepository<Item>
{
    Task<Alimento> AddAlimentoAsync(Alimento alimento);
    Task<Roupa> AddRoupaAsync(Roupa roupa);
    Task<Alimento?> GetAlimentoByIdAsync(int id);
    Task<Roupa?> GetRoupaByIdAsync(int id);
    Task UpdateAsync(Item item);                 // atualiza subtipo já rastreado
    Task<List<Item>> GetSelectAsync(TipoItem? tipo);
}
```
```csharp
// IEstoqueRepository.cs
using Caritas.Models.DTOs.Pagination;
using Caritas.Models.Entities;
using Caritas.Models.Enums;
namespace Caritas.Models.Interfaces;
public interface IEstoqueRepository : IBaseRepository<Estoque>
{
    Task<PagedResponseDto<Estoque>> GetPagedByTipoAsync(TipoItem tipo, int page, int pageSize, string? busca);
    Task<Estoque?> GetByCoordsForUpdateAsync(int idItem, int idParoquia, DateOnly? validade, string? lote);
    void Add(Estoque estoque);                   // sem commit (uso transacional)
}
```
```csharp
// IMovimentacaoRepository.cs  (renomeado de IMovimentacoesEstoqueRepository)
using Caritas.Models.DTOs.Pagination;
using Caritas.Models.Entities;
using Caritas.Models.Enums;
namespace Caritas.Models.Interfaces;
public interface IMovimentacaoRepository : IBaseRepository<MovimentacaoEstoque>
{
    Task<PagedResponseDto<MovimentacaoEstoque>> GetHistoricoAsync(
        int page, int pageSize, int? idItem, int? idParoquia, OrigemMovimentacao? origemTipo);
    void Add(MovimentacaoEstoque movimentacao);  // sem commit (uso transacional)
}
```

- [ ] **Step 2: Doador / Doacao / CestaBasica interfaces**

```csharp
// IDoadorRepository.cs
using Caritas.Models.Entities;
namespace Caritas.Models.Interfaces;
public interface IDoadorRepository : IBaseRepository<Doador> { }
```
```csharp
// IDoacaoRepository.cs
using Caritas.Models.DTOs.Pagination;
using Caritas.Models.Entities;
namespace Caritas.Models.Interfaces;
public interface IDoacaoRepository : IBaseRepository<Doacao>
{
    void Add(Doacao doacao);   // sem commit (uso transacional)
}
```
```csharp
// ICestaBasicaRepository.cs
using Caritas.Models.Entities;
namespace Caritas.Models.Interfaces;
public interface ICestaBasicaRepository : IBaseRepository<CestaBasica>
{
    void Add(CestaBasica cesta);   // sem commit (uso transacional)
}
```

Delete the old `IMovimentacoesEstoqueRepository.cs` (`git rm`).

- [ ] **Step 3: Build, then commit**

```bash
dotnet build backend          # Build succeeded (impls ainda não existem; só interfaces)
git add -A && git commit -m "feat: rewrite estoque repository interfaces"
```

### Task 3.6: Repository implementations

**Files:** Create the six repositories in `Caritas.Repository/Repositories/`.

- [ ] **Step 1: `ItemRepository.cs`**

```csharp
using Caritas.Models.Entities;
using Caritas.Models.Enums;
using Caritas.Models.Interfaces;
using Caritas.Repository.Context;
using Microsoft.EntityFrameworkCore;

namespace Caritas.Repository.Repositories;

public class ItemRepository(CaritasDbContext context) : BaseRepository<Item>(context), IItemRepository
{
    public async Task<Alimento> AddAlimentoAsync(Alimento alimento)
    {
        await Context.Alimentos.AddAsync(alimento);
        await Context.SaveChangesAsync();
        return alimento;
    }

    public async Task<Roupa> AddRoupaAsync(Roupa roupa)
    {
        await Context.Roupas.AddAsync(roupa);
        await Context.SaveChangesAsync();
        return roupa;
    }

    public async Task<Alimento?> GetAlimentoByIdAsync(int id)
        => await Context.Alimentos.FirstOrDefaultAsync(a => a.Id == id);

    public async Task<Roupa?> GetRoupaByIdAsync(int id)
        => await Context.Roupas.FirstOrDefaultAsync(r => r.Id == id);

    public async Task UpdateAsync(Item item)
    {
        Context.Update(item);
        await Context.SaveChangesAsync();
    }

    public async Task<List<Item>> GetSelectAsync(TipoItem? tipo)
        => await DbSet.Where(i => tipo == null || i.Tipo == tipo)
                      .OrderBy(i => i.Descricao)
                      .ToListAsync();
}
```

- [ ] **Step 2: `EstoqueRepository.cs`** (filtered reads + `FOR UPDATE`)

```csharp
using Caritas.Models.DTOs.Pagination;
using Caritas.Models.Entities;
using Caritas.Models.Enums;
using Caritas.Models.Interfaces;
using Caritas.Repository.Context;
using Caritas.Repository.Extensions;
using Microsoft.EntityFrameworkCore;

namespace Caritas.Repository.Repositories;

public class EstoqueRepository(CaritasDbContext context) : BaseRepository<Estoque>(context), IEstoqueRepository
{
    public async Task<PagedResponseDto<Estoque>> GetPagedByTipoAsync(
        TipoItem tipo, int page, int pageSize, string? busca)
    {
        var query = DbSet.Include(e => e.Item)
                         .Where(e => e.Item.Tipo == tipo);

        if (!string.IsNullOrWhiteSpace(busca))
            query = query.Where(e => EF.Functions.ILike(e.Item.Descricao, $"%{busca}%")
                                  || (e.Lote != null && EF.Functions.ILike(e.Lote, $"%{busca}%")));

        return await query.OrderBy(e => e.Validade).ThenBy(e => e.Id).ToPagedAsync(page, pageSize);
    }

    // Lock pessimista da linha de saldo. Deve rodar dentro de uma transação (ver MovimentacaoService).
    public async Task<Estoque?> GetByCoordsForUpdateAsync(int idItem, int idParoquia, DateOnly? validade, string? lote)
    {
        var rows = await DbSet.FromSql(
            $@"SELECT * FROM ""Estoque""
               WHERE ""IdItem"" = {idItem}
                 AND ""IdParoquia"" = {idParoquia}
                 AND ""Validade"" IS NOT DISTINCT FROM {validade}
                 AND ""Lote"" IS NOT DISTINCT FROM {lote}
               FOR UPDATE").ToListAsync();
        return rows.FirstOrDefault();
    }

    public void Add(Estoque estoque) => DbSet.Add(estoque);
}
```

- [ ] **Step 3: `MovimentacaoRepository.cs`**

```csharp
using Caritas.Models.DTOs.Pagination;
using Caritas.Models.Entities;
using Caritas.Models.Enums;
using Caritas.Models.Interfaces;
using Caritas.Repository.Context;
using Caritas.Repository.Extensions;
using Microsoft.EntityFrameworkCore;

namespace Caritas.Repository.Repositories;

public class MovimentacaoRepository(CaritasDbContext context)
    : BaseRepository<MovimentacaoEstoque>(context), IMovimentacaoRepository
{
    public async Task<PagedResponseDto<MovimentacaoEstoque>> GetHistoricoAsync(
        int page, int pageSize, int? idItem, int? idParoquia, OrigemMovimentacao? origemTipo)
    {
        var query = DbSet.AsQueryable();
        if (idItem is not null) query = query.Where(m => m.IdItem == idItem);
        if (idParoquia is not null) query = query.Where(m => m.IdParoquia == idParoquia);
        if (origemTipo is not null) query = query.Where(m => m.OrigemTipo == origemTipo);
        return await query.OrderByDescending(m => m.CriadoEm).ToPagedAsync(page, pageSize);
    }

    public void Add(MovimentacaoEstoque movimentacao) => DbSet.Add(movimentacao);
}
```

- [ ] **Step 4: `DoadorRepository.cs`, `DoacaoRepository.cs`, `CestaBasicaRepository.cs`**

```csharp
// DoadorRepository.cs
using Caritas.Models.Entities;
using Caritas.Models.Interfaces;
using Caritas.Repository.Context;
namespace Caritas.Repository.Repositories;
public class DoadorRepository(CaritasDbContext context) : BaseRepository<Doador>(context), IDoadorRepository { }
```
```csharp
// DoacaoRepository.cs
using Caritas.Models.Entities;
using Caritas.Models.Interfaces;
using Caritas.Repository.Context;
namespace Caritas.Repository.Repositories;
public class DoacaoRepository(CaritasDbContext context) : BaseRepository<Doacao>(context), IDoacaoRepository
{
    public void Add(Doacao doacao) => DbSet.Add(doacao);
}
```
```csharp
// CestaBasicaRepository.cs
using Caritas.Models.Entities;
using Caritas.Models.Interfaces;
using Caritas.Repository.Context;
namespace Caritas.Repository.Repositories;
public class CestaBasicaRepository(CaritasDbContext context) : BaseRepository<CestaBasica>(context), ICestaBasicaRepository
{
    public void Add(CestaBasica cesta) => DbSet.Add(cesta);
}
```

- [ ] **Step 5: Build, then commit**

```bash
dotnet build backend          # Build succeeded
git add -A && git commit -m "feat: estoque repository implementations (incl. FOR UPDATE coords lock)"
```

### Task 3.7: Migration

- [ ] **Step 1: Generate the migration**

```bash
cd backend
dotnet ef migrations add EstoqueModulo --project Caritas.Repository --startup-project Caritas.WebApi
```
Expected: migration files created under `Caritas.Repository/Migrations/`. Open the generated migration and confirm the `Estoque` unique index carries `NULLS NOT DISTINCT` (if not, apply the raw-SQL fallback from Task 3.3 Step 1).

- [ ] **Step 2: Build and apply (startup auto-migrates)**

```bash
dotnet build backend          # Build succeeded
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: EF migration for estoque module"
```

---

## Phase 4 — Service layer

### Task 4.1: Service interfaces

**Files:** Create the six in `Caritas.Models/Interfaces/Services/`.

- [ ] **Step 1: Create interfaces**

```csharp
// IItemService.cs
using Caritas.Models.DTOs.Common;
using Caritas.Models.DTOs.Item;
using Caritas.Models.Enums;
namespace Caritas.Models.Interfaces.Services;
public interface IItemService
{
    Task<AlimentoResponseDto> CreateAlimentoAsync(AlimentoCreateDto dto);
    Task<AlimentoResponseDto> UpdateAlimentoAsync(int id, AlimentoUpdateDto dto);
    Task<RoupaResponseDto> CreateRoupaAsync(RoupaCreateDto dto);
    Task<RoupaResponseDto> UpdateRoupaAsync(int id, RoupaUpdateDto dto);
    Task DeleteAsync(int id);
    Task<List<SelectObjectDto>> GetSelectAsync(TipoItem? tipo);
}
```
```csharp
// IEstoqueService.cs
using Caritas.Models.DTOs.Estoque;
using Caritas.Models.DTOs.Pagination;
namespace Caritas.Models.Interfaces.Services;
public interface IEstoqueService
{
    Task<PagedResponseDto<EstoqueAlimentoResponseDto>> GetAlimentosAsync(int page, int pageSize, string? busca);
    Task<PagedResponseDto<EstoqueRoupaResponseDto>> GetRoupasAsync(int page, int pageSize, string? busca);
}
```
```csharp
// IMovimentacaoService.cs
using Caritas.Models.DTOs.Movimentacao;
using Caritas.Models.DTOs.Pagination;
using Caritas.Models.Entities;
using Caritas.Models.Enums;
namespace Caritas.Models.Interfaces.Services;
public interface IMovimentacaoService
{
    Task<MovimentacaoResponseDto> RegistrarAsync(MovimentacaoCreateDto dto);
    Task<PagedResponseDto<MovimentacaoResponseDto>> GetHistoricoAsync(
        int page, int pageSize, int? idItem, int? idParoquia, OrigemMovimentacao? origemTipo);
    // Aplica um movimento ao saldo SEM commit nem transação própria — usado por Doacao/CestaBasica.
    Task AplicarMovimentoAsync(MovimentacaoEstoque movimentacao);
}
```
```csharp
// IDoadorService.cs
using Caritas.Models.DTOs.Doador;
using Caritas.Models.DTOs.Pagination;
namespace Caritas.Models.Interfaces.Services;
public interface IDoadorService
{
    Task<PagedResponseDto<DoadorResponseDto>> GetPagedAsync(int page, int pageSize);
    Task<DoadorResponseDto> GetByIdAsync(int id);
    Task<DoadorResponseDto> CreateAsync(DoadorCreateDto dto);
    Task<DoadorResponseDto> UpdateAsync(int id, DoadorUpdateDto dto);
    Task DeleteAsync(int id);
}
```
```csharp
// IDoacaoService.cs
using Caritas.Models.DTOs.Doacao;
namespace Caritas.Models.Interfaces.Services;
public interface IDoacaoService
{
    Task<DoacaoResponseDto> RegistrarAsync(DoacaoCreateDto dto);
}
```
```csharp
// ICestaBasicaService.cs
using Caritas.Models.DTOs.CestaBasica;
namespace Caritas.Models.Interfaces.Services;
public interface ICestaBasicaService
{
    Task<CestaBasicaResponseDto> RegistrarAsync(CestaBasicaCreateDto dto);
}
```

- [ ] **Step 2: Build, then commit**

```bash
dotnet build backend          # Build succeeded
git add -A && git commit -m "feat: estoque service interfaces"
```

### Task 4.2: Mappers

**Files:** Create `ItemMapper.cs`, `EstoqueMapper.cs`, `MovimentacaoMapper.cs`, `DoadorMapper.cs`, `DoacaoMapper.cs`, `CestaBasicaMapper.cs` in `Caritas.Service/Mappers/`.

- [ ] **Step 1: `ItemMapper.cs`**

```csharp
using Caritas.Models.DTOs.Common;
using Caritas.Models.DTOs.Item;
using Caritas.Models.Entities;

namespace Caritas.Service.Mappers;

public static class ItemMapper
{
    public static Alimento ToEntity(this AlimentoCreateDto dto) => new() { Descricao = dto.Descricao };

    public static Roupa ToEntity(this RoupaCreateDto dto) => new()
    {
        Descricao = dto.Descricao, Categoria = dto.Categoria, FaixaEtaria = dto.FaixaEtaria,
        Genero = dto.Genero, Tamanho = dto.Tamanho, Estacao = dto.Estacao,
        Condicao = dto.Condicao, Codigo = dto.Codigo,
    };

    public static AlimentoResponseDto ToResponseDto(this Alimento a) => new()
    {
        Id = a.Id, Descricao = a.Descricao, CriadoEm = a.CriadoEm, AtualizadoEm = a.AtualizadoEm,
    };

    public static RoupaResponseDto ToResponseDto(this Roupa r) => new()
    {
        Id = r.Id, Descricao = r.Descricao, Categoria = r.Categoria, FaixaEtaria = r.FaixaEtaria,
        Genero = r.Genero, Tamanho = r.Tamanho, Estacao = r.Estacao, Condicao = r.Condicao,
        Codigo = r.Codigo, CriadoEm = r.CriadoEm, AtualizadoEm = r.AtualizadoEm,
    };

    public static SelectObjectDto ToSelectObjectDto(this Item i) => new() { Value = i.Id, Label = i.Descricao };
}
```

- [ ] **Step 2: `EstoqueMapper.cs`, `MovimentacaoMapper.cs`**

```csharp
// EstoqueMapper.cs
using Caritas.Models.DTOs.Estoque;
using Caritas.Models.Entities;
namespace Caritas.Service.Mappers;
public static class EstoqueMapper
{
    public static EstoqueAlimentoResponseDto ToAlimentoDto(this Estoque e) => new()
    {
        Id = e.Id, IdItem = e.IdItem, Descricao = e.Item.Descricao,
        Validade = e.Validade, Lote = e.Lote, Quantidade = e.Quantidade,
    };

    public static EstoqueRoupaResponseDto ToRoupaDto(this Estoque e)
    {
        var roupa = (Roupa)e.Item;
        return new()
        {
            Id = e.Id, IdItem = e.IdItem, Descricao = roupa.Descricao, Categoria = roupa.Categoria,
            Tamanho = roupa.Tamanho, Condicao = roupa.Condicao, Lote = e.Lote, Quantidade = e.Quantidade,
        };
    }
}
```
```csharp
// MovimentacaoMapper.cs
using Caritas.Models.DTOs.Movimentacao;
using Caritas.Models.Entities;
namespace Caritas.Service.Mappers;
public static class MovimentacaoMapper
{
    public static MovimentacaoResponseDto ToResponseDto(this MovimentacaoEstoque m) => new()
    {
        Id = m.Id, IdItem = m.IdItem, IdParoquia = m.IdParoquia, Validade = m.Validade, Lote = m.Lote,
        TipoOperacao = m.TipoOperacao, Quantidade = m.Quantidade, OrigemTipo = m.OrigemTipo,
        OrigemId = m.OrigemId, Observacao = m.Observacao, CriadoEm = m.CriadoEm, CriadoPor = m.CriadoPor,
    };
}
```

- [ ] **Step 3: `DoadorMapper.cs`, `DoacaoMapper.cs`, `CestaBasicaMapper.cs`**

```csharp
// DoadorMapper.cs
using Caritas.Models.DTOs.Doador;
using Caritas.Models.Entities;
namespace Caritas.Service.Mappers;
public static class DoadorMapper
{
    public static Doador ToEntity(this DoadorCreateDto d) => new() { Nome = d.Nome, Documento = d.Documento, Telefone = d.Telefone };
    public static DoadorResponseDto ToResponseDto(this Doador d) => new() { Id = d.Id, Nome = d.Nome, Documento = d.Documento, Telefone = d.Telefone };
}
```
```csharp
// DoacaoMapper.cs
using Caritas.Models.DTOs.Doacao;
using Caritas.Models.Entities;
namespace Caritas.Service.Mappers;
public static class DoacaoMapper
{
    public static DoacaoResponseDto ToResponseDto(this Doacao d) => new()
    { Id = d.Id, IdDoador = d.IdDoador, IdParoquia = d.IdParoquia, Observacao = d.Observacao, CriadoEm = d.CriadoEm };
}
```
```csharp
// CestaBasicaMapper.cs
using Caritas.Models.DTOs.CestaBasica;
using Caritas.Models.Entities;
namespace Caritas.Service.Mappers;
public static class CestaBasicaMapper
{
    public static CestaBasicaResponseDto ToResponseDto(this CestaBasica c) => new()
    { Id = c.Id, IdParoquia = c.IdParoquia, IdBeneficiario = c.IdBeneficiario, Observacao = c.Observacao, CriadoEm = c.CriadoEm };
}
```

- [ ] **Step 4: Build, then commit**

```bash
dotnet build backend          # Build succeeded
git add -A && git commit -m "feat: estoque DTO mappers"
```

### Task 4.3: `ItemService` and `EstoqueService`

**Files:** Create `ItemService.cs`, `EstoqueService.cs` in `Caritas.Service/`.

- [ ] **Step 1: `ItemService.cs`**

```csharp
using Caritas.Models.DTOs.Common;
using Caritas.Models.DTOs.Item;
using Caritas.Models.Entities;
using Caritas.Models.Enums;
using Caritas.Models.Interfaces;
using Caritas.Models.Interfaces.Services;
using Caritas.Service.Mappers;

namespace Caritas.Service;

public class ItemService(IItemRepository itemRepository) : IItemService
{
    public async Task<AlimentoResponseDto> CreateAlimentoAsync(AlimentoCreateDto dto)
        => (await itemRepository.AddAlimentoAsync(dto.ToEntity())).ToResponseDto();

    public async Task<AlimentoResponseDto> UpdateAlimentoAsync(int id, AlimentoUpdateDto dto)
    {
        var alimento = await itemRepository.GetAlimentoByIdAsync(id)
            ?? throw new KeyNotFoundException($"Alimento com id {id} não encontrado.");
        alimento.Descricao = dto.Descricao;
        await itemRepository.UpdateAsync(alimento);
        return alimento.ToResponseDto();
    }

    public async Task<RoupaResponseDto> CreateRoupaAsync(RoupaCreateDto dto)
        => (await itemRepository.AddRoupaAsync(dto.ToEntity())).ToResponseDto();

    public async Task<RoupaResponseDto> UpdateRoupaAsync(int id, RoupaUpdateDto dto)
    {
        var roupa = await itemRepository.GetRoupaByIdAsync(id)
            ?? throw new KeyNotFoundException($"Roupa com id {id} não encontrada.");
        roupa.Descricao = dto.Descricao; roupa.Categoria = dto.Categoria; roupa.FaixaEtaria = dto.FaixaEtaria;
        roupa.Genero = dto.Genero; roupa.Tamanho = dto.Tamanho; roupa.Estacao = dto.Estacao;
        roupa.Condicao = dto.Condicao; roupa.Codigo = dto.Codigo;
        await itemRepository.UpdateAsync(roupa);
        return roupa.ToResponseDto();
    }

    public Task DeleteAsync(int id) => itemRepository.DeleteAsync(id);

    public async Task<List<SelectObjectDto>> GetSelectAsync(TipoItem? tipo)
        => (await itemRepository.GetSelectAsync(tipo)).Select(i => i.ToSelectObjectDto()).ToList();
}
```

- [ ] **Step 2: `EstoqueService.cs`**

```csharp
using Caritas.Models.DTOs.Estoque;
using Caritas.Models.DTOs.Pagination;
using Caritas.Models.Enums;
using Caritas.Models.Interfaces;
using Caritas.Models.Interfaces.Services;
using Caritas.Service.Mappers;

namespace Caritas.Service;

public class EstoqueService(IEstoqueRepository estoqueRepository) : IEstoqueService
{
    public async Task<PagedResponseDto<EstoqueAlimentoResponseDto>> GetAlimentosAsync(int page, int pageSize, string? busca)
    {
        var paged = await estoqueRepository.GetPagedByTipoAsync(TipoItem.Alimento, page, pageSize, busca);
        return new() { Items = paged.Items.Select(e => e.ToAlimentoDto()), TotalCount = paged.TotalCount };
    }

    public async Task<PagedResponseDto<EstoqueRoupaResponseDto>> GetRoupasAsync(int page, int pageSize, string? busca)
    {
        var paged = await estoqueRepository.GetPagedByTipoAsync(TipoItem.Roupa, page, pageSize, busca);
        return new() { Items = paged.Items.Select(e => e.ToRoupaDto()), TotalCount = paged.TotalCount };
    }
}
```

- [ ] **Step 3: Build, then commit**

```bash
dotnet build backend          # Build succeeded
git add -A && git commit -m "feat: ItemService + EstoqueService"
```

### Task 4.4: `MovimentacaoService` (transactional projection)

**Files:** Create `Caritas.Service/MovimentacaoService.cs`

- [ ] **Step 1: Implement the service**

```csharp
using Caritas.Models.DTOs.Movimentacao;
using Caritas.Models.DTOs.Pagination;
using Caritas.Models.Entities;
using Caritas.Models.Enums;
using Caritas.Models.Interfaces;
using Caritas.Models.Interfaces.Services;
using Caritas.Repository.Context;
using Caritas.Service.Mappers;

namespace Caritas.Service;

public class MovimentacaoService(
    CaritasDbContext context,
    IMovimentacaoRepository movimentacaoRepository,
    IEstoqueRepository estoqueRepository,
    ICurrentSession session) : IMovimentacaoService
{
    public async Task<MovimentacaoResponseDto> RegistrarAsync(MovimentacaoCreateDto dto)
    {
        var idParoquia = session.ParoquiaAtualId
            ?? throw new InvalidOperationException("Paróquia atual não definida (header X-Paroquia-Id).");

        await using var tx = await context.Database.BeginTransactionAsync();

        var mov = new MovimentacaoEstoque
        {
            IdItem = dto.IdItem, IdParoquia = idParoquia, Validade = dto.Validade, Lote = dto.Lote,
            TipoOperacao = dto.TipoOperacao, Quantidade = dto.Quantidade,
            OrigemTipo = dto.OrigemTipo, OrigemId = dto.OrigemId, Observacao = dto.Observacao,
        };

        await AplicarMovimentoAsync(mov);
        await context.SaveChangesAsync();
        await tx.CommitAsync();
        return mov.ToResponseDto();
    }

    // Insere o movimento e aplica o delta ao saldo (lock pessimista). NÃO commita — o caller controla a transação.
    public async Task AplicarMovimentoAsync(MovimentacaoEstoque mov)
    {
        if (mov.Quantidade <= 0)
            throw new ArgumentException("Quantidade deve ser positiva.");

        movimentacaoRepository.Add(mov);

        var estoque = await estoqueRepository.GetByCoordsForUpdateAsync(mov.IdItem, mov.IdParoquia, mov.Validade, mov.Lote);
        if (estoque is null)
        {
            estoque = new Estoque
            {
                IdItem = mov.IdItem, IdParoquia = mov.IdParoquia,
                Validade = mov.Validade, Lote = mov.Lote, Quantidade = 0,
            };
            estoqueRepository.Add(estoque);
        }

        estoque.Quantidade += mov.TipoOperacao == TipoOperacao.Entrada ? mov.Quantidade : -mov.Quantidade;
        if (estoque.Quantidade < 0)
            throw new InvalidOperationException("Saldo insuficiente para a saída.");
    }

    public async Task<PagedResponseDto<MovimentacaoResponseDto>> GetHistoricoAsync(
        int page, int pageSize, int? idItem, int? idParoquia, OrigemMovimentacao? origemTipo)
    {
        var paged = await movimentacaoRepository.GetHistoricoAsync(page, pageSize, idItem, idParoquia, origemTipo);
        return new() { Items = paged.Items.Select(m => m.ToResponseDto()), TotalCount = paged.TotalCount };
    }
}
```

- [ ] **Step 2: Build, then commit**

```bash
dotnet build backend          # Build succeeded
git add -A && git commit -m "feat: MovimentacaoService (transactional ledger projection + FOR UPDATE)"
```

### Task 4.5: `DoadorService`, `DoacaoService`, `CestaBasicaService`

**Files:** Create the three services in `Caritas.Service/`.

- [ ] **Step 1: `DoadorService.cs`**

```csharp
using Caritas.Models.DTOs.Doador;
using Caritas.Models.DTOs.Pagination;
using Caritas.Models.Interfaces;
using Caritas.Models.Interfaces.Services;
using Caritas.Service.Mappers;

namespace Caritas.Service;

public class DoadorService(IDoadorRepository doadorRepository) : IDoadorService
{
    public async Task<PagedResponseDto<DoadorResponseDto>> GetPagedAsync(int page, int pageSize)
    {
        var paged = await doadorRepository.GetPagedAsync(page, pageSize);
        return new() { Items = paged.Items.Select(d => d.ToResponseDto()), TotalCount = paged.TotalCount };
    }

    public async Task<DoadorResponseDto> GetByIdAsync(int id)
    {
        var doador = await doadorRepository.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Doador com id {id} não encontrado.");
        return doador.ToResponseDto();
    }

    public async Task<DoadorResponseDto> CreateAsync(DoadorCreateDto dto)
        => (await doadorRepository.AddAsync(dto.ToEntity())).ToResponseDto();

    public async Task<DoadorResponseDto> UpdateAsync(int id, DoadorUpdateDto dto)
    {
        var doador = await doadorRepository.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Doador com id {id} não encontrado.");
        doador.Nome = dto.Nome; doador.Documento = dto.Documento; doador.Telefone = dto.Telefone;
        await doadorRepository.UpdateAsync(doador);
        return doador.ToResponseDto();
    }

    public Task DeleteAsync(int id) => doadorRepository.DeleteAsync(id);
}
```

- [ ] **Step 2: `DoacaoService.cs`** (creates Doacao + N Entrada movements atomically)

```csharp
using Caritas.Models.DTOs.Doacao;
using Caritas.Models.Entities;
using Caritas.Models.Enums;
using Caritas.Models.Interfaces;
using Caritas.Models.Interfaces.Services;
using Caritas.Repository.Context;
using Caritas.Service.Mappers;

namespace Caritas.Service;

public class DoacaoService(
    CaritasDbContext context,
    IDoacaoRepository doacaoRepository,
    IMovimentacaoService movimentacaoService,
    ICurrentSession session) : IDoacaoService
{
    public async Task<DoacaoResponseDto> RegistrarAsync(DoacaoCreateDto dto)
    {
        var idParoquia = session.ParoquiaAtualId
            ?? throw new InvalidOperationException("Paróquia atual não definida (header X-Paroquia-Id).");
        if (dto.Itens.Count == 0)
            throw new ArgumentException("Doação deve conter ao menos um item.");

        await using var tx = await context.Database.BeginTransactionAsync();

        var doacao = new Doacao { IdDoador = dto.IdDoador, IdParoquia = idParoquia, Observacao = dto.Observacao };
        doacaoRepository.Add(doacao);
        await context.SaveChangesAsync();   // gera doacao.Id

        foreach (var linha in dto.Itens)
        {
            await movimentacaoService.AplicarMovimentoAsync(new MovimentacaoEstoque
            {
                IdItem = linha.IdItem, IdParoquia = idParoquia, Validade = linha.Validade, Lote = linha.Lote,
                TipoOperacao = TipoOperacao.Entrada, Quantidade = linha.Quantidade,
                OrigemTipo = OrigemMovimentacao.Doacao, OrigemId = doacao.Id,
            });
        }

        await context.SaveChangesAsync();
        await tx.CommitAsync();
        return doacao.ToResponseDto();
    }
}
```

- [ ] **Step 3: `CestaBasicaService.cs`** (creates CestaBasica + N Saida movements atomically)

```csharp
using Caritas.Models.DTOs.CestaBasica;
using Caritas.Models.Entities;
using Caritas.Models.Enums;
using Caritas.Models.Interfaces;
using Caritas.Models.Interfaces.Services;
using Caritas.Repository.Context;
using Caritas.Service.Mappers;

namespace Caritas.Service;

public class CestaBasicaService(
    CaritasDbContext context,
    ICestaBasicaRepository cestaBasicaRepository,
    IMovimentacaoService movimentacaoService,
    ICurrentSession session) : ICestaBasicaService
{
    public async Task<CestaBasicaResponseDto> RegistrarAsync(CestaBasicaCreateDto dto)
    {
        var idParoquia = session.ParoquiaAtualId
            ?? throw new InvalidOperationException("Paróquia atual não definida (header X-Paroquia-Id).");
        if (dto.Itens.Count == 0)
            throw new ArgumentException("Cesta básica deve conter ao menos um item.");

        await using var tx = await context.Database.BeginTransactionAsync();

        var cesta = new CestaBasica { IdParoquia = idParoquia, IdBeneficiario = dto.IdBeneficiario, Observacao = dto.Observacao };
        cestaBasicaRepository.Add(cesta);
        await context.SaveChangesAsync();   // gera cesta.Id

        foreach (var linha in dto.Itens)
        {
            // AplicarMovimentoAsync rejeita saldo negativo (InvalidOperationException -> 422), revertendo a transação.
            await movimentacaoService.AplicarMovimentoAsync(new MovimentacaoEstoque
            {
                IdItem = linha.IdItem, IdParoquia = idParoquia, Validade = linha.Validade, Lote = linha.Lote,
                TipoOperacao = TipoOperacao.Saida, Quantidade = linha.Quantidade,
                OrigemTipo = OrigemMovimentacao.CestaBasica, OrigemId = cesta.Id,
            });
        }

        await context.SaveChangesAsync();
        await tx.CommitAsync();
        return cesta.ToResponseDto();
    }
}
```

- [ ] **Step 4: Build, then commit**

```bash
dotnet build backend          # Build succeeded
git add -A && git commit -m "feat: DoadorService + Doacao/CestaBasica services (atomic movement generation)"
```

---

## Phase 5 — WebApi: DI + controllers

### Task 5.1: DI registrations

**Files:** Modify `Caritas.WebApi/Program.cs`

- [ ] **Step 1: Register repositories and services**

Add (after the existing `AddScoped<ICurrentSession, ...>` and email registrations, before `AddControllers()`):

```csharp
// Estoque module
builder.Services.AddScoped<IItemRepository, ItemRepository>();
builder.Services.AddScoped<IEstoqueRepository, EstoqueRepository>();
builder.Services.AddScoped<IMovimentacaoRepository, MovimentacaoRepository>();
builder.Services.AddScoped<IDoadorRepository, DoadorRepository>();
builder.Services.AddScoped<IDoacaoRepository, DoacaoRepository>();
builder.Services.AddScoped<ICestaBasicaRepository, CestaBasicaRepository>();

builder.Services.AddScoped<IItemService, ItemService>();
builder.Services.AddScoped<IEstoqueService, EstoqueService>();
builder.Services.AddScoped<IMovimentacaoService, MovimentacaoService>();
builder.Services.AddScoped<IDoadorService, DoadorService>();
builder.Services.AddScoped<IDoacaoService, DoacaoService>();
builder.Services.AddScoped<ICestaBasicaService, CestaBasicaService>();
```

Add the needed usings: `using Caritas.Models.Interfaces;`, `using Caritas.Models.Interfaces.Services;`, `using Caritas.Repository.Repositories;`, `using Caritas.Service;`.

- [ ] **Step 2: Build, then commit**

```bash
dotnet build backend          # Build succeeded
git add -A && git commit -m "feat: register estoque repositories and services in DI"
```

### Task 5.2: `ItensController` + `EstoqueController`

**Files:** Create both in `Caritas.WebApi/Controllers/`.

- [ ] **Step 1: `ItensController.cs`**

```csharp
using Caritas.Models.DTOs.Item;
using Caritas.Models.Enums;
using Caritas.Models.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Caritas.WebApi.Controllers;

[Authorize]
public class ItensController(IItemService itemService) : BaseApiController
{
    [HttpPost("alimentos")]
    public async Task<IActionResult> CreateAlimento([FromBody] AlimentoCreateDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var result = await itemService.CreateAlimentoAsync(dto);
        return CreatedAtAction(nameof(CreateAlimento), new { id = result.Id }, result);
    }

    [HttpPut("alimentos/{id:int}")]
    public async Task<IActionResult> UpdateAlimento(int id, [FromBody] AlimentoUpdateDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        return Ok(await itemService.UpdateAlimentoAsync(id, dto));
    }

    [HttpPost("roupas")]
    public async Task<IActionResult> CreateRoupa([FromBody] RoupaCreateDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var result = await itemService.CreateRoupaAsync(dto);
        return CreatedAtAction(nameof(CreateRoupa), new { id = result.Id }, result);
    }

    [HttpPut("roupas/{id:int}")]
    public async Task<IActionResult> UpdateRoupa(int id, [FromBody] RoupaUpdateDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        return Ok(await itemService.UpdateRoupaAsync(id, dto));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await itemService.DeleteAsync(id);
        return NoContent();
    }

    [HttpGet("select")]
    public async Task<IActionResult> GetSelect([FromQuery] TipoItem? tipo)
        => Ok(await itemService.GetSelectAsync(tipo));
}
```

- [ ] **Step 2: `EstoqueController.cs`**

```csharp
using Caritas.Models.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Caritas.WebApi.Controllers;

[Authorize]
public class EstoqueController(IEstoqueService estoqueService) : BaseApiController
{
    [HttpGet("alimentos")]
    public async Task<IActionResult> GetAlimentos(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 10, [FromQuery] string? busca = null)
        => Ok(await estoqueService.GetAlimentosAsync(page, pageSize, busca));

    [HttpGet("roupas")]
    public async Task<IActionResult> GetRoupas(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 10, [FromQuery] string? busca = null)
        => Ok(await estoqueService.GetRoupasAsync(page, pageSize, busca));
}
```

- [ ] **Step 3: Build, then commit**

```bash
dotnet build backend          # Build succeeded
git add -A && git commit -m "feat: ItensController + EstoqueController"
```

### Task 5.3: `MovimentacoesController` + `DoadoresController`

**Files:** Create both.

- [ ] **Step 1: `MovimentacoesController.cs`**

```csharp
using Caritas.Models.DTOs.Movimentacao;
using Caritas.Models.Enums;
using Caritas.Models.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Caritas.WebApi.Controllers;

[Authorize]
public class MovimentacoesController(IMovimentacaoService movimentacaoService) : BaseApiController
{
    [HttpPost]
    public async Task<IActionResult> Registrar([FromBody] MovimentacaoCreateDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var result = await movimentacaoService.RegistrarAsync(dto);
        return CreatedAtAction(nameof(Registrar), new { id = result.Id }, result);
    }

    [HttpGet]
    public async Task<IActionResult> GetHistorico(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 10,
        [FromQuery] int? idItem = null, [FromQuery] int? idParoquia = null,
        [FromQuery] OrigemMovimentacao? origemTipo = null)
        => Ok(await movimentacaoService.GetHistoricoAsync(page, pageSize, idItem, idParoquia, origemTipo));
}
```

- [ ] **Step 2: `DoadoresController.cs`**

```csharp
using Caritas.Models.DTOs.Doador;
using Caritas.Models.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Caritas.WebApi.Controllers;

[Authorize]
public class DoadoresController(IDoadorService doadorService) : BaseApiController
{
    [HttpGet]
    public async Task<IActionResult> GetPaged([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        => Ok(await doadorService.GetPagedAsync(page, pageSize));

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id) => Ok(await doadorService.GetByIdAsync(id));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] DoadorCreateDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var result = await doadorService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] DoadorUpdateDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        return Ok(await doadorService.UpdateAsync(id, dto));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await doadorService.DeleteAsync(id);
        return NoContent();
    }
}
```

- [ ] **Step 3: Build, then commit**

```bash
dotnet build backend          # Build succeeded
git add -A && git commit -m "feat: MovimentacoesController + DoadoresController"
```

### Task 5.4: `DoacoesController` + `CestasBasicasController`

**Files:** Create both.

- [ ] **Step 1: `DoacoesController.cs`**

```csharp
using Caritas.Models.DTOs.Doacao;
using Caritas.Models.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Caritas.WebApi.Controllers;

[Authorize]
public class DoacoesController(IDoacaoService doacaoService) : BaseApiController
{
    [HttpPost]
    public async Task<IActionResult> Registrar([FromBody] DoacaoCreateDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var result = await doacaoService.RegistrarAsync(dto);
        return CreatedAtAction(nameof(Registrar), new { id = result.Id }, result);
    }
}
```

- [ ] **Step 2: `CestasBasicasController.cs`**

```csharp
using Caritas.Models.DTOs.CestaBasica;
using Caritas.Models.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Caritas.WebApi.Controllers;

[Authorize]
[Route("api/cestas-basicas")]
public class CestasBasicasController(ICestaBasicaService cestaBasicaService) : BaseApiController
{
    [HttpPost]
    public async Task<IActionResult> Registrar([FromBody] CestaBasicaCreateDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var result = await cestaBasicaService.RegistrarAsync(dto);
        return CreatedAtAction(nameof(Registrar), new { id = result.Id }, result);
    }
}
```

> Explicit `[Route("api/cestas-basicas")]` overrides the default `api/[controller]` (which would be `api/CestasBasicas`) to match the spec's kebab-case path.

- [ ] **Step 3: Build, then commit**

```bash
dotnet build backend          # Build succeeded
git add -A && git commit -m "feat: DoacoesController + CestasBasicasController"
```

### Task 5.5: End-to-end verification

- [ ] **Step 1: Run the stack and apply migrations**

```bash
cd backend
docker-compose up -d --build
docker-compose logs -f carweb   # confirmar migração aplicada e app no ar (Ctrl+C para sair)
```

- [ ] **Step 2: Verify via Swagger**

Open `http://localhost:8080/swagger`. Confirm the new controllers appear (Itens, Estoque, Movimentacoes, Doadores, Doacoes, CestasBasicas) and require auth. Smoke test with the dev user (`dev@caritas.com` / `Dev@12345`) and an `X-Paroquia-Id` header:
1. `POST /api/itens/alimentos` → cria um alimento.
2. `POST /api/movimentacoes` com `TipoOperacao=Entrada`, `OrigemTipo=Ajuste` para esse item → 201.
3. `GET /api/estoque/alimentos` → o saldo aparece com a quantidade da entrada.
4. `POST /api/cestas-basicas` consumindo mais que o saldo → 422 "Saldo insuficiente".

- [ ] **Step 3: Final commit (if any migration tweaks)**

```bash
git add -A && git commit -m "chore: estoque module end-to-end verified"
```

---

## Self-Review notes (resolved)

- **Spec coverage:** entities, enums, TPT mappings, unique index `NULLS NOT DISTINCT`, userstamp auto-stamp, repositories (incl. `FOR UPDATE`), transactional projection (pessimistic lock + saldo≥0), DTOs/mappers, all controllers `[Authorize]`, DI registration, `ICurrentSession` move — all mapped to tasks.
- **Type consistency:** `AplicarMovimentoAsync(MovimentacaoEstoque)` defined in `IMovimentacaoService` (Task 4.1) and consumed by Doacao/CestaBasica services (Task 4.5); `Add(...)` non-committing methods defined on the repos in Task 3.5/3.6 and used in Task 4.4/4.5; DTO/property names match across mapper, service, and controller tasks.
- **Out of scope (per decisions):** automated tests; `Beneficiario` FK (deferred until that table exists); frontend wiring; ledger-recompute job.
