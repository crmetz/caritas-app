using Caritas.Models.DTOs.Pagination;
using Caritas.Models.DTOs.Usuario;
using Caritas.Models.Entities;

namespace Caritas.Models.Interfaces
{
    public interface IUsuarioRepository
    {
        Task<Usuario?> GetByIdAsync(int id);
        Task<Usuario?> GetByEmailAsync(string email);
        Task<PagedResponseDto<Usuario>> GetPagedAsync(int page, int pageSize, IList<int>? paroquiaIds = null);
        Task<IList<int>> GetParoquiaIdsByUserIdAsync(int userId);
        Task UpdateAsync(Usuario usuario);
        Task DeleteAsync(int id);
    }
}
