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

    public async Task<PagedResponseDto<Entrega>> GetPagedAsync(
        int idParoquia, int page, int pageSize, string? busca, string? sortKey, string? sortDir)
    {
        var query = DbSet
            .Include(e => e.Familia).ThenInclude(f => f.Responsavel)
            .Where(e => e.IdParoquia == idParoquia);

        if (!string.IsNullOrWhiteSpace(busca))
            query = query.Where(e =>
                e.Familia.Responsavel != null
                && EF.Functions.ILike(e.Familia.Responsavel.Nome, $"%{busca}%"));

        var desc = string.Equals(sortDir, "desc", StringComparison.OrdinalIgnoreCase);
        var ordered = sortKey switch
        {
            "familia" => desc
                ? query.OrderByDescending(e => e.Familia.Responsavel!.Nome)
                : query.OrderBy(e => e.Familia.Responsavel!.Nome),
            // "data" (padrão): mais recente primeiro, salvo asc explícito
            _ => string.Equals(sortDir, "asc", StringComparison.OrdinalIgnoreCase)
                ? query.OrderBy(e => e.CriadoEm)
                : query.OrderByDescending(e => e.CriadoEm),
        };
        return await ordered.ThenByDescending(e => e.Id).ToPagedAsync(page, pageSize);
    }
}
