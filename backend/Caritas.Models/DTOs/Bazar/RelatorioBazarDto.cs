namespace Caritas.Models.DTOs.Bazar;

public class VendaPorCategoriaDto
{
    public string Categoria { get; set; } = string.Empty;
    public int Quantidade { get; set; }
    public decimal Total { get; set; }
}

public class RelatorioBazarDto
{
    public int TotalPecasVendidas { get; set; }
    public decimal TotalArrecadado { get; set; }
    public IEnumerable<VendaPorCategoriaDto> VendasPorCategoria { get; set; } = [];
}
