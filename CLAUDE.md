# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Visão Geral

Sistema de gestão de doações e famílias para uma diocese. Backend em ASP.NET Core (net10) com PostgreSQL via Entity Framework Core (code-first). Frontend em React + TypeScript + Vite com Tailwind CSS e shadcn/ui.

Contexto detalhado do sistema e módulos em `.claude/context/`.

## Como Rodar

```bash
# Backend (a partir de /backend)
docker-compose up -d --build

# Frontend (a partir de /frontend)
npm run dev

# Typecheck frontend
npm run typecheck

# Lint/format frontend (Biome)
npm run lint

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
Caritas.Service     → serviços com regras de negócio + mappers DTO↔Entity
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

Todos os controllers herdam `BaseApiController` (em `Caritas.WebApi/Controllers/`), que já traz `[ApiController]` e `[Route("api/[controller]")]`. Nome do controller no plural: `FamiliasController` → rota `api/familias`.

### Padrão Repository Genérico

`IBaseRepository<T>` em `Caritas.Models/Interfaces/`:
- `GetByIdAsync(int id)`, `GetPagedAsync(int page, int pageSize)`, `AddAsync`, `UpdateAsync`, `DeleteAsync(int id)`

Implementado em `Caritas.Repository/Repositories/BaseRepository.cs`. Repositórios específicos (ex: `IFamiliaRepository`) estendem `IBaseRepository<T>` e adicionam queries específicas.

### Paginação

Sempre use `QueryableExtensions.ToPagedAsync` (em `Caritas.Repository/Extensions/`) para paginar resultados EF:

```csharp
return await context.Familias
    .OrderBy(f => f.CriadoEm)
    .ToPagedAsync(page, pageSize);
```

Retorna `PagedResponseDto<T>` com apenas `Items` e `TotalCount`. Frontend deriva `totalPages` localmente a partir do `pageSize` que ele já controla.

### Tratamento de Erros

`ErrorHandlingMiddleware` em `Caritas.WebApi/Middleware/` captura todas as exceções e retorna `ProblemDetails`. Lance `KeyNotFoundException` para 404, `ArgumentException` para 400, `InvalidOperationException` para 422.

### BaseEntity / AuditableEntity

Entidades existentes (`Familia`, `Pessoa`) herdam `BaseEntity` (CreatedAt/UpdatedAt). **Novas entidades devem herdar `AuditableEntity`** (CriadoEm/AtualizadoEm — em português, padrão mais recente do projeto):
- `Id: int` — auto-increment (identity column do Postgres, configurado por convenção do Npgsql)
- `CriadoEm`, `AtualizadoEm` — `DateTime` em UTC

O `DbContext` atualiza `AtualizadoEm` automaticamente no `SaveChangesAsync`.

### Configuração de Entidades

Use **Data Annotations** diretamente nas entities para configurações básicas (`[Required]`, `[MaxLength]`, `[Precision]`, `[ForeignKey]`). Não crie arquivos `IEntityTypeConfiguration<T>` — eles foram removidos do projeto.

Configurações que não têm annotation equivalente (delete behaviors, índices únicos com filter) ficam no `OnModelCreating` do `CaritasDbContext`.

### Mapeamento (Mapper Estático)

Sempre crie um mapper estático em `Caritas.Service/Mappers/` para mapear entre entidades e DTOs. Use extension methods, mesmo padrão de `ParoquiaMapper` e `UsuarioMapper`:

```csharp
// Caritas.Service/Mappers/MinhaEntidadeMapper.cs
public static class MinhaEntidadeMapper
{
    public static MinhaEntidadeDto ToDto(this MinhaEntidade entity) => new() { ... };
    public static MinhaEntidade ToEntity(this MinhaEntidadeCreateDto dto) => new() { ... };
}
```

Nunca mapeie propriedade por propriedade diretamente no Service — delegue sempre ao Mapper.

### Filtro por Paróquia

A paróquia de uma operação vem **sempre da sessão**, nunca de um valor enviado pelo cliente. O front manda o header `X-Paroquia-Id` em toda request. O `ParoquiaAtualMiddleware` confere se o usuário tem acesso à paróquia do header (vínculo em `UsuarioParoquias`; admin acessa qualquer uma) e responde 403 se não tiver. A paróquia validada fica disponível como `ICurrentSession.ParoquiaAtualId` (services) e `BaseApiController.ParoquiaAtualId` (controllers).

```csharp
// Service
var idParoquia = session.ParoquiaAtualId
    ?? throw new InvalidOperationException("Paróquia atual não definida (header X-Paroquia-Id).");

