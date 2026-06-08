using Caritas.Models.Enums;

namespace Caritas.Models.DTOs.Bazar;

public class ItemVendaResponseDto
{
    public int Id { get; set; }
    public int PecaId { get; set; }
    public string PecaCategoria { get; set; } = string.Empty;
    public int Quantidade { get; set; }
    public decimal ValorUnitario { get; set; }
    public decimal Subtotal => Quantidade * ValorUnitario;
}

public class VendaBazarResponseDto
{
    public int Id { get; set; }
    public string CompradorNome { get; set; } = string.Empty;
    public string? CompradorCpf { get; set; }
    public string? CompradorIdentificacaoAlternativa { get; set; }
    public FormaPagamento FormaPagamento { get; set; }
    public decimal ValorTotal { get; set; }
    public DateTime DataVenda { get; set; }
    public IEnumerable<ItemVendaResponseDto> Itens { get; set; } = [];
    public DateTime CriadoEm { get; set; }
    public DateTime AtualizadoEm { get; set; }
}
