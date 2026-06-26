using Caritas.Models.DTOs.Pagination;
using Caritas.Models.Entities;
using Caritas.Models.Interfaces;
using Caritas.Repository.Context;
using Caritas.Repository.Extensions;
using Microsoft.EntityFrameworkCore;

namespace Caritas.Repository.Repositories;

public class EntregaRepository(CaritasDbContext context) : BaseRepository<Entrega>(context), IEntregaRepository
{
    public void Add(Entrega entrega) => DbSet.Add(entrega);

    public async Task<PagedResponseDto<Entrega>> GetPagedAsync(int idParoquia, int page, int pageSize)
        => await DbSet
            .Include(e => e.Familia).ThenInclude(f => f.Responsavel)
            .Where(e => e.IdParoquia == idParoquia)
            .OrderByDescending(e => e.CriadoEm)
            .ToPagedAsync(page, pageSize);
}
