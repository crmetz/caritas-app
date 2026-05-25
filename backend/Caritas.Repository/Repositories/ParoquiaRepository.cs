using Caritas.Models.Entities;
using Caritas.Models.Interfaces;
using Caritas.Repository.Context;
using Microsoft.EntityFrameworkCore;

namespace Caritas.Repository.Repositories
{
    public class ParoquiaRepository : BaseRepository<Paroquia>, IParoquiaRepository
    {
        public ParoquiaRepository(CaritasDbContext context) : base(context)
        {
        }

        public override async Task<Paroquia?> GetByIdAsync(int id)
        {
            return await DbSet.Include(p => p.Endereco).FirstOrDefaultAsync(p => p.Id == id);
        }

    }
}