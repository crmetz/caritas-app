using Caritas.Models.DTOs.Pagination;
using Caritas.Models.Entities;
using Caritas.Models.Interfaces;
using Caritas.Repository.Context;
using Caritas.Repository.Extensions;
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

        public async Task<PagedResponseDto<Paroquia>> GetPagedWithEnderecoAsync(int page, int pageSize)
        {
            return await DbSet.Include(p => p.Endereco)
                .Where(p => !p.Raiz)
                .OrderBy(p => p.CriadoEm)
                .ToPagedAsync(page, pageSize);
        }

    }
}