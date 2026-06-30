using Caritas.Models.DTOs.Pagination;
using Caritas.Models.Entities;
using Caritas.Models.Enums;
using Caritas.Models.Interfaces;
using Caritas.Repository.Context;
using Caritas.Repository.Extensions;
using Microsoft.EntityFrameworkCore;

namespace Caritas.Repository.Repositories;

public class DoacaoRepository(CaritasDbContext context) : BaseRepository<Doacao>(context), IDoacaoRepository
{
    public void Add(Doacao doacao) => DbSet.Add(doacao);

    public async Task<PagedResponseDto<Doacao>> GetPagedAsync(
        int idParoquia, int page, int pageSize, string? busca, TipoDoacao? tipo,
        string? sortKey, string? sortDir)
    {
        var query = DbSet.Include(d => d.Doador).Where(d => d.IdParoquia == idParoquia);

        if (!string.IsNullOrWhiteSpace(busca))
            query = query.Where(d => EF.Functions.ILike(d.Doador.Nome, $"%{busca}%"));
        if (tipo is not null) query = query.Where(d => d.Tipo == tipo);

        var desc = string.Equals(sortDir, "desc", StringComparison.OrdinalIgnoreCase);
        var ordered = sortKey switch
        {
            "doador" => desc
                ? query.OrderByDescending(d => d.Doador.Nome)
                : query.OrderBy(d => d.Doador.Nome),
            // "data" (padrão): mais recente primeiro, salvo asc explícito
            _ => string.Equals(sortDir, "asc", StringComparison.OrdinalIgnoreCase)
                ? query.OrderBy(d => d.CriadoEm)
                : query.OrderByDescending(d => d.CriadoEm),
        };
        return await ordered.ThenByDescending(d => d.Id).ToPagedAsync(page, pageSize);
    }
}
