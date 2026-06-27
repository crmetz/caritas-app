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
        int page, int pageSize, int? idItem, int? idParoquia, OrigemMovimentacao? origemTipo, TipoItem? tipoItem)
    {
        var query = DbSet.AsQueryable();
        if (idItem is not null) query = query.Where(m => m.IdItem == idItem);
        if (idParoquia is not null) query = query.Where(m => m.IdParoquia == idParoquia);
        if (origemTipo is not null) query = query.Where(m => m.OrigemTipo == origemTipo);
        if (tipoItem is not null)
            query = query.Where(m => Context.Items.Any(i => i.Id == m.IdItem && i.Tipo == tipoItem));
        return await query.OrderByDescending(m => m.CriadoEm).ToPagedAsync(page, pageSize);
    }

    public void Add(MovimentacaoEstoque movimentacao) => DbSet.Add(movimentacao);
}
