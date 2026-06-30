using System.Text.Json.Serialization;

namespace Caritas.Models.Enums;

// Motivo da baixa (saída) de cestas do controle.
// Entregue = a uma Familia beneficiária (exige IdFamilia); Transferida = repasse a outra paróquia/órgão.
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum MotivoBaixaCesta { Entregue, Transferida, Descartada, Outro }
