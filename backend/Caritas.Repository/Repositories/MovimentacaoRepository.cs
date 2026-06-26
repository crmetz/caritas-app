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
        int page, int pageSize, int? idItem, int? idParoquia, OrigemMovimentacao? origemTipo)
    {
        var query = DbSet.AsQueryable();
        if (idItem is not null) query = query.Where(m => m.IdItem == idItem);
        if (idParoquia is not null) query = query.Where(m => m.IdParoquia == idParoquia);
        if (origemTipo is not null) query = query.Where(m => m.OrigemTipo == origemTipo);
        return await query.OrderByDescending(m => m.CriadoEm).ToPagedAsync(page, pageSize);
    }

    public void Add(MovimentacaoEstoque movimentacao) => DbSet.Add(movimentacao);
}
