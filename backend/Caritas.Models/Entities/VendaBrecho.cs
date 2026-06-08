using Caritas.Models.Common;
using Caritas.Models.Enums;

namespace Caritas.Models.Entities;

public class VendaBrecho : AuditableEntity
{
    public int ParoquiaId { get; set; }
    public Paroquia Paroquia { get; set; } = null!;

    public string CompradorNome { get; set; } = string.Empty;
    public string? CompradorCpf { get; set; }
    public string? CompradorIdentificacaoAlternativa { get; set; }
    public FormaPagamento FormaPagamento { get; set; }
    public decimal ValorTotal { get; set; }
    public DateTime DataVenda { get; set; }

    public ICollection<ItemVendaBrecho> Itens { get; set; } = [];
    public LancamentoCaixa? LancamentoCaixa { get; set; }
}
