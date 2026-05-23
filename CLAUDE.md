# Caritas — Guia para Claude Code

## Visão Geral

Sistema de gestão de doações e famílias para paróquias. Backend em ASP.NET Core 8 com PostgreSQL via Entity Framework Core (code-first). Frontend em React + TypeScript + Vite com Tailwind CSS e shadcn/ui.

## Como Rodar

```bash
# Backend (a partir de /backend)
docker-compose up -d --build

# Frontend (a partir de /frontend)
npm run dev

# Typecheck frontend
npm run typecheck

# Migrations EF (a partir de /backend)
dotnet ef migrations add <Nome> --project Caritas.Repository --startup-project Caritas.WebApi
```

A tool `dotnet-ef` precisa estar instalada como global tool (uma vez por máquina):

```bash
dotnet tool install --global dotnet-ef
```

Se o comando `dotnet ef` não for encontrado depois de instalar, o `~/.dotnet/tools` não está no PATH (no Git Bash, adicione `export PATH="$PATH:$HOME/.dotnet/tools"` ao `~/.bashrc`).

Migrations pendentes são aplicadas automaticamente no startup da API (`Program.cs` chama `db.Database.MigrateAsync()`). Não precisa rodar `database update` manualmente em dev.

## Arquitetura Backend

Quatro projetos em camadas — nunca pule camadas:

```
Caritas.Models      → classes puras (entidades, DTOs, enums, interfaces)
Caritas.Repository  → EF Core (DbContext, Mappings, Repositórios, Extensions)
Caritas.Service     → serviços com regras de negócio
Caritas.WebApi      → Controllers, Middleware, Swagger, entrypoint HTTP
```

### Injeção de Dependência

Apenas o `CaritasDbContext` é registrado no container DI (`Program.cs`). Service e Repository **não** são registrados — são instanciados manualmente:

```csharp
// Controller recebe DbContext, instancia Service:
public class FamiliasController(CaritasDbContext context) : BaseApiController
{
    private readonly FamiliaService _familiaService = new(context);
    // ...
}

// Service recebe DbContext, instancia Repository:
public class FamiliaService(CaritasDbContext context)
{
    private readonly FamiliaRepository _familiaRepository = new(context);
    // ...
}
```

### BaseApiController

Todos os controllers herdam `BaseApiController` (em `Caritas.WebApi/Controllers/`), que já traz:

- `[ApiController]` e `[Route("api/[controller]")]`
- Espaço reservado para helpers de claims JWT (a ser implementado)

Nome do controller no plural: `FamiliasController` → rota `api/familias`.

### Padrão Repository Genérico

`IBaseRepository<T>` em `Caritas.Models/Interfaces/`:
- `GetByIdAsync(int id)`, `GetPagedAsync(int page, int pageSize)`, `AddAsync`, `UpdateAsync`, `DeleteAsync(int id)`

Implementado em `Caritas.Repository/Repositories/BaseRepository.cs`.

Repositórios específicos (ex: `IFamiliaRepository`) estendem `IBaseRepository<T>` e adicionam queries específicas.

### Paginação

Sempre use `QueryableExtensions.ToPagedAsync` (em `Caritas.Repository/Extensions/`) para paginar resultados EF:

```csharp
return await context.Familias
    .OrderBy(f => f.CreatedAt)
    .ToPagedAsync(page, pageSize);
```

Retorna `PagedResponseDto<T>` enxuto: apenas `Items` e `TotalCount`. Frontend deriva `totalPages`/controle de páginas localmente a partir do `pageSize` que ele já controla.

### Tratamento de Erros

`ErrorHandlingMiddleware` em `Caritas.WebApi/Middleware/` captura todas as exceções e retorna `ProblemDetails`. Lance `KeyNotFoundException` para 404, `ArgumentException` para 400, `InvalidOperationException` para 422.

### BaseEntity

Todas as entidades herdam `BaseEntity`:
- `Id: int` — auto-increment (identity column do Postgres, configurado por convenção do Npgsql)
- `CreatedAt`, `UpdatedAt` — `DateTime` em UTC

O `DbContext` atualiza `UpdatedAt` automaticamente no `SaveChangesAsync`.

### Cancellation Token

Não use `CancellationToken` nos métodos por enquanto — será introduzido depois. Mantenha as assinaturas limpas.

## Arquitetura Frontend

### Regras de Estrutura de Pastas

- Cada componente em sua própria pasta: `components/NomeDoComponente/index.tsx`
- Se houver tipagem local, adicionar `interface.ts` na mesma pasta
- Tipos de uma page ficam em `pages/NomeDaPage/interface.ts`
- Nada de pastas `ui/`, `layout/`, `shared/` — tudo direto em `components/`
- `lib/utils.ts` já existe (vem do shadcn, expõe `cn()`); não criar outros arquivos de utilitários

### Chamadas de API

Sempre diretamente no componente via `APIService` (nunca criar service files separados por entidade):

```typescript
import APIService, { type PagedResponse } from '@/services/api';

// GET com paginação
const result = await APIService.getRequest<PagedResponse<Familia>>({
  url: '/familias',
  params: { page, pageSize },
});

// POST
await APIService.postRequest({ url: '/familias', body: payload });

// PUT
await APIService.putRequest({ url: `/familias/${id}`, body: payload });

// DELETE
await APIService.deleteRequest({ url: `/familias/${id}` });
```

`PagedResponse<T>` traz apenas `{ items: T[]; totalCount: number }`.

### Padrão de Modal (forwardRef + useImperativeHandle)

Formulários de criar/editar são modais controlados por ref, nunca páginas separadas:

```typescript
// pages/Entidade/modal.tsx
export interface EntidadeModalRef {
  open: (item?: Entidade) => void;
}

const EntidadeModal = forwardRef<EntidadeModalRef, { onSuccess: () => void }>((props, ref) => {
  useImperativeHandle(ref, () => ({
    open: (item) => { setEditing(item ?? null); setOpen(true); },
  }));
  // ...
});

// Uso na listagem:
const modalRef = useRef<EntidadeModalRef>(null);
modalRef.current?.open();          // criar
modalRef.current?.open(item);      // editar
```

### Padrão de Listagem Paginada

Use o componente genérico `DataTable` (em `components/DataTable/`):

```typescript
<DataTable
  columns={[
    { key: 'nome', header: 'Nome' },
    { key: 'status', header: 'Status', render: (row) => <Badge>{row.status}</Badge> },
  ]}
  data={data}
  pagination={{ page, pageSize, totalCount, onPageChange: setPage }}
  onEdit={(item) => modalRef.current?.open(item)}
  onDelete={(item) => handleDelete(item.id)}
  isLoading={loading}
/>
```

`DataTable` exige que `T` tenha `id: number`.

## Convenções

- Enums do backend mapeados como `type` union no TypeScript (ex: `type SituacaoMoradia = 'Propria' | 'Alugada' | ...`)
- `Vulnerabilidade` é `[Flags]` enum no backend (int) — no frontend, manipulado como bitmask `number`
- IDs são sempre `number` (int auto-increment) no frontend, espelhando o backend
- Datas chegam como `string` ISO 8601 do backend
- Nunca criar hooks customizados (`useFamilia`, etc.) — lógica fica no próprio componente
