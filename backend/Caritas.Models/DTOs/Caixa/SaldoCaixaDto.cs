using System.ComponentModel.DataAnnotations;

namespace Caritas.Models.DTOs.Caixa;

public class SaldoCaixaDto
{
    public decimal TotalEntradas { get; set; }
    public decimal TotalSaidas { get; set; }
    public decimal Saldo { get; set; }
}
