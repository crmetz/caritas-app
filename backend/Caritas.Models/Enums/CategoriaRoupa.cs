using System.Text.Json.Serialization;

namespace Caritas.Models.Enums;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum CategoriaRoupa { Calca, Calcado, Acessorio, Camisa, Casaco, Outro }
