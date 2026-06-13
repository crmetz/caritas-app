# Desenvolvimento — Painel de Evolução

> Checklist vivo. Marque cada item conforme for concluído.
> Depende do módulo de [Atendimento](./atendimento.md) (já implementado).

## Contexto

Cada **Atendimento** captura um snapshot de indicadores na data da visita (renda,
membros trabalhando, situação geral). O **Painel de Evolução** consolida esses snapshots
ao longo do tempo, para que se veja a **trajetória** da família — se está evoluindo rumo à
autonomia ou regredindo. É a materialização do objetivo do sistema: o auxílio é meio para
a família **sair** da vulnerabilidade, e o painel torna essa evolução visível.

Dois níveis:
1. **Por família** — página dedicada com gráficos e timeline.
2. **Macro da paróquia** — visão consolidada da evolução da **situação geral de todas as
   famílias** da paróquia (o dado mais importante para a coordenação).

> Requisitos em refinamento. As seções abaixo refletem as decisões já tomadas.

## Decisões tomadas

- **Indicadores:** renda, membros trabalhando e **situação geral** — esta é a mais
  importante e fica **em destaque** no painel da família.
- **Gráficos:** adicionar **`recharts`** e criar um **wrapper estilizado** em `components/`
  para encapsular a dependência e padronizar o visual (cores, tooltip, eixos).
- **Entrada (por família):** botão "Ver evolução" tanto na listagem de **Famílias** quanto
  na de **Atendimentos**.
- **Período:** sempre tudo (sem filtro de intervalo nesta versão).
- **Sem** exportação/impressão.
- **Macro da paróquia:** evolução da situação geral de todas as famílias da paróquia, sem
  novo item de menu → exibida no **topo da página de Atendimentos** (`/atendimentos`), que
  já é o módulo de evolução e já é filtrada por paróquia.

---

## Cores da Situação Geral (padronizar no wrapper)

Mapa único reutilizado em todos os gráficos/badges (sugestão, ajustável):
- `Critica` → vermelho · `Estavel` → âmbar · `EmEvolucao` → azul · `Superada` → verde

---

# Parte 1 — Painel por Família

## Modelo de Dados (sem mudança de schema)

Derivado dos `Atendimento` existentes. Apenas DTOs de leitura/agregação
(`Caritas.Models/DTOs/Atendimento/`):
- `EvolucaoFamiliaDto`: `FamiliaId`, `FamiliaResponsavelNome`, `TotalAtendimentos`,
  `PrimeiroAtendimento: DateOnly?`, `UltimoAtendimento: DateOnly?`,
  `SituacaoAtual: SituacaoGeralFamilia?`, `RendaInicial/RendaAtual/VariacaoRenda: decimal?`,
  `Pontos: List<EvolucaoPontoDto>` (cronológico asc)
- `EvolucaoPontoDto`: `Data: DateOnly`, `RendaFamiliarMomento: decimal?`,
  `QtdMembrosTrabalhando: int?`, `SituacaoGeral: SituacaoGeralFamilia?`, `Relato`

## Backend

- [x] DTOs `EvolucaoFamiliaDto` + `EvolucaoPontoDto`
- [x] `AtendimentoRepository.GetByFamiliaOrderedAsync(int familiaId)` — atendimentos da
      família ordenados por `DataAtendimento` asc (com `Familia.Responsavel`)
- [x] `AtendimentoMapper.ToEvolucaoPontoDto()`
- [x] `AtendimentoService.GetEvolucaoAsync(int familiaId, int paroquiaAtualId)` — valida
      família existe + pertence à paróquia; monta série + resumo (renda inicial/atual/variação)
- [x] `AtendimentosController`: `GET /api/atendimentos/evolucao/{familiaId}`
- [x] `dotnet build` sem erros (sem migration)

## Frontend

- [x] Instalar `recharts` (`recharts@3.8.1`)
- [x] Wrapper de gráfico em `components/EvolucaoChart/` (`LineChartCard`, `SituacaoStepChart`,
      `StackedSituacaoChart` + `SITUACAO_COLOR`/`SITUACAO_LABEL`/`situacaoNivel`)
