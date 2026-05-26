using Caritas.Models.Entities;

namespace Caritas.Models.Interfaces
{
    public interface IUsuarioRepository : IBaseRepository<Usuario>
    {
        Task<Usuario> GetByEmailAsync(string email);
    }
}
