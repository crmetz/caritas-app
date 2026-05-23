using Caritas.Models.Entities;

namespace Caritas.Models.Interfaces;

public interface IFamiliaRepository : IBaseRepository<Familia>
{
    Task<Familia?> GetWithMembrosAsync(int id);
}
