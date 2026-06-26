using Caritas.Models.Enums;

namespace Caritas.Models.DTOs.Movimentacao;

public class MovimentacaoResponseDto
{
    public int Id { get; set; }
    public int IdItem { get; set; }
    public int IdParoquia { get; set; }
    public int? Tamanho { get; set; }
    public DateOnly? Validade { get; set; }
    public string? Lote { get; set; }
    public TipoOperacao TipoOperacao { get; set; }
    public int Quantidade { get; set; }
    public OrigemMovimentacao OrigemTipo { get; set; }
    public int? OrigemId { get; set; }
    public string? Observacao { get; set; }
    public DateTime CriadoEm { get; set; }
    public int? CriadoPor { get; set; }
}
