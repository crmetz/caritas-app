using System.Text.Json.Serialization;

namespace Caritas.Models.Enums;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum SituacaoGeralFamilia
{
    Critica,
    Estavel,
    EmEvolucao,
    Superada,
}
