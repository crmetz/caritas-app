using System.Text.Json.Serialization;

namespace Caritas.Models.Enums;

// Tipo de conteúdo de uma Doacao (mono-tipo): itens avulsos OU cestas fechadas recebidas.
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum TipoDoacao { Itens, CestasFechadas }
