using Caritas.Models.DTOs.Common;
using Caritas.Models.DTOs.Item;
using Caritas.Models.Enums;

namespace Caritas.Models.Interfaces.Services;

public interface IItemService
{
    Task<AlimentoResponseDto> CreateAlimentoAsync(AlimentoCreateDto dto);
    Task<AlimentoResponseDto> UpdateAlimentoAsync(int id, AlimentoUpdateDto dto);
    Task<RoupaResponseDto> CreateRoupaAsync(RoupaCreateDto dto);
    Task<RoupaResponseDto> UpdateRoupaAsync(int id, RoupaUpdateDto dto);
    Task DeleteAsync(int id);
    Task<List<ItemSelectDto>> GetSelectAsync(TipoItem? tipo);
    Task<List<AlimentoResponseDto>> GetAlimentosAsync();   // catálogo de gêneros
}
