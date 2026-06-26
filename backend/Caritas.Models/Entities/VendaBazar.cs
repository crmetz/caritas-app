using Caritas.Models.Common;
using Caritas.Models.Enums;

namespace Caritas.Models.Entities;

public class VendaBazar : AuditableEntity
{
    public string CompradorNome { get; set; } = string.Empty;
    public string? CompradorCpf { get; set; }
    public string? CompradorIdentificacaoAlternativa { get; set; }
    public FormaPagamento FormaPagamento { get; set; }
    public decimal ValorTotal { get; set; }
    public DateTime DataVenda { get; set; }

    public string RegistradoPor { get; set; } = string.Empty;
    public bool Cancelado { get; set; }
    public DateTime? CanceladoEm { get; set; }
    public string? MotivoCancelamento { get; set; }
    public string? CanceladoPor { get; set; }

    public ICollection<ItemVendaBazar> Itens { get; set; } = [];
}
