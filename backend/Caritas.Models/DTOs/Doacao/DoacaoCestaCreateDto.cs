using System.ComponentModel.DataAnnotations;

namespace Caritas.Models.DTOs.Doacao;

// Registro de uma doação de cestas fechadas recebidas (doador + quantidade).
// Gera uma Doacao(Tipo=CestasFechadas) + um LoteCesta(Origem=Doacao).
public class DoacaoCestaCreateDto
{
    [Required] public int IdDoador { get; set; }
    [Range(1, int.MaxValue)] public int Quantidade { get; set; }
    [MaxLength(500)] public string? Observacao { get; set; }
}
