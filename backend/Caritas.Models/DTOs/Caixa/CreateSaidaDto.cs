using Caritas.Models.Enums;

namespace Caritas.Models.DTOs.Caixa;

public class CreateSaidaDto
{
    public int ParoquiaId { get; set; }
    public DateTime Data { get; set; }
    public decimal Valor { get; set; }
    public DestinoSaida Destino { get; set; }
    public int? FamiliaId { get; set; }
    public string Responsavel { get; set; } = string.Empty;
    public string? Observacoes { get; set; }
}
