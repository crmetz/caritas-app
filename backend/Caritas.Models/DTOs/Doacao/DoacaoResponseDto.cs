using Caritas.Models.Enums;

namespace Caritas.Models.DTOs.Doacao;

public class DoacaoResponseDto
{
    public int Id { get; set; }
    public int IdDoador { get; set; }
    public int IdParoquia { get; set; }
    public TipoDoacao Tipo { get; set; }
    public string? Observacao { get; set; }
    public DateTime CriadoEm { get; set; }
}
