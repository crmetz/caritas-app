using System.Text.Json.Serialization;

namespace Caritas.Models.Enums;

// Origem de um LoteCesta: Montagem = montada do estoque (consome alimentos);
// Doacao = cesta fechada recebida (só doador + quantidade, sem movimentação de estoque).
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum OrigemCesta { Montagem, Doacao }
