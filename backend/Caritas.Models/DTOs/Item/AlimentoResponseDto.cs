using Caritas.Models.Enums;

namespace Caritas.Models.DTOs.Item;

public class AlimentoResponseDto
{
    public int Id { get; set; }
    public string Descricao { get; set; } = string.Empty;
    public FormaMedida FormaMedida { get; set; }
    public bool EmUso { get; set; }   // vinculado a estoque/movimentação/cesta → não pode ser excluído
    public DateTime CriadoEm { get; set; }
    public DateTime AtualizadoEm { get; set; }
}
