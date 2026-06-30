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

    public async Task<PagedResponseDto<ConfiguracaoCesta>> GetPagedWithItensAsync(
        int idParoquia, int page, int pageSize, string? busca, string? sortDir)
    {
        var query = Context.ConfiguracoesCesta
            .Include(c => c.Itens).ThenInclude(i => i.Alimento)
            .Where(c => c.IdParoquia == idParoquia);

        if (!string.IsNullOrWhiteSpace(busca))
            query = query.Where(c => EF.Functions.ILike(c.Nome, $"%{busca}%"));

        var desc = string.Equals(sortDir, "desc", StringComparison.OrdinalIgnoreCase);
        var ordered = desc ? query.OrderByDescending(c => c.Nome) : query.OrderBy(c => c.Nome);
        return await ordered.ThenBy(c => c.Id).ToPagedAsync(page, pageSize);
    }

    public Task SaveAsync() => Context.SaveChangesAsync();
}
