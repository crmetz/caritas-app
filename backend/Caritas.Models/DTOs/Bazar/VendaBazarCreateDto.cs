using Caritas.Models.Enums;

namespace Caritas.Models.DTOs.Bazar;

public class VendaBazarCreateDto
{
    public IList<ItemVendaCreateDto> Itens { get; set; } = [];
    public CompradorDto Comprador { get; set; } = null!;
    public FormaPagamento FormaPagamento { get; set; }
    [System.ComponentModel.DataAnnotations.Required]
    public string RegistradoPor { get; set; } = string.Empty;
}
