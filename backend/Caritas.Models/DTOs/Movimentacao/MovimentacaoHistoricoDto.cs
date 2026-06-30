using Caritas.Models.Enums;

namespace Caritas.Models.DTOs.Movimentacao;

// Linha do histórico de movimentações, já com nome e tipo do item resolvidos para exibição.
public class MovimentacaoHistoricoDto
{
    public int Id { get; set; }
    public int IdItem { get; set; }
    public string? Descricao { get; set; }
    public TipoItem? TipoItem { get; set; }
    public int? Tamanho { get; set; }
    public DateOnly? Validade { get; set; }
    public string? Lote { get; set; }
    public TipoOperacao TipoOperacao { get; set; }
    public int Quantidade { get; set; }
    public OrigemMovimentacao OrigemTipo { get; set; }
    public int? OrigemId { get; set; }
    public string? Observacao { get; set; }
    public DateTime CriadoEm { get; set; }
}
