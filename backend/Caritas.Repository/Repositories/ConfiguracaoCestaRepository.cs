using Caritas.Models.DTOs.Pagination;
using Caritas.Models.Entities;
using Caritas.Models.Interfaces;
using Caritas.Repository.Context;
using Caritas.Repository.Extensions;
using Microsoft.EntityFrameworkCore;

namespace Caritas.Repository.Repositories;

public class ConfiguracaoCestaRepository(CaritasDbContext context)
    : BaseRepository<ConfiguracaoCesta>(context), IConfiguracaoCestaRepository
{
    public async Task<ConfiguracaoCesta?> GetByIdWithItensAsync(int id)
        => await Context.ConfiguracoesCesta
            .Include(c => c.Itens).ThenInclude(i => i.Alimento)
            .FirstOrDefaultAsync(c => c.Id == id);

    public async Task<PagedResponseDto<ConfiguracaoCesta>> GetPagedWithItensAsync(int idParoquia, int page, int pageSize)
        => await Context.ConfiguracoesCesta
            .Include(c => c.Itens).ThenInclude(i => i.Alimento)
            .Where(c => c.IdParoquia == idParoquia)
            .OrderBy(c => c.Nome)
            .ToPagedAsync(page, pageSize);

    public Task SaveAsync() => Context.SaveChangesAsync();
}
