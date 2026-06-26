using Caritas.Models.DTOs.Pagination;
using Caritas.Models.Entities;
using Caritas.Models.Interfaces;
using Caritas.Repository.Context;
using Caritas.Repository.Extensions;
using Microsoft.EntityFrameworkCore;

namespace Caritas.Repository.Repositories;

public class LoteCestaRepository(CaritasDbContext context)
    : BaseRepository<LoteCesta>(context), ILoteCestaRepository
{
    public void Add(LoteCesta lote) => Context.LotesCesta.Add(lote);

    public async Task<PagedResponseDto<LoteCesta>> GetControlePagedAsync(int idParoquia, int page, int pageSize)
        => await Context.LotesCesta
            .Include(l => l.ConfiguracaoCesta)
            .Include(l => l.Doacao!).ThenInclude(d => d.Doador)
            .Where(l => l.IdParoquia == idParoquia)
            .OrderByDescending(l => l.CriadoEm)
            .ToPagedAsync(page, pageSize);

    public async Task<List<LoteCesta>> GetDisponiveisAsync(int idParoquia)
        => await Context.LotesCesta
            .Include(l => l.ConfiguracaoCesta)
            .Include(l => l.Doacao!).ThenInclude(d => d.Doador)
            .Where(l => l.IdParoquia == idParoquia && l.QuantidadeDisponivel > 0)
            .OrderByDescending(l => l.CriadoEm)
            .ToListAsync();
}
