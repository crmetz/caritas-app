using Caritas.Models.Enums;

namespace Caritas.Models.DTOs.Bazar;

public class RemessaCreateDto
{
    public string Nome { get; set; } = string.Empty;
    public OrigemRemessa Origem { get; set; }
    public DateTime DataChegada { get; set; }
}
