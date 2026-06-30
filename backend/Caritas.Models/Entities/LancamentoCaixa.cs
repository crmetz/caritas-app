using Caritas.Models.Common;
using Caritas.Models.Enums;

namespace Caritas.Models.Entities;

public class LancamentoCaixa : AuditableEntity
{
    public int ParoquiaId { get; set; }
    public Paroquia Paroquia { get; set; } = null!;

    public DateTime Data { get; set; }
    public TipoLancamento Tipo { get; set; }
    public decimal Valor { get; set; }

    public OrigemEntrada? Origem { get; set; }
    public DestinoSaida? Destino { get; set; }

    public int? FamiliaId { get; set; }
    public Familia? Familia { get; set; }

    // Preenchido quando gerado automaticamente por venda do Brechó
    public int? VendaBrechoId { get; set; }
    public VendaBrecho? VendaBrecho { get; set; }

    public string Responsavel { get; set; } = string.Empty;
    public bool GeradoAutomaticamente { get; set; }
    public string? Observacoes { get; set; }

    public bool Cancelado { get; set; }
    public DateTime? CanceladoEm { get; set; }
    public string? MotivoCancelamento { get; set; }
}
