using Caritas.Models.Common;

namespace Caritas.Models.Entities;

// Linha de uma ConfiguracaoCesta: um alimento (gênero), o tamanho do pacote e quantos pacotes
// por cesta. Tamanho em unidade-base (g/ml/un).
public class ItemConfiguracaoCesta : Entity
{
    public int IdConfiguracaoCesta { get; set; }
    public int IdAlimento { get; set; }
    public int Tamanho { get; set; }
    public int QuantidadePacotes { get; set; }

    public ConfiguracaoCesta ConfiguracaoCesta { get; set; } = null!;
    public Alimento Alimento { get; set; } = null!;
}
