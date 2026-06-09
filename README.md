# Caritas — Sistema de Gestão de Doações e Famílias

Sistema para gestão de famílias atendidas e doações em paróquias.

## Stack

| Camada     | Tecnologia                                      |
|------------|-------------------------------------------------|
| Backend    | ASP.NET Core 10, C#                              |
| ORM        | Entity Framework Core 9 (code-first + migrations) |
| Banco      | PostgreSQL 16                                   |
| Infra      | Docker + Docker Compose                         |
| Frontend   | React 19, TypeScript, Vite                      |
| UI         | Tailwind CSS + shadcn/ui                        |
| HTTP       | Axios                                           |

## Arquitetura Backend

Quatro projetos em camadas (nunca pule camadas):

```
Caritas.Models      → Entidades, DTOs, Enums, Interfaces
     ↓
Caritas.Repository  → DbContext (EF Core), Mappings, Repositórios, Migrations
     ↓
Caritas.Service     → Serviços, regras de negócio, mapeamento DTO ↔ Entity
     ↓
Caritas.WebApi      → Controllers, Middleware, Swagger, entrypoint HTTP
```

**Injeção de dependência:** apenas o `CaritasDbContext` é registrado no container DI. Service e Repository são instanciados manualmente pelo construtor da camada acima (`new FamiliaService(context)` no controller, `new FamiliaRepository(context)` no service).

**BaseApiController:** todos os controllers herdam dele — já traz `[ApiController]` + `[Route("api/[controller]")]` e espaço pros helpers de claims JWT (a ser implementado).

**Auto-migrate:** o `Program.cs` aplica migrations pendentes no startup via `db.Database.MigrateAsync()` — não precisa rodar `database update` manualmente em dev.

## Pré-requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0)
- [Node.js v22.22.3](https://nodejs.org/)
- [Biome 2.2.6](https://biomejs.dev/) — instalado e configurado como formatter/linter padrão no VSCode (extensão [`biomejs.biome`](https://marketplace.visualstudio.com/items?itemName=biomejs.biome))
- `dotnet-ef` (tool global, ver seção [Migrations](#migrations-ef-core))

**IDE recomendada para o backend:** Visual Studio 2026.

## Como Rodar

### 1. Backend (Docker)

```bash
cd backend
docker-compose up -d --build
```

- API: `http://localhost:8080`
- Swagger: `http://localhost:8080/swagger`
- Postgres: `localhost:5432` (db `caritas` / user `caritas` / senha `caritas_dev`)

Logs em tempo real:
```bash
docker-compose logs -f carweb
```

### 2. Frontend (Vite)

```bash
cd frontend
npm install
npm run dev
```

Frontend disponível em `http://localhost:5173`.

## Autenticação

Ao rodar a API em ambiente de **Development**, um usuário administrador é criado automaticamente no startup (seed), caso ainda não exista. Use-o para fazer login:

| Campo | Valor             |
|-------|-------------------|
| Email | `dev@caritas.com` |
| Senha | `Dev@12345`       |

Esse usuário possuirá acesso a todas as paróquias.

## Variáveis de Ambiente

### Frontend — `frontend/.env.local`

```
VITE_API_URL=http://localhost:8080
```

### Backend

A connection string padrão do container já está no `docker-compose.override.yml`. Se quiser rodar a API fora do Docker (`dotnet run`), crie `backend/Caritas.WebApi/appsettings.Development.json`:

```json
{
  "ConnectionStrings": {
    "Default": "Host=localhost;Port=5432;Database=caritas;Username=caritas;Password=caritas_dev"
  }
}
```

## Migrations (EF Core)

### Instalar a tool (uma vez por máquina)

```bash
dotnet tool install --global dotnet-ef
```

Se depois disso o comando `dotnet ef` der "não foi possível executar", o diretório `~/.dotnet/tools` não está no PATH:

- **Git Bash:** adicione `export PATH="$PATH:$HOME/.dotnet/tools"` ao `~/.bashrc` e reabra o shell
- **PowerShell:** reabra o terminal (o instalador já adiciona ao PATH do usuário)

Confirme com `dotnet ef --version`.

### Comandos

Execute dentro de `backend/`:

```bash
# Criar uma migration
dotnet ef migrations add <NomeDescritivo> --project Caritas.Repository --startup-project Caritas.WebApi

# Reverter a última migration (em dev, antes de commitar)
dotnet ef migrations remove --project Caritas.Repository --startup-project Caritas.WebApi
```

A tool roda na máquina local — gera os arquivos em `Caritas.Repository/Migrations/`. Não precisa do container pra isso. Ao rodar o backend as migrations são aplicadas no Postgres no startup automaticamente.