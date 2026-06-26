using System.ComponentModel.DataAnnotations;

namespace Caritas.Models.DTOs.ConfiguracaoCesta;

// Atualização substitui as linhas inteiras (delete + re-add) — mais simples e previsível.
public class ConfiguracaoCestaUpdateDto
{
    [Required, MaxLength(100)] public string Nome { get; set; } = string.Empty;
    [Required, MinLength(1)] public List<ItemConfiguracaoCestaDto> Itens { get; set; } = [];
}
