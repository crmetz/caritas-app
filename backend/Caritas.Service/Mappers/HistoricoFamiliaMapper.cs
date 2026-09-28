using Caritas.Models.DTOs.Familia;
using Caritas.Models.Entities;
using Caritas.Models.Enums;

namespace Caritas.Service.Mappers;

public static class HistoricoFamiliaMapper
{
    public static EventoHistoricoDto ToEventoDto(this Atendimento a) => new()
    {
        Tipo = TipoEventoHistorico.Atendimento,
        Id = a.Id,
        Data = a.DataAtendimento.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc),
        Descricao = a.Relato,
        Responsavel = a.Voluntario is null
            ? null
            : $"{a.Voluntario.Nome} {a.Voluntario.Sobrenome}".Trim(),
        SituacaoGeral = a.SituacaoGeral,
        RendaFamiliarMomento = a.RendaFamiliarMomento,
    };

    // qtdCestas/qtdItens vêm das agregações feitas no service (mesmo cálculo de EntregaService.GetPagedAsync).
    public static EventoHistoricoDto ToEventoDto(this Entrega e, int qtdCestas, int qtdItens) => new()
    {
        Tipo = TipoEventoHistorico.Entrega,
        Id = e.Id,
        Data = e.CriadoEm,
        Descricao = e.Observacao,
        QtdCestas = qtdCestas,
        QtdItens = qtdItens,
    };

    public static EventoHistoricoDto ToEventoDto(this LancamentoCaixa l) => new()
    {
        Tipo = TipoEventoHistorico.SaidaCaixa,
        Id = l.Id,
        Data = l.Data,
        Descricao = l.Observacoes,
        Responsavel = l.Responsavel,
        Valor = l.Valor,
        Destino = l.Destino,
    };
}
