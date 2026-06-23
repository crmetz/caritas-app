namespace Caritas.Models.DTOs.Brecho;

public class SessaoCaixaBrechoResponseDto
{
    public int Id { get; set; }
    public int ParoquiaId { get; set; }
    public string AbertoPor { get; set; } = string.Empty;
    public string? FechadoPor { get; set; }
    public DateTime AbertoEm { get; set; }
    public DateTime? FechadoEm { get; set; }
    public decimal SaldoInicial { get; set; }
    public decimal? SaldoFinalContado { get; set; }
    public decimal? SaldoFinalCalculado { get; set; }
    public decimal? Diferenca { get; set; }
    public string? Observacoes { get; set; }
    public bool Aberto { get; set; }
}
