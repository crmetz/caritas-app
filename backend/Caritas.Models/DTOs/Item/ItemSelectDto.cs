using Caritas.Models.Enums;

namespace Caritas.Models.DTOs.Item;

// Opção de seleção de item enriquecida: além de value/label, carrega o tipo e (para alimentos) a
// forma de medida, para que o front escolha o modo do campo de quantidade (medida vs. contagem).
public class ItemSelectDto
{
    public int Value { get; set; }
    public string? Label { get; set; }
    public TipoItem Tipo { get; set; }
    public FormaMedida? FormaMedida { get; set; }
}
