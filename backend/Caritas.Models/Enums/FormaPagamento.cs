using System.Text.Json.Serialization;

namespace Caritas.Models.Enums;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum FormaPagamento
{
    Pix,
    Dinheiro,
}
