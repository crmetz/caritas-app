using Caritas.Models.Enums;

namespace Caritas.Models.DTOs.Bazar;

public class RemessaResponseDto
{
    public int Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public OrigemRemessa Origem { get; set; }
    public DateTime DataChegada { get; set; }
    public DateTime CriadoEm { get; set; }
    public DateTime AtualizadoEm { get; set; }
}
