using System.Text.Json.Serialization;

namespace Caritas.Models.Enums;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum OrigemMovimentacao { Doacao, MontagemCesta, Ajuste, Descarte, Entrega }
