using System.Text.Json.Serialization;

namespace Caritas.Models.Enums;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum TipoDocumentoAlternativo
{
    Rg,
    Passaporte,
    Cnh,
    Ctps,
    DocumentoEstrangeiro,
    Outros,
}
