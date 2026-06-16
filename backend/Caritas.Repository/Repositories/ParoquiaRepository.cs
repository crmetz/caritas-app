using Caritas.Models.DTOs.Paroquia;
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

        public async Task<PagedResponseDto<Paroquia>> GetPagedWithEnderecoAsync(ParoquiaPagedRequestDto request, IList<int>? paroquiaIds = null)
        {
            var query = DbSet.Include(p => p.Endereco)
                .Where(p => !p.Raiz);

            if (paroquiaIds != null)
                query = query.Where(p => paroquiaIds.Contains(p.Id));

            if (!string.IsNullOrWhiteSpace(request.Nome))
                query = query.Where(p => EF.Functions.ILike(p.Nome, $"%{request.Nome}%"));

            if (!string.IsNullOrWhiteSpace(request.Cidade))
                query = query.Where(p => p.Endereco != null && EF.Functions.ILike(p.Endereco.Cidade!, $"%{request.Cidade}%"));

            if (!string.IsNullOrWhiteSpace(request.Bairro))
                query = query.Where(p => p.Endereco != null && EF.Functions.ILike(p.Endereco.Bairro!, $"%{request.Bairro}%"));

            return await query.OrderBy(p => p.CriadoEm).ToPagedAsync(request.Page, request.PageSize);
        }
    }
}