- [x] `pages/EvolucaoFamilia/interface.ts` — tipos `EvolucaoFamilia`, `EvolucaoPonto`
- [x] `pages/EvolucaoFamilia/index.tsx` — painel:
  - cabeçalho: responsável, período (primeiro→último), **badge de situação atual em destaque**
  - **destaque:** `SituacaoStepChart` (situação geral ao longo do tempo) no topo
  - cards de resumo: total de atendimentos, variação de renda, membros trabalhando (atual)
  - gráfico de linha: renda ao longo do tempo
  - gráfico de linha: membros trabalhando ao longo do tempo
  - timeline dos atendimentos (data + situação + relato), do mais recente ao mais antigo
  - estado vazio quando a família não tem atendimentos
- [x] `main.tsx` — rota `/familias/:familiaId/evolucao` dentro de `AppLayout`
- [x] Botão "Ver evolução" (coluna) em `pages/Familia/index.tsx` e `pages/Atendimento/index.tsx`
- [x] `npm run typecheck`

---

# Parte 2 — Painel Macro da Paróquia (situação geral)

Objetivo: mostrar como a **situação geral das famílias** da paróquia evolui no tempo —
ideal seria ver mais famílias migrando para `EmEvolucao`/`Superada`.

## Modelo de Dados (derivado, sem schema)

DTOs em `Caritas.Models/DTOs/Atendimento/`:
- `EvolucaoParoquiaDto`:
  - `TotalFamiliasComAtendimento: int`
  - `DistribuicaoAtual: List<SituacaoContagemDto>` — snapshot atual (situação do **último**
    atendimento de cada família)
  - `Serie: List<EvolucaoParoquiaPontoDto>` — por período (mês `yyyy-MM`), a contagem de
    famílias em cada situação considerando o atendimento mais recente de cada família **até
    aquele mês**
- `SituacaoContagemDto`: `Situacao: SituacaoGeralFamilia?`, `Quantidade: int`
- `EvolucaoParoquiaPontoDto`: `Periodo: string` (yyyy-MM) + contagem por situação
  (`Critica`, `Estavel`, `EmEvolucao`, `Superada`)

## Backend

- [x] DTOs acima
- [x] `AtendimentoRepository.GetByParoquiaOrderedAsync(int paroquiaId)` — todos os
      atendimentos da paróquia asc
- [x] `AtendimentoService.GetEvolucaoParoquiaAsync(int paroquiaAtualId)`:
  - agrupa por mês entre o primeiro e o último atendimento da paróquia
  - para cada mês, calcula a situação vigente de cada família (último atendimento ≤ fim do mês)
      e conta por situação
  - monta `DistribuicaoAtual` (situação vigente atual de cada família)
- [x] `AtendimentosController`: `GET /api/atendimentos/evolucao-paroquia` (usa `ParoquiaAtualId`)
- [x] `dotnet build` sem erros

## Frontend

- [x] Tipos do macro em `pages/Atendimento/interface.ts` (`EvolucaoParoquia`, `EvolucaoParoquiaPonto`, `SituacaoContagem`)
- [x] Painel macro **no topo de `pages/Atendimento/index.tsx`**:
  - **gráfico de área empilhada** (`StackedSituacaoChart`) da série mensal
  - mini-resumo: distribuição atual (lista colorida) + total de famílias acompanhadas
  - **recolhível** (toggle), para não empurrar a listagem
- [x] Carregar via `GET /api/atendimentos/evolucao-paroquia` ao montar / ao trocar paróquia / após criar/excluir atendimento
- [x] `npm run typecheck`

---

## Verificação (end-to-end)

- [x] `dotnet build` e `npm run typecheck` sem erros
- [x] `GET /api/atendimentos/evolucao/{familiaId}` — roteado; família inexistente → 404; sem header → 422
- [x] `GET /api/atendimentos/evolucao-paroquia` → 200 (vazio quando sem dados); sem header → 422
- [ ] UI família: criar atendimentos em datas distintas e ver gráficos + timeline
      (situação geral em destaque) *(requer dados semeados)*
- [ ] UI macro: painel no topo de Atendimentos reflete a evolução da paróquia *(requer dados)*

---

## Fora de escopo (próximas versões)
- Comparação entre paróquias / dashboard diocesano macro
- Metas por família e alertas de regressão
- Exportar painel em PDF
