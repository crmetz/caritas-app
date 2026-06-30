using Caritas.Models.DTOs.LoteCesta;
using Caritas.Models.DTOs.Montagem;

namespace Caritas.Models.Interfaces.Services;

public interface IMontagemCestaService
{
    // Etapa 1: propõe quais pacotes/validades usar (não altera estado).
    Task<MontagemPropostaDto> SimularAsync(MontagemSimularDto dto);
    // Etapa 2: confirma a montagem — baixa o estoque e cria o LoteCesta.
    Task<LoteCestaResponseDto> ConfirmarAsync(MontagemConfirmarDto dto);
}
