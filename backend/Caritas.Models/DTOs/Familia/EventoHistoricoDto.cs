using Caritas.Models.Enums;

namespace Caritas.Models.DTOs.Familia;

// Evento da linha do tempo da família. As três origens (atendimento, entrega e saída de caixa)
// compartilham este DTO; o front discrimina por Tipo e lê apenas os campos daquele tipo.
public class EventoHistoricoDto
{
    public TipoEventoHistorico Tipo { get; set; }
    public int Id { get; set; }                 // id da entidade de origem
    public DateTime Data { get; set; }
    public string? Descricao { get; set; }      // relato do atendimento / observação da entrega ou do lançamento
    public string? Responsavel { get; set; }    // voluntário do atendimento / responsável do lançamento

    // Atendimento
    public SituacaoGeralFamilia? SituacaoGeral { get; set; }
    public decimal? RendaFamiliarMomento { get; set; }

    // Entrega
    public int? QtdCestas { get; set; }
    public int? QtdItens { get; set; }

    // Saída de caixa
    public decimal? Valor { get; set; }
    public DestinoSaida? Destino { get; set; }
}
