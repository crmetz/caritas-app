namespace Caritas.Models.DTOs.ConfiguracaoCesta;

public class ConfiguracaoCestaResponseDto
{
    public int Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public List<ItemConfiguracaoCestaResponseDto> Itens { get; set; } = [];
}

public class ItemConfiguracaoCestaResponseDto
{
    public int IdAlimento { get; set; }
    public string NomeAlimento { get; set; } = string.Empty;
    public int Tamanho { get; set; }                   // unidade-base
    public string TamanhoFormatado { get; set; } = string.Empty;   // ex.: "1 kg"
    public int QuantidadePacotes { get; set; }
}
