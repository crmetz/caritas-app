using Caritas.Models.Entities;
using Caritas.Models.Interfaces;
using Caritas.Repository.Context;
using Microsoft.EntityFrameworkCore;

namespace Caritas.Repository.Repositories;

public class FamiliaRepository(CaritasDbContext context)
    : BaseRepository<Familia>(context), IFamiliaRepository
{
    public async Task<Familia?> GetWithMembrosAsync(int id)
        => await Context.Familias
            .Include(f => f.Responsavel)
            .Include(f => f.Membros)
            .FirstOrDefaultAsync(f => f.Id == id);
}
