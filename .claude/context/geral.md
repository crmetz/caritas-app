# Contexto Geral — Sistema Caritas

## Visão de Negócio

Sistema de gestão pastoral para uma **diocese**, permitindo que ela e suas paróquias gerenciem famílias assistidas, doações e suprimentos.

### Hierarquia de Usuários

- **Diocese**: visão global — acessa dados de todas as paróquias
- **Paróquia**: visão local — acessa apenas os dados da(s) sua(s) paróquia(s)

### Regra Central de Filtro

**Todo dado vinculado a uma paróquia deve ser filtrado por `paroquiaId`.**
- Endpoints de listagem devem aceitar `paroquiaId` como query param
- Usuários de paróquia só enxergam sua paróquia; diocese vê todas

## Módulos

| Módulo | Status | Arquivo |
|---|---|---|
| Paróquias | Funcional | [modulos/paroquia.md](modulos/paroquia.md) |
| Usuários | Funcional | — |
| Famílias / Pessoas | Em evolução | [modulos/familia.md](modulos/familia.md) |
| Suprimentos / Notificações | Planejado | [modulos/suprimentos.md](modulos/suprimentos.md) |
| Doações | Futuro | — |

## Stack

- **Backend**: ASP.NET Core (net10), PostgreSQL, Entity Framework Core (code-first), Npgsql
- **Frontend**: React 19 + TypeScript + Vite, Tailwind CSS, shadcn/ui, Axios

## Padrões Importantes

- Mapeamento via **static mapper classes** em `Caritas.Service/Mappers/` (extension methods, mesmo padrão de `ParoquiaMapper`)
- Filtro por paróquia em todas as queries relevantes
- Nunca pular camadas: Models → Repository → Service → Controller
- Ver CLAUDE.md para guia completo de implementação
