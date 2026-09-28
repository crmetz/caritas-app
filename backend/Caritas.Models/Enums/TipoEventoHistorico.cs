using System.Text.Json.Serialization;

namespace Caritas.Models.Enums;

// Discrimina a origem de cada evento da linha do tempo da família.
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum TipoEventoHistorico
{
    Atendimento,
    Entrega,
    SaidaCaixa,
}
