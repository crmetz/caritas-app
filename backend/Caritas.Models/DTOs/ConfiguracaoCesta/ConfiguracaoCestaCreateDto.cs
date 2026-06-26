using System.ComponentModel.DataAnnotations;

namespace Caritas.Models.DTOs.ConfiguracaoCesta;

public class ConfiguracaoCestaCreateDto
{
    [Required, MaxLength(100)] public string Nome { get; set; } = string.Empty;
    [Required, MinLength(1)] public List<ItemConfiguracaoCestaDto> Itens { get; set; } = [];
}

public class ItemConfiguracaoCestaDto
{
    [Required] public int IdAlimento { get; set; }
    // Tamanho do pacote: valor + unidade (ex.: 1 "kg"); convertido p/ unidade-base no service.
    [Required] public decimal TamanhoValor { get; set; }
    [Required, MaxLength(20)] public string TamanhoUnidade { get; set; } = string.Empty;
    [Range(1, int.MaxValue)] public int QuantidadePacotes { get; set; }
}
