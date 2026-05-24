using Caritas.Models.Entities;
using Caritas.Repository.Context;
using Microsoft.EntityFrameworkCore;

namespace Caritas.Repository.Repositories
{
    public class ParoquiaRepository
    {
        private readonly CaritasDbContext _context;
        public ParoquiaRepository(CaritasDbContext context)
        {
            _context = context;
        }

        public async Task<Paroquia> GetByIdAsync(long id)
        {
            return await _context.Paroquias
                .AsNoTracking()
                .Include(p => p.Endereco)
                .FirstOrDefaultAsync(p => p.Id == id);
        }

        public async Task<Paroquia> AddAsync(Paroquia paroquia)
        {
            await _context.Paroquias.AddAsync(paroquia);
            await _context.SaveChangesAsync();
            return paroquia;
        }

        public async Task<Paroquia> UpdateAsync(Paroquia paroquia)
        {
            _context.Paroquias.Update(paroquia);
            await _context.SaveChangesAsync();
            return paroquia;
        }

        public async Task DeleteAsync(Paroquia paroquia)
        {
            _context.Paroquias.Remove(paroquia);
            await _context.SaveChangesAsync();
        }
    }
}