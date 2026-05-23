using System.Text.Json.Serialization;

namespace Caritas.Models.Enums;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum SituacaoMoradia
{
    Propria,
    Alugada,
    Cedida,
    Irregular,
    Abrigo,
}
