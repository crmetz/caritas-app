# Design — Registro de Doações + Entrega de Cesta à Família

> **Data:** 2026-06-21
> **Status:** design aprovado em brainstorming; pendente plano de implementação.
> **Relaciona-se a:** [modelo-dominio-estoque.md](./modelo-dominio-estoque.md) — este documento **emenda**
> aquele modelo (Doação, LoteCesta, MovimentacaoCesta). Onde houver divergência, este prevalece.
>
> ⚠️ **Emenda 2026-06-22 (ver seção [Entregas de saída](#emenda-2026-06-22--entregas-de-saída-entidade-entrega) ao fim).**
> A parte de **entrega de cesta** abaixo (campo `MovimentacaoCesta.IdFamilia` preenchido na baixa) foi
> **substituída**: a saída a uma família passou a ser uma entidade própria `Entrega` (header + linhas nos
> dois ledgers), e `MovimentacaoCesta.IdFamilia` → `IdEntrega`. O **registro de entrada** (resto do doc)
> permanece válido.

## Contexto

Duas lacunas no módulo de Estoque/Cestas, surgidas do processo real da Cáritas:

1. **Cesta é entregue a uma `Familia`, não a uma pessoa solta.** Hoje a baixa de cesta
   (`MovimentacaoCesta`) registra só um `Motivo` e **nenhum destinatário**. Não há como saber qual
   família recebeu cada cesta.
2. **Não há um registro explícito e unificado de doações que chegam.** Doações de **itens avulsos**
   (alimento/roupa) já são registráveis via `Doacao` + `DoacaoService.RegistrarAsync`, mas **cestas
   fechadas recebidas** entram por outro caminho (`LoteCesta.Origem=Doacao` com `IdDoador` direto),
   **sem** gerar uma `Doacao`. Resultado: doações vivem em dois lugares desconectados, e o fluxo de
   itens avulsos sequer tem tela. Queremos **um único registro** de tudo que é doado, seja itens
   avulsos ou cesta fechada.

Este design resolve as duas, mantendo intactos os princípios do módulo (ledger append-only +
projeção `Estoque`; referência entre agregados por `id`).

## Decisões (brainstorming)

| Tema | Decisão |
|------|---------|
| Registro de doações | **`Doacao` é o registro único.** Cesta fechada recebida passa a criar uma `Doacao` + um `LoteCesta` ligado a ela. |
| Conteúdo de uma `Doacao` | **Mono-tipo:** uma `Doacao` é **ou** itens avulsos **ou** cestas fechadas — nunca os dois juntos. |
| Destinatário da cesta | **`IdFamilia` na baixa** (`MovimentacaoCesta`), obrigatório quando `Motivo=Entregue`. |
| `MotivoBaixaCesta` | `{ Entregue, Transferida, Descartada, Outro }` — `Doada` (redundante com `Entregue`) vira `Transferida` (repasse a outra paróquia/órgão, sem família). |
| Convenções de código | **Manter o padrão atual do estoque** (`IEntityTypeConfiguration` + mappers inline onde já existem). Conversão para Data Annotations / mapper estático (convenção nova do `main`) é **limpeza separada**, fora deste escopo. |
| Permissões | **Scaffolding de `Permissions.Suprimentos.*`** (Visualizar / Gerenciar) e gate das telas novas, seguindo o padrão do `main`. |

## Mudanças de modelo

### Enums

| Enum | Mudança |
|------|---------|
| `MotivoBaixaCesta` | `Entregue`, ~~`Doada`~~ → `Transferida`, `Descartada`, `Outro`. String-persisted. |
| `TipoDoacao` *(novo)* | `Itens`, `CestasFechadas`. String-persisted. Discriminador barato p/ listar/filtrar doações sem N+1. |

### `Doacao` (registro único de doação)

| Campo | Tipo | Notas |
|-------|------|-------|
| `idDoador` | int | FK → `Doador` (já existe). |
| `idParoquia` | int | FK → `Paroquia` (já existe; setado via `ICurrentSession.ParoquiaAtualId`). |
| `tipo` | `TipoDoacao` | **novo.** `Itens` ou `CestasFechadas`. |
| `observacao` | `string?` | já existe. |

Conteúdo continua **derivado** (não duplicado):
- `tipo=Itens` → linhas `MovimentacaoEstoque` de `Entrada` com `origemTipo=Doacao`, `origemId=Doacao.Id` (fluxo atual).
- `tipo=CestasFechadas` → linhas `LoteCesta` com `idDoacao=Doacao.Id`.

### `LoteCesta` (substitui o vínculo de doador)

- **Remove** `idDoador`. **Adiciona** `idDoacao: int?` (FK → `Doacao`, nullable).
- `Origem=Doacao` ⇒ `idDoacao` setado (doador alcançado via `Doacao.IdDoador`).
- `Origem=Montagem` ⇒ `idConfiguracaoCesta` setado, `idDoacao` null (inalterado).

### `MovimentacaoCesta` (baixa ganha destinatário)

- **Adiciona** `idFamilia: int?` (FK → `Familia`, nullable).
- Regra (app-level): `Motivo=Entregue` ⇒ `idFamilia` **obrigatório** e a família deve ser da paróquia
  corrente; demais motivos ⇒ `idFamilia` null.

### Relacionamentos novos/alterados

| Campo | Referência | Cardinalidade | FK | Delete |
|-------|-----------|---------------|----|--------|
| `LoteCesta.idDoacao` | `Doacao` | N : 0..1 | Sim (nullable) | Restrict |
| `MovimentacaoCesta.idFamilia` | `Familia` | N : 0..1 | Sim (nullable) | Restrict |

## Fluxo de doação unificado

`DoacaoService` passa a ser a **única** porta de entrada de doações:

- **Itens avulsos** — `RegistrarAsync` existente (doador + linhas de item → movimentos de `Entrada`),
  agora setando `tipo=Itens`.
- **Cestas fechadas** — **mover** `LoteCestaService.RegistrarRecebidaAsync` para dentro de
  `DoacaoService`: numa transação, cria `Doacao(tipo=CestasFechadas, idDoador)` + `LoteCesta(Origem=Doacao,
  idDoacao, quantidade)`. `LoteCesta.RegistrarRecebidaAsync` deixa de existir como porta pública.

Assim **toda doação que chega é uma linha de `Doacao`**, listável/filtrável num só lugar, com doador
sempre via `Doacao.IdDoador`.

## Entrega de cesta à família

`LoteCestaService.RegistrarBaixaAsync` valida, antes de inserir a `MovimentacaoCesta`:
- `Motivo=Entregue` ⇒ `IdFamilia` informado **e** `Familia.ParoquiaId == ICurrentSession.ParoquiaAtualId`
  (senão `ArgumentException` → 400 / `KeyNotFoundException` → 404 se a família não existe).
- `Motivo ∈ {Transferida, Descartada, Outro}` ⇒ `IdFamilia` deve ser null.

O histórico de entregas por família sai direto de `MovimentacaoCesta` onde `Motivo=Entregue`
(gancho natural para `EvolucaoFamilia`/`Atendimento` no futuro — **fora de escopo** agora).

## Migrations (uma migration combinada + backfill)

1. `MovimentacaoCesta.IdFamilia` — coluna nullable + FK (Restrict).
2. `MotivoBaixaCesta` — `UPDATE "MovimentacaoCesta" SET "Motivo"='Transferida' WHERE "Motivo"='Doada'`.
3. `LoteCesta` — adiciona `IdDoacao` (nullable, FK Restrict); **backfill**: para cada `LoteCesta` com
   `Origem=Doacao` e `IdDoador` setado, criar `Doacao(tipo=CestasFechadas, idDoador, idParoquia)` e
   apontar `IdDoacao`; depois **dropar** `IdDoador`.
4. `Doacao.Tipo` — coluna nova; default `'Itens'` para linhas existentes (as criadas no backfill já
   nascem `'CestasFechadas'`).

> Padrão do projeto: migration aplicada automaticamente no startup (`MigrateAsync`). Ambiente dev tem
> pouca/nenhuma massa — o backfill é defensivo.

## UX / Frontend

Nenhuma tela de `Doacao` existe hoje. Seguir os padrões do projeto (pasta por componente, modal
`forwardRef`, `DataTable`, `APIService`, `SearchableSelect` — componente que veio do `main`).

- **`/doacoes` — página Doações** *(nova)*: `DataTable` de todas as doações (data · doador · tipo
  `Itens`/`Cestas` · resumo/qtd). Botão "Nova doação" → modal. Escopo por paróquia (`ICurrentSession`).
- **Modal Nova Doação** *(novo)*: alternância de modo **Itens avulsos** ↔ **Cesta(s) fechada(s)**;
  **picker de Doador** compartilhado (`SearchableSelect` + criação rápida de `Doador`). Modo itens
  reusa os campos de entrada de estoque (item/tamanho/validade/lote/qtd); modo cestas = doador + qtd.
- **`BaixaCestaModal`** *(alterar)*: quando `Motivo=Entregue`, mostrar **picker de Família**
  (`SearchableSelect` escopado à paróquia, via `FamiliasController`); esconder para
  Transferida/Descartada/Outro e mostrar `observação`. Remover a entrada avulsa de "cesta recebida" —
  passa a ser o modo "cesta fechada" da Nova Doação.
- **Rota/nav**: adicionar `/doacoes` em `main.tsx` e `AppLayout`, com gate de permissão (abaixo).

## Permissões (`Suprimentos`)

Scaffolding mínimo seguindo o padrão de `main` (`Caritas.Models/Constants/Permissions.cs` +
`frontend/src/constants/permissions.ts`):

Seguindo o par exato do `main` (`Visualizar` / `CriarEditar`, valores `modulo.acao`):
- `Permissions.Suprimentos.Visualizar` (`"suprimentos.visualizar"`) — ver estoque/cestas/doações.
- `Permissions.Suprimentos.CriarEditar` (`"suprimentos.criarEditar"`) — criar/editar movimentações,
  doações, montagem, baixa/entrega.

Gate via `PermissionRoute` (rotas) e `hasPermission` (nav) — substitui os TODOs ungated deixados no
merge para `/estoque-*`, `/alimentos`, `/cesta-basica` e a nova `/doacoes`. Seed do admin já concede
todas as permissões (`PermissionService.AllValues`).

## Convenções (manter padrão do estoque)

As entidades/serviços novos e alterados **seguem o padrão atual do módulo de estoque**, não a
convenção mais nova do `main`:
- Mapeamento via `IEntityTypeConfiguration` em `Caritas.Repository/Mappings/` (os novos FKs apenas
  estendem `LoteCestaMapping`, `MovimentacaoCestaMapping`, e um `DoacaoMapping`).
- Mappers inline/estáticos como já existem na área.

Converter o estoque para Data Annotations + mapper estático (alinhando ao `main`) é uma **limpeza
separada**, fora deste escopo.

## Fora de escopo

- Vincular entrega de cesta ao fluxo de `Atendimento`/`EvolucaoFamilia` (só o gancho `IdFamilia` fica
  pronto).
- Doação **mista** (itens + cestas na mesma `Doacao`) — decidido mono-tipo.
- Conversão de convenções do estoque (mappings/mappers) para o padrão novo do `main`.
- Distribuição com baixa parcial de validade/relatórios avançados de doação.

## Verificação (fim da implementação)

- **Build/typecheck:** `dotnet build backend/Caritas.sln` (0 erros) + `npm run typecheck` (limpo).
- **Migration:** subir via `docker-compose up` (aplica no startup) e checar
  `dotnet ef migrations has-pending-model-changes` = sem mudanças.
- **Fluxo doação (itens):** POST cria `Doacao(tipo=Itens)` + movimentos de `Entrada`; aparece em `/doacoes`.
- **Fluxo doação (cesta fechada):** registrar gera `Doacao(tipo=CestasFechadas)` + `LoteCesta(Origem=Doacao,
  idDoacao)`; doador via `Doacao`.
- **Entrega:** baixa com `Motivo=Entregue` exige `IdFamilia` válido da paróquia; recusa família de outra
  paróquia; `MovimentacaoCesta` registra a família; demais motivos recusam `IdFamilia`.
- **Permissão:** usuário sem `Suprimentos.Visualizar` não vê as telas; sem `Gerenciar` não registra.

---

## Emenda 2026-06-22 — Entregas de saída (entidade `Entrega`)

> **Data:** 2026-06-22 · **Status:** aprovado em brainstorming, implementado.
> **Substitui** a seção "Entrega de cesta à família" e o campo `MovimentacaoCesta.IdFamilia` acima.

### Contexto

A iteração anterior centralizou as doações de **entrada** e deixou pronto o gancho de cesta→família
(`IdFamilia` na baixa). Faltava registrar, num só lugar, **tudo que a Cáritas entrega a uma família** —
não só cestas, mas também alimentos e roupas avulsos (que saíam linha-a-linha pelo diálogo de saída de
estoque, **sem** vínculo com família nem visão consolidada).

### Decisões (brainstorming)

| Tema | Decisão |
|------|---------|
| Modelo da saída | **`Entrega` como evento (header + linhas).** Nova entidade `Entrega(idParoquia, idFamilia, observacao)` cujas linhas debitam os dois ledgers numa transação — simétrico à `Doacao` de entrada. |
| Consolidação | **Absorver tudo (fonte única).** `Entrega` é o único jeito de dar algo a uma família. A baixa de cesta **deixa de aceitar** `Motivo=Entregue`; o diálogo de saída de estoque **perde** o motivo "Doação" (fica Utilização/Descarte/Ajuste). |
| Vínculo da cesta | `MovimentacaoCesta.IdFamilia` → **`IdEntrega`** (FK → `Entrega`). A família vive **só** no header `Entrega`. `Motivo=Entregue` ⟺ `IdEntrega != null`. |
| Item de saída | Novo valor `OrigemMovimentacao.Entrega`; linhas de alimento/roupa = `Movimentacao` de `Saida` com `origemTipo=Entrega`, `origemId=Entrega.Id` (polimórfico, sem coluna nova). |
| Convenções/permissões | Mantém o padrão do estoque (`IEntityTypeConfiguration` + mappers) e reusa `Permissions.Suprimentos.*`. |

### Mudanças de modelo (sobre a emenda anterior)

- **Novo** `OrigemMovimentacao.Entrega`.
- **`MovimentacaoCesta`**: troca `IdFamilia` → `IdEntrega` (FK → `Entrega`, nullable, Restrict).
- **Nova** `Entrega : FullAuditableEntity` — `IdParoquia`, `IdFamilia` (FK `Familia`, Restrict),
  `Observacao?`. Listável em `/entregas`; conteúdo derivado (não duplicado) das linhas dos dois ledgers.

### Fluxo

`EntregaService.RegistrarAsync` (transação): valida paróquia + família da paróquia; exige ≥1 linha;
cria `Entrega` → para cada item, `MovimentacaoService.AplicarMovimentoAsync` (`Saida`, `origemTipo=Entrega`,
saldo validado); para cada cesta, valida o lote (paróquia + saldo), insere `MovimentacaoCesta`
(`Entregue`, `idEntrega`) e decrementa `LoteCesta.QuantidadeDisponivel`. Invariantes de saldo revertem tudo.
`LoteCestaService.RegistrarBaixaAsync` passa a **rejeitar** `Motivo=Entregue`.

### Migration

Por estar tudo **não commitado** (a migration de entrada ainda não fora aplicada/commitada) e o dev DB
quase vazio, a migration em voo foi **reaproveitada/regenerada** numa só: `Doacao.Tipo`,
`LoteCesta.IdDoacao` (+drop `IdDoador`), tabela `Entrega`, `MovimentacaoCesta.IdEntrega` — em vez de
`IdFamilia` — com os mesmos data-fixes (`Doada`→`Transferida`, default `Tipo='Itens'`).

### UX / Frontend

- **`/entregas` — página Entregas às Famílias** *(nova)*: `DataTable` (data · família · resumo
  `N cesta(s) · M item(ns)`) + botão "Nova entrega".
- **Modal Nova Entrega** *(novo)*: `SearchableSelect` de **Família** (obrigatória) + abas
  **Cestas** (picker de lote disponível via `GET /lotes-cesta/select` + qtd) e **Alimentos/Roupas**
  (picker de posição de estoque disponível via `GET /estoque/alimentos|roupas` + qtd).
- **`BaixaCestaModal`** *(alterado)*: remove `Entregue` e o picker de Família; baixa só
  Transferida/Descartada/Outro. **Diálogos de saída de estoque**: removem o motivo "Doação".
- **Rota/nav**: `/entregas` no bloco já gated por `Suprimentos.Visualizar`, ao lado de `/doacoes`.
