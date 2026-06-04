# Módulo: Suprimentos / Notificações Entre Paróquias

## Status: Planejado (não implementado)

## Objetivo

Permitir que paróquias notifiquem umas às outras sobre **falta ou sobra de suprimentos** (alimentos, roupas, medicamentos, etc.), facilitando a redistribuição de recursos dentro da diocese.

## Fluxo Previsto

1. Paróquia A cria uma notificação: "Temos **sobra** de cestas básicas" ou "Precisamos de **roupas de inverno**"
2. Diocese e outras paróquias visualizam o feed de notificações
3. Paróquia B que pode atender "aceita" a notificação — status muda para Atendida

## Entidade Planejada: `NotificacaoSuprimento`

```
ParoquiaOrigemId: int          → FK para Paroquia
TipoNotificacao: enum          → Falta | Sobra
CategoriaSuprimento: string    → "Alimentos", "Roupas", "Medicamentos", etc.
Descricao: string              → detalhes do item/quantidade
Status: enum                   → Pendente | Atendida | Cancelada
ParoquiaDestinoId: int?        → FK para Paroquia que atendeu (nullable)
CriadoEm, AtualizadoEm
```

## Interface Prevista

- **Página de Suprimentos**: feed paginado com filtros por tipo, categoria, paróquia
- **Modal de criação**: tipo, categoria, descrição
- **Ação "Atender"**: muda status para Atendida e registra paróquia destino

## Observações de Implementação

- Seguir mesmo padrão dos outros módulos (Mapper estático, BaseRepository, Service, Controller)
- Filtrar por paróquia do usuário logado (quando auth for implementada)
- Notificações do tipo Atendida/Cancelada não devem ser editáveis
