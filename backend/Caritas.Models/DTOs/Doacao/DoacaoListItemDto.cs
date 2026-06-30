using Caritas.Models.Enums;

namespace Caritas.Models.DTOs.Doacao;

// Linha da listagem unificada de doações.
public class DoacaoListItemDto
{
    public int Id { get; set; }
    public TipoDoacao Tipo { get; set; }
    public int IdDoador { get; set; }
    public string? NomeDoador { get; set; }
    public int Quantidade { get; set; }   // Itens: nº de linhas de item; CestasFechadas: nº de cestas
    public string? Observacao { get; set; }
    public DateTime CriadoEm { get; set; }
}
