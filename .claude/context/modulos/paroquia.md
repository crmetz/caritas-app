# Módulo: Paróquias

## Status: Funcional

## Entidade

`Paroquia` (`Caritas.Models/Entities/Paroquia.cs`):
- `Nome: string` (required)
- `EnderecoId: int?` → `Endereco` (opcional)
- `UsuarioParoquias: ICollection<UsuarioParoquia>` (muitos-para-muitos com Usuario)
- Herda `AuditableEntity` (CriadoEm, AtualizadoEm)

## Endpoints

- `GET /api/paroquias` — listagem paginada
- `GET /api/paroquias/select` — lista simples `{ value, label }` para dropdowns
- `GET /api/paroquias/{id}`
- `POST /api/paroquias`
- `PUT /api/paroquias/{id}`
- `DELETE /api/paroquias/{id}` — lança 422 (exclusão não permitida)

## Regras de Negócio

- Paróquia não pode ser excluída (operação intencionalmente bloqueada)
- Endereço é opcional, mas recomendado

## Mapper

`Caritas.Service/Mappers/ParoquiaMapper.cs` — static extension methods:
- `ToDto()` — `Paroquia → ParoquiaDto`
- `ToEntity()` — `CreateParoquiaDTO → Paroquia`
- `ToSelectObjectDto()` — `Paroquia → SelectObjectDto`
