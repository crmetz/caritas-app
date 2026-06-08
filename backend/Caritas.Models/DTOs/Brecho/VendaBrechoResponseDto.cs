using Caritas.Models.Enums;

namespace Caritas.Models.DTOs.Brecho;

public class ItemVendaBrechoResponseDto
{
    public string Categoria { get; set; } = string.Empty;
    public int Quantidade { get; set; }
    public decimal ValorUnitario { get; set; }
}

public class VendaBrechoResponseDto
{
    public int Id { get; set; }
    public DateTime DataVenda { get; set; }
    public string CompradorNome { get; set; } = string.Empty;
    public string? CompradorCpf { get; set; }
    public string? CompradorIdentificacaoAlternativa { get; set; }
    public FormaPagamento FormaPagamento { get; set; }
    public decimal ValorTotal { get; set; }
    public int QuantidadeItens { get; set; }
    public IEnumerable<ItemVendaBrechoResponseDto> Itens { get; set; } = [];
    public DateTime CriadoEm { get; set; }
}
