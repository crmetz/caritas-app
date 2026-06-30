using System.Text.Json.Serialization;

namespace Caritas.Models.Enums;

// Como um gênero de Alimento é medido. Define a unidade-base (Peso→g, Volume→ml, Unidade→un)
// e quais unidades de digitação/exibição são válidas (ver MedidaHelper).
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum FormaMedida { Peso, Volume, Unidade }
