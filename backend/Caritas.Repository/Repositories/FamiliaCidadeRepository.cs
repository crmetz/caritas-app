using Caritas.Models.Entities;
using Caritas.Repository.Context;
using Microsoft.EntityFrameworkCore;

namespace Caritas.Repository.Repositories;

public class FamiliaCidadeRepository(CaritasDbContext context)
    : BaseRepository<FamiliaCidade>(context)
{
    public async Task<FamiliaCidade?> GetByNomeAsync(string nome)
        => await DbSet.FirstOrDefaultAsync(c => c.Nome.ToLower() == nome.ToLower());
}
