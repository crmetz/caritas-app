namespace Caritas.Models.DTOs.Entrega;

// Linha da listagem de entregas às famílias.
public class EntregaListItemDto
{
    public int Id { get; set; }
    public int IdFamilia { get; set; }
    public string? NomeFamilia { get; set; }
    public int QtdCestas { get; set; }   // nº de cestas entregues (Σ MovimentacaoCesta.Quantidade)
    public int QtdItens { get; set; }    // nº de linhas de item (alimentos/roupas) da entrega
    public string? Observacao { get; set; }
    public DateTime CriadoEm { get; set; }
}
