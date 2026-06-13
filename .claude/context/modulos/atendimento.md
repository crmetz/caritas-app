# Módulo: Atendimento

## Status: Em evolução (v1 — visita + indicadores de evolução)

## Visão Geral

Registra as **visitas** de voluntários a famílias em vulnerabilidade, mantendo um
**histórico** e acompanhando a **evolução** da família ao longo do tempo. O foco não é o
controle de doações (auxílios entregues virão em versão futura), e sim o relato da visita
e indicadores que permitam ver a trajetória da família rumo à autonomia.

## Regras de Negócio

- Atendimento é vinculado a **uma família** e a **uma paróquia** (`ParoquiaId` snapshot).
- Só é possível registrar atendimento para família da **paróquia atual** do usuário
  (header `X-Paroquia-Id`): valida-se `familia.ParoquiaId == ParoquiaAtualId`.
- **Voluntário**: por padrão o usuário autenticado. Pode-se escolher outro voluntário,
  desde que ele **pertença à paróquia atual** (vínculo via `UsuarioParoquia`).
- Listagem ordenada por `DataAtendimento` desc (histórico mais recente primeiro).

## Entidade

### `Atendimento` (`Caritas.Models/Entities/Atendimento.cs`) — herda `AuditableEntity`
- `FamiliaId: int` → FK para Familia (Restrict)
- `ParoquiaId: int` → FK para Paroquia (Restrict)
- `VoluntarioId: int` → FK para Usuario (Restrict)
- `DataAtendimento: DateOnly`
- `Relato: string` (obrigatório, máx. 2000)
- `RendaFamiliarMomento: decimal?` — indicador
- `QtdMembrosTrabalhando: int?` — indicador
- `NecessidadesIdentificadas: string?` (máx. 1000)
- `EncaminhamentosRealizados: string?` (máx. 1000)
- `SituacaoGeral: SituacaoGeralFamilia?`

`SituacaoGeralFamilia` (enum): `Critica | Estavel | EmEvolucao | Superada`

## Endpoints

- `GET /api/atendimentos?page=&pageSize=&familiaId=&paroquiaId=&voluntarioId=&situacaoGeral=&dataInicio=&dataFim=` — listagem paginada filtrada
- `GET /api/atendimentos/{id}`
- `POST /api/atendimentos` — voluntário default = usuário logado; paróquia = paróquia atual
- `PUT /api/atendimentos/{id}`
- `DELETE /api/atendimentos/{id}`

Painel de Evolução (derivado dos atendimentos, sem schema novo):
- `GET /api/atendimentos/evolucao/{familiaId}` — série temporal + resumo de uma família
  (renda, membros trabalhando, situação geral; renda inicial/atual/variação)
- `GET /api/atendimentos/evolucao-paroquia` — evolução da situação geral de **todas as
  famílias** da paróquia atual: série mensal (contagem por situação) + distribuição atual

Endpoints de apoio (selects):
- `GET /api/familias/select?paroquiaId=` — famílias da paróquia (label = nome do responsável)
- `GET /api/usuarios/select` — voluntários vinculados à paróquia atual

## Mapper

`Caritas.Service/Mappers/AtendimentoMapper.cs` — static extension methods:
- `ToResponseDto()` — `Atendimento → AtendimentoResponseDto`
- `ToEntity()` — `AtendimentoCreateDto → Atendimento`
- `UpdateFromDto()` — aplica `AtendimentoUpdateDto` em `Atendimento`

## Validações de Negócio (Service)

- `KeyNotFoundException` para família/atendimento não encontrado
- `InvalidOperationException` se a família não pertence à paróquia atual
- `ArgumentException` se o voluntário escolhido não pertence à paróquia

## Frontend

- `pages/Atendimento/interface.ts` — tipos + `SITUACAO_GERAL_LABELS`
- `pages/Atendimento/index.tsx` — listagem com filtro por família e situação geral
- `pages/Atendimento/modal.tsx` — modal criar/editar/visualizar (seções: Visita e
  Indicadores de Evolução); voluntário pré-selecionado no usuário logado, família travada
  na edição

## Fora de escopo (próximas versões)

- Catálogo/lista de **auxílios entregues** (entidade filha `AtendimentoItem`)
- Timeline/painel de evolução por família com gráficos dos indicadores
- Permissões por perfil (hoje qualquer usuário autenticado)
- Imutabilidade dos registros históricos (hoje permite editar/excluir)