// Repository / query: paróquia obrigatória, sem "null = todas"
.Where(x => x.IdParoquia == idParoquia)
```

**Não faça:**
- Receber a paróquia por query param, rota ou campo de DTO (`?paroquiaId=`, `/{paroquiaId}/...`, `dto.ParoquiaId`). O middleware só valida o header, então qualquer outro canal deixa o usuário acessar outra paróquia.
- Tratar `paroquiaId == null` como "todas as paróquias".
- Buscar ou alterar um registro por id sem conferir que ele pertence à paróquia da sessão.

Se uma tela precisar mesmo filtrar por uma paróquia diferente da atual (visão da diocese, usuário com várias paróquias), o valor recebido precisa ser validado contra as paróquias permitidas do usuário antes de ser usado.

**Convenção antiga (descontinuada):** endpoints de listagem aceitavam `paroquiaId` como query param opcional, com `.Where(x => paroquiaId == null || x.ParoquiaId == paroquiaId)`. Esse padrão ainda existe nos endpoints marcados com `TODO(isolamento-paroquia)`. São eles:
- **Caixa:** rotas `/caixa/{paroquiaId}/...` e `ParoquiaId` nos DTOs de lançamento.
- **Brechó:** `?paroquiaId=` nas peças, vendas e sessão de caixa, e `ParoquiaId` nos DTOs de peça, venda e abertura de caixa.
- **Famílias:**
  - `GET /familias/select` dá prioridade ao query param sobre a sessão.
  - `GET /familias` usa `filter.ParoquiaId` sem validação e, se nulo, lista todas.
  - `PUT /familias/{id}` não confere a paróquia e aceita `ParoquiaId` do DTO.
- **Atendimentos:** `GET /atendimentos` usa `filter.ParoquiaId` sem validação.

Operações por id (cancelar venda, fechar caixa, excluir peça, etc.) ainda não foram auditadas quanto à paróquia. Novos endpoints não devem seguir o padrão antigo.

### Cancellation Token

Não use `CancellationToken` nos métodos por enquanto — será introduzido depois. Mantenha as assinaturas limpas.

## Arquitetura Frontend

### Regras de Estrutura de Pastas

- Cada componente em sua própria pasta: `components/NomeDoComponente/index.tsx`
- Se houver tipagem local, adicionar `interface.ts` na mesma pasta
- Tipos de uma page ficam em `pages/NomeDaPage/interface.ts`
- `components/ui/` é exclusivo para primitivas geradas pelo shadcn/ui — não criar componentes customizados lá
- Não criar pastas `layout/`, `shared/`, etc. — tudo direto em `components/`
- `lib/utils.ts` já existe (vem do shadcn, expõe `cn()`); não criar outros arquivos de utilitários

### Rotas

Rotas são definidas em `frontend/src/main.tsx`. Novas páginas precisam de uma entrada em `<Routes>`:

```tsx
<Route path="/nova-entidade" element={<NovaEntidadePage />} />
```

### Chamadas de API

Sempre diretamente no componente via `APIService` (nunca criar service files separados por entidade). URL base configurável via `VITE_API_URL` (padrão: `http://localhost:8080`):

```typescript
import APIService, { type PagedResponse } from '@/services/api';

const result = await APIService.getRequest<PagedResponse<Familia>>({
  url: '/familias',
  params: { page, pageSize },
});

await APIService.postRequest({ url: '/familias', body: payload });
await APIService.putRequest({ url: `/familias/${id}`, body: payload });
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

### Notificações

Use `toast` do `react-toastify` para feedback ao usuário. O `ToastContainer` já está montado em `main.tsx`.

## Convenções

- Enums do backend mapeados como `type` union no TypeScript (ex: `type SituacaoMoradia = 'Propria' | 'Alugada' | ...`)
- `Vulnerabilidade` é `[Flags]` enum no backend (int) — no frontend, manipulado como bitmask `number`
- IDs são sempre `number` (int auto-increment) no frontend, espelhando o backend
- Datas chegam como `string` ISO 8601 do backend
- Nunca criar hooks customizados (`useFamilia`, etc.) — lógica fica no próprio componente
