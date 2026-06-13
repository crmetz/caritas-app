using Caritas.Models.DTOs.Atendimento;
using Caritas.Models.DTOs.Pagination;
using Caritas.Models.Entities;
using Caritas.Models.Interfaces;
using Caritas.Repository.Context;
using Caritas.Repository.Extensions;
using Microsoft.EntityFrameworkCore;

namespace Caritas.Repository.Repositories;

public class AtendimentoRepository(CaritasDbContext context)
    : BaseRepository<Atendimento>(context), IAtendimentoRepository
{
    public async Task<Atendimento?> GetByIdWithRelacionamentosAsync(int id)
        => await Context.Atendimentos
            .Include(a => a.Familia)
                .ThenInclude(f => f.Responsavel)
            .Include(a => a.Paroquia)
            .Include(a => a.Voluntario)
            .AsSplitQuery()
            .FirstOrDefaultAsync(a => a.Id == id);

    public async Task<List<Atendimento>> GetByFamiliaOrderedAsync(int familiaId)
        => await Context.Atendimentos
            .Include(a => a.Familia)
                .ThenInclude(f => f.Responsavel)
            .Where(a => a.FamiliaId == familiaId)
            .OrderBy(a => a.DataAtendimento)
            .ThenBy(a => a.CriadoEm)
            .ToListAsync();

    public async Task<List<Atendimento>> GetByParoquiaOrderedAsync(int paroquiaId)
        => await Context.Atendimentos
            .Where(a => a.ParoquiaId == paroquiaId)
            .OrderBy(a => a.DataAtendimento)
            .ThenBy(a => a.CriadoEm)
            .ToListAsync();

    public async Task<PagedResponseDto<Atendimento>> GetPagedAsync(int page, int pageSize, AtendimentoFilterDto filter)
        => await Context.Atendimentos
            .Include(a => a.Familia)
                .ThenInclude(f => f.Responsavel)
            .Include(a => a.Paroquia)
            .Include(a => a.Voluntario)
            .AsSplitQuery()
            .Where(a => filter.FamiliaId == null || a.FamiliaId == filter.FamiliaId)
            .Where(a => filter.ParoquiaId == null || a.ParoquiaId == filter.ParoquiaId)
            .Where(a => filter.VoluntarioId == null || a.VoluntarioId == filter.VoluntarioId)
            .Where(a => filter.SituacaoGeral == null || a.SituacaoGeral == filter.SituacaoGeral)
            .Where(a => filter.DataInicio == null || a.DataAtendimento >= filter.DataInicio)
            .Where(a => filter.DataFim == null || a.DataAtendimento <= filter.DataFim)
            .OrderByDescending(a => a.DataAtendimento)
            .ThenByDescending(a => a.CriadoEm)
            .ToPagedAsync(page, pageSize);
}
