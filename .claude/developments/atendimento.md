# Desenvolvimento — Módulo de Atendimento

> Checklist vivo. Marque cada item conforme for concluído.

## Contexto

Voluntários de uma paróquia visitam famílias em situação de vulnerabilidade de sua
comunidade. O **Atendimento** registra essas visitas para manter um **histórico** e
acompanhar a **evolução** da família ao longo do tempo. A filosofia do sistema é que o
auxílio (cesta básica, roupa, etc.) é meio para que a família **saia** da vulnerabilidade
— não um benefício permanente. Por isso o foco da v1 não é controle de doações, e sim o
relato da visita + **indicadores de evolução** capturados a cada atendimento.

Módulo novo, construído sobre o padrão vertical já consolidado (ver `Familia`).

### Decisões tomadas
- **Escopo v1:** visita + indicadores de evolução (sem catálogo de auxílios ainda).
- **Auxílios entregues:** fora da v1 (entidade filha `AtendimentoItem` virá depois).
- **Voluntário:** selecionável no formulário. **Default** = usuário autenticado
  (`UsuarioId` do JWT). Pode-se registrar em nome de **outro voluntário**, desde que esse
  usuário **pertença à mesma paróquia** (vínculo via `UsuarioParoquia`). Senão → 400/422.
- **Paróquia:** `Atendimento` tem `ParoquiaId` próprio (snapshot), validado contra a
  paróquia da família e contra a paróquia atual do usuário (`X-Paroquia-Id`).

> Requisitos em refinamento. O conjunto de indicadores abaixo é proposta inicial.

---

## Modelo de Dados Proposto

### Entidade `Atendimento : AuditableEntity` (`Caritas.Models/Entities/Atendimento.cs`)

| Campo | Tipo | Notas |
|---|---|---|
| `FamiliaId` | `int` | FK → `Familia` (Restrict) |
| `ParoquiaId` | `int` | FK → `Paroquia` (Restrict). Snapshot, validado contra a família |
| `VoluntarioId` | `int` | FK → `Usuario` (Restrict). Selecionável; default = `UsuarioId` do JWT; validado contra a paróquia |
| `DataAtendimento` | `DateOnly` | Data da visita |
| `Relato` | `string` (req, `MaxLength(2000)`) | Narrativa da visita |
| `RendaFamiliarMomento` | `decimal?` `[Precision(10,2)]` | Renda no momento (indicador) |
| `QtdMembrosTrabalhando` | `int?` | Indicador de emprego |
| `NecessidadesIdentificadas` | `string?` `[MaxLength(1000)]` | Texto livre |
| `EncaminhamentosRealizados` | `string?` `[MaxLength(1000)]` | Ex.: CRAS, saúde, cursos |
| `SituacaoGeral` | `SituacaoGeralFamilia?` | Indicador rápido de evolução |

Navegações: `Familia`, `Paroquia`, `Voluntario` (todas `[ForeignKey]`).

### Novo enum `SituacaoGeralFamilia` (`Caritas.Models/Enums/SituacaoGeralFamilia.cs`)
`[JsonConverter(JsonStringEnumConverter)]` → `Critica | Estavel | EmEvolucao | Superada`

### Delete behavior (em `OnModelCreating`)
As 3 FKs com `DeleteBehavior.Restrict` (registro histórico não deve sumir nem cascatear).

---

## Backend — `C:\Code\caritas\backend`

Seguir o slice vertical de `Familia` (não pular camadas; Service/Repository instanciados
manualmente, nunca registrados no DI).

### Caritas.Models
- [x] `Entities/Atendimento.cs`
- [x] `Enums/SituacaoGeralFamilia.cs`
- [x] `DTOs/Atendimento/AtendimentoCreateDto.cs` (sem `ParoquiaId`; `VoluntarioId: int?` opcional — default = usuário logado no service)
- [x] `DTOs/Atendimento/AtendimentoUpdateDto.cs`
- [x] `DTOs/Atendimento/AtendimentoResponseDto.cs` (nomes desnormalizados + auditoria)
- [x] `DTOs/Atendimento/AtendimentoFilterDto.cs` (`FamiliaId?`, `ParoquiaId?`, `VoluntarioId?`, `SituacaoGeral?`, `DataInicio?`, `DataFim?`)
- [x] `Interfaces/IAtendimentoRepository.cs` (`: IBaseRepository<Atendimento>` + paged com filtro + getById com relacionamentos)

