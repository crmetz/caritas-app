using Caritas.Models.DTOs.Pagination;
using Caritas.Models.Entities;
using Caritas.Models.Enums;
using Caritas.Models.Interfaces;
using Caritas.Repository.Context;
using Caritas.Repository.Extensions;
using Microsoft.EntityFrameworkCore;

namespace Caritas.Repository.Repositories;

public class LoteCestaRepository(CaritasDbContext context)
    : BaseRepository<LoteCesta>(context), ILoteCestaRepository
{
    public void Add(LoteCesta lote) => Context.LotesCesta.Add(lote);

    public async Task<PagedResponseDto<LoteCesta>> GetControlePagedAsync(
        int idParoquia, int page, int pageSize, string? busca, OrigemCesta? origem, string? status,
        string? sortKey, string? sortDir)
    {
        var query = Context.LotesCesta
            .Include(l => l.ConfiguracaoCesta)
            .Include(l => l.Doacao!).ThenInclude(d => d.Doador)
            .Where(l => l.IdParoquia == idParoquia);

        if (!string.IsNullOrWhiteSpace(busca))
            query = query.Where(l =>
                (l.ConfiguracaoCesta != null && EF.Functions.ILike(l.ConfiguracaoCesta.Nome, $"%{busca}%"))
                || (l.Doacao != null && l.Doacao.Doador != null
                    && EF.Functions.ILike(l.Doacao.Doador.Nome, $"%{busca}%")));
        if (origem is not null) query = query.Where(l => l.Origem == origem);
        // Status derivado de Quantidade/QuantidadeDisponivel (colunas persistidas).
        if (string.Equals(status, "esgotada", StringComparison.OrdinalIgnoreCase))
            query = query.Where(l => l.QuantidadeDisponivel <= 0);
        else if (string.Equals(status, "parcial", StringComparison.OrdinalIgnoreCase))
            query = query.Where(l => l.QuantidadeDisponivel > 0 && l.QuantidadeDisponivel < l.Quantidade);
        else if (string.Equals(status, "disponivel", StringComparison.OrdinalIgnoreCase))
            query = query.Where(l => l.QuantidadeDisponivel >= l.Quantidade);

        var desc = string.Equals(sortDir, "desc", StringComparison.OrdinalIgnoreCase);
        var ordered = sortKey switch
        {
            "quantidade" => desc
                ? query.OrderByDescending(l => l.Quantidade)
                : query.OrderBy(l => l.Quantidade),
            "saldo" => desc
                ? query.OrderByDescending(l => l.QuantidadeDisponivel)
                : query.OrderBy(l => l.QuantidadeDisponivel),
            // "data" (padrão): mais recente primeiro, salvo asc explícito
            _ => string.Equals(sortDir, "asc", StringComparison.OrdinalIgnoreCase)
                ? query.OrderBy(l => l.CriadoEm)
                : query.OrderByDescending(l => l.CriadoEm),
        };
        return await ordered.ThenByDescending(l => l.Id).ToPagedAsync(page, pageSize);
    }

    public async Task<List<LoteCesta>> GetDisponiveisAsync(int idParoquia)
        => await Context.LotesCesta
            .Include(l => l.ConfiguracaoCesta)
            .Include(l => l.Doacao!).ThenInclude(d => d.Doador)
            .Where(l => l.IdParoquia == idParoquia && l.QuantidadeDisponivel > 0)
            .OrderByDescending(l => l.CriadoEm)
            .ToListAsync();
}
