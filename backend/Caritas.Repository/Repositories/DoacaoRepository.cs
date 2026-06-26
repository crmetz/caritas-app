using Caritas.Models.DTOs.Pagination;
using Caritas.Models.Entities;
using Caritas.Models.Interfaces;
using Caritas.Repository.Context;
using Caritas.Repository.Extensions;
using Microsoft.EntityFrameworkCore;

namespace Caritas.Repository.Repositories;

public class DoacaoRepository(CaritasDbContext context) : BaseRepository<Doacao>(context), IDoacaoRepository
{
    public void Add(Doacao doacao) => DbSet.Add(doacao);

    public async Task<PagedResponseDto<Doacao>> GetPagedAsync(int idParoquia, int page, int pageSize)
        => await DbSet
            .Include(d => d.Doador)
            .Where(d => d.IdParoquia == idParoquia)
            .OrderByDescending(d => d.CriadoEm)
            .ToPagedAsync(page, pageSize);
}
