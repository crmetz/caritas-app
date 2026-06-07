using Caritas.Models.Enums;

namespace Caritas.Models.DTOs.Caixa;

public class EntradaPorOrigemDto
{
    public OrigemEntrada Origem { get; set; }
    public decimal Total { get; set; }
}

public class SaidaPorDestinoDto
{
    public DestinoSaida Destino { get; set; }
    public decimal Total { get; set; }
}

public class FamiliaBeneficiadaDto
{
    public string Familia { get; set; } = string.Empty;
    public decimal Total { get; set; }
}

public class RelatorioCaixaDto
{
    public decimal TotalEntradas { get; set; }
    public decimal TotalSaidas { get; set; }
    public decimal Saldo => TotalEntradas - TotalSaidas;
    public IEnumerable<EntradaPorOrigemDto> EntradasPorOrigem { get; set; } = [];
    public IEnumerable<SaidaPorDestinoDto> SaidasPorDestino { get; set; } = [];
    public IEnumerable<FamiliaBeneficiadaDto> FamiliasBeneficiadas { get; set; } = [];
}