### Caritas.Repository
- [x] `Repositories/AtendimentoRepository.cs` (Includes + `AsSplitQuery` + filtros + `OrderByDescending(DataAtendimento)`)
- [x] `Context/CaritasDbContext.cs` — `DbSet<Atendimento>` + 3 relacionamentos `Restrict`

### Caritas.Service
- [x] `Mappers/AtendimentoMapper.cs` (`ToResponseDto`, `ToEntity`, `UpdateFromDto`)
- [x] `AtendimentoService.cs` (Create valida família + `familia.ParoquiaId == paroquiaAtualId`; seta `ParoquiaId`; resolve voluntário: `dto.VoluntarioId ?? usuarioLogadoId` e **valida que pertence à paróquia** quando difere do logado, senão `ArgumentException`; CRUD; erros 404/400/422)

### Caritas.WebApi
- [x] `Controllers/AtendimentosController.cs : BaseApiController` (GET paginado/filtro, GET{id}, POST, PUT, DELETE; passa `UsuarioId` (default do voluntário) e `ParoquiaAtualId` ao service)
- [x] `GET /api/usuarios/select` — voluntários vinculados à paróquia atual (novo método em `UsuariosController`/`UsuariosService`/`UsuarioRepository`)
- [x] `GET /api/familias/select?paroquiaId=` — apoio ao seletor de família no modal (novo método em `FamiliasController`/`FamiliaService`/`FamiliaRepository`)

### Migration
- [x] `dotnet ef migrations add AdicionarAtendimento` (gerada: `20260612224900_AdicionarAtendimento`)
- [x] Subir API (`docker-compose up -d --build`) — migration aplicada no startup, tabela `Atendimentos` criada

---

## Frontend — `C:\Code\caritas\frontend`

Seguir o padrão de `pages/Familia` (modal `forwardRef`+`useImperativeHandle`, `APIService`
direto no componente, `DataTable` genérico, react-hook-form + yup).

- [x] `pages/Atendimento/interface.ts` (tipos + `SituacaoGeralFamilia` union + `SITUACAO_GERAL_LABELS`)
- [x] `pages/Atendimento/index.tsx` (listagem `DataTable`: família/data/voluntário/situação(Badge)/renda; filtro por família e situação; "Novo Atendimento"; `onView` leitura)
- [x] `pages/Atendimento/modal.tsx` (seções: Visita (Família select, **Voluntário** select pré-selecionado no usuário logado via `useSession`, Data, Situação, Relato) e Indicadores de Evolução)
- [x] `main.tsx` — rota `/atendimentos` dentro de `AppLayout`
- [x] `components/AppLayout/index.tsx` — `NavLink` "Atendimentos"
- [x] `npm run typecheck` (rodado via `node node_modules/typescript/bin/tsc --noEmit` — sem erros)

> **Histórico/evolução:** na v1, filtrar a listagem por família (ordenada por data desc).
> Timeline dedicada por família fica como melhoria futura.

---

## Documentação
- [x] `.claude/context/modulos/atendimento.md` (status, regras, entidade, endpoints, mapper, validações, frontend — formato dos demais)

---

## Verificação (end-to-end)
- [x] `dotnet build` sem erros (apenas warnings pré-existentes)
- [x] `npm run typecheck` sem erros
- [x] Migration `AdicionarAtendimento` aplicada; tabela `Atendimentos` criada (colunas, índices e 3 FKs `RESTRICT` conferidos no Postgres)
- [x] Smoke test de roteamento: `GET /api/atendimentos` → 200; `GET /api/familias/select` → 200; `GET /api/usuarios/select` → 401 sem token (esperado, `[Authorize]`)
- [ ] `POST /api/atendimentos` sem `VoluntarioId` → 201, voluntário = usuário logado *(testar autenticado via UI)*
- [ ] `POST` com `VoluntarioId` de outro usuário **da mesma paróquia** → 201 *(testar via UI)*
- [ ] `POST` com `VoluntarioId` de usuário de **outra paróquia** → 400 *(testar via UI)*
- [ ] `POST` para família de outra paróquia → 422 *(testar via UI)*
- [ ] `GET /api/atendimentos?familiaId=X` → histórico ordenado por data desc *(testar com dados)*
- [ ] `PUT`/`DELETE` → 200/204 *(testar via UI)*
- [ ] Frontend: criar/listar/filtrar/visualizar/editar pela UI

---

## Fora de escopo (próximas versões)
- Catálogo/lista de **auxílios entregues** (`AtendimentoItem`)
- Timeline/painel de evolução por família com gráficos dos indicadores
- Permissões por perfil (hoje qualquer usuário autenticado)
- Imutabilidade dos registros históricos (hoje permite editar/excluir)
