using Caritas.Models.Common;
using Microsoft.EntityFrameworkCore;

namespace Caritas.Models.Entities;

public class SessaoCaixaBrecho : AuditableEntity
{
    public int ParoquiaId { get; set; }
    public Paroquia Paroquia { get; set; } = null!;

    public string AbertoPor { get; set; } = string.Empty;
    public string? FechadoPor { get; set; }
    public DateTime AbertoEm { get; set; }
    public DateTime? FechadoEm { get; set; }

    [Precision(18, 2)]
    public decimal SaldoInicial { get; set; }

    [Precision(18, 2)]
    public decimal? SaldoFinalContado { get; set; }

    [Precision(18, 2)]
    public decimal? SaldoFinalCalculado { get; set; }

    [Precision(18, 2)]
    public decimal? Diferenca { get; set; }

    public string? Observacoes { get; set; }
    public bool Aberto { get; set; } = true;
}
