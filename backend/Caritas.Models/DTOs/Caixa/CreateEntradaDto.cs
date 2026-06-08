using Caritas.Models.Enums;

namespace Caritas.Models.DTOs.Caixa;

public class CreateEntradaDto
{
    public int ParoquiaId { get; set; }
    public DateTime Data { get; set; }
    public decimal Valor { get; set; }
    public OrigemEntrada Origem { get; set; }
    public string Responsavel { get; set; } = string.Empty;
    public string? Observacoes { get; set; }
}
