using Caritas.Models.Common;

namespace Caritas.Models.Entities;

// Template reutilizável de cesta: que alimentos e quantos pacotes de cada tamanho ela leva.
// Sem validade (a validade é resolvida na montagem, contra o estoque).
public class ConfiguracaoCesta : FullAuditableEntity
{
    public string Nome { get; set; } = string.Empty;
    public int IdParoquia { get; set; }

    public Paroquia Paroquia { get; set; } = null!;
    public List<ItemConfiguracaoCesta> Itens { get; set; } = [];
}
