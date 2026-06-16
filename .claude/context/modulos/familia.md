# Módulo: Famílias / Pessoas

## Status: Em evolução (CRUD básico funcional)

## Regras de Negócio

- Família tem **N membros** e exatamente **1 responsável** (marcado por `ResponsavelId`)
- Família é vinculada a **uma paróquia** (`ParoquiaId` obrigatório)
- Toda listagem de famílias deve ser filtrável por `paroquiaId`
- O responsável não pode ser removido da família sem antes trocar o responsável

## Identificação de Pessoa

Pessoa é considerada identificada se tiver **ao menos uma** das combinações:
1. `Cpf` preenchido
2. `NomeMae` + `DataNascimento` preenchidos
3. `TipoDocumentoAlternativo` + `IdentificacaoAlternativa` preenchidos

`TipoDocumentoAlternativo` (enum): `Rg | Passaporte | Cnh | Ctps | DocumentoEstrangeiro | Outros`

## Entidades

### `Familia` (`Caritas.Models/Entities/Familia.cs`)
- `ParoquiaId: int` → FK para Paroquia (obrigatório)
- `ResponsavelId: int` → FK para Pessoa (Restrict delete)
- `Membros: ICollection<Pessoa>` (Cascade delete)
- Campos socioeconômicos: `RendaFamiliar`, `SituacaoMoradia`, `Vulnerabilidade` (Flags)
- Endereço embutido: Rua, Numero, Complemento, Bairro, Cidade, Estado, Cep
- `Observacoes: string?`

### `Pessoa` (`Caritas.Models/Entities/Pessoa.cs`)
- `Nome: string` (required)
- `Cpf: string?` (único quando não nulo)
- `NomeMae: string?` (para identificação sem CPF)
- `TipoDocumentoAlternativo: TipoDocumentoAlternativo?`
- `IdentificacaoAlternativa: string?` (número do documento alternativo)
- `DataNascimento: DateOnly`
- `Telefone, Escolaridade, Profissao, Observacoes: string?`
- `PossuiDeficiencia: bool`
- `FamiliaId: int?` → FK para Familia

## Endpoints

- `GET /api/familias?paroquiaId=&page=&pageSize=` — listagem paginada filtrada por paróquia
- `GET /api/familias/{id}`
- `POST /api/familias` — cria família com responsável + membros opcionais
- `PUT /api/familias/{id}` — atualiza dados da família
- `DELETE /api/familias/{id}`
- `POST /api/familias/{id}/membros` — adiciona membro à família
- `DELETE /api/familias/{id}/membros/{pessoaId}` — remove membro (não pode ser responsável)
- `PUT /api/familias/{id}/responsavel/{pessoaId}` — troca o responsável

## Mapper

`Caritas.Service/Mappers/FamiliaMapper.cs` — static extension methods:
- `ToResponseDto()` — `Familia → FamiliaResponseDto`
- `ToEntity()` — `FamiliaCreateDto → Familia`

`Caritas.Service/Mappers/PessoaMapper.cs` — static extension methods:
- `ToResponseDto()` — `Pessoa → PessoaResponseDto`
- `ToEntity()` — `PessoaCreateDto → Pessoa`

## Validações de Negócio (Service)

- `ArgumentException` se pessoa não tiver nenhuma forma de identificação válida
- `InvalidOperationException` ao tentar remover o responsável sem troca prévia
- `KeyNotFoundException` para família/pessoa não encontrada

## Frontend

- `pages/Familia/interface.ts` — tipos TypeScript
- `pages/Familia/index.tsx` — listagem com filtro por paróquia, coluna de membros
- `pages/Familia/modal.tsx` — modal com seções: Paróquia, Responsável (identificação flexível), Membros, Dados Socioeconômicos, Endereço
