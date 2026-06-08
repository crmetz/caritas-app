using Caritas.Models.DTOs.Bazar;
using Caritas.Models.Enums;

namespace Caritas.Models.DTOs.Brecho;

public class VendaBrechoCreateDto
{
    public int ParoquiaId { get; set; }
    public IList<ItemVendaCreateDto> Itens { get; set; } = [];
    public CompradorDto Comprador { get; set; } = null!;
    public FormaPagamento FormaPagamento { get; set; }
}
