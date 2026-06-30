using Caritas.Models.DTOs.Pagination;
using Caritas.Models.Entities;
using Caritas.Models.Enums;
using Caritas.Models.Interfaces;
using Caritas.Repository.Context;
using Caritas.Repository.Extensions;
using Microsoft.EntityFrameworkCore;

namespace Caritas.Repository.Repositories;

public class MovimentacaoRepository(CaritasDbContext context)
    : BaseRepository<MovimentacaoEstoque>(context), IMovimentacaoRepository
{
    public async Task<PagedResponseDto<MovimentacaoEstoque>> GetHistoricoAsync(
        int page, int pageSize, int? idItem, int? idParoquia, OrigemMovimentacao? origemTipo,
        TipoItem? tipoItem, TipoOperacao? tipoOperacao, string? sortDir)
    {
        var query = DbSet.AsQueryable();
        if (idItem is not null) query = query.Where(m => m.IdItem == idItem);
        if (idParoquia is not null) query = query.Where(m => m.IdParoquia == idParoquia);
        if (origemTipo is not null) query = query.Where(m => m.OrigemTipo == origemTipo);
        if (tipoOperacao is not null) query = query.Where(m => m.TipoOperacao == tipoOperacao);
        if (tipoItem is not null)
            query = query.Where(m => Context.Items.Any(i => i.Id == m.IdItem && i.Tipo == tipoItem));

        // Única coluna ordenável é a data; padrão é a mais recente primeiro.
        var asc = string.Equals(sortDir, "asc", StringComparison.OrdinalIgnoreCase);
        var ordered = asc ? query.OrderBy(m => m.CriadoEm) : query.OrderByDescending(m => m.CriadoEm);
        return await ordered.ThenByDescending(m => m.Id).ToPagedAsync(page, pageSize);
    }

    public void Add(MovimentacaoEstoque movimentacao) => DbSet.Add(movimentacao);
}